// server.js
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({ origin: true }));

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false } // necesario para Render
});

const JWT_SECRET = process.env.JWT_SECRET || 'clave_super_secreta';

// Endpoint de prueba
app.get('/health', (req, res) => res.json({ ok: true }));

// Registro de usuario
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'missing fields' });
    const hashed = await bcrypt.hash(password, 10);
    try {
        await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashed]);
        res.json({ ok: true });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'user exists' }); // unique_violation
        console.error(err);
        res.status(500).json({ error: 'db error' });
    }
});

// Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await pool.query('SELECT id, password FROM users WHERE username=$1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'invalid creds' });
    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'invalid creds' });
    const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
});

// Middleware de autenticación
function auth(req, res, next) {
    const h = req.headers.authorization;
    if (!h) return res.status(401).json({ error: 'no auth' });
    const token = h.split(' ')[1];
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'invalid token' });
    }
}

// Guardar score
app.post('/score', auth, async (req, res) => {
    const { score } = req.body;
    if (typeof score !== 'number') return res.status(400).json({ error: 'invalid score' });
    await pool.query('INSERT INTO scores (user_id, score) VALUES ($1, $2)', [req.user.id, score]);
    res.json({ ok: true });
});

// Top 20
app.get('/scores/top', async (req, res) => {
    const result = await pool.query(`
    SELECT s.score, u.username
    FROM scores s
    JOIN users u ON s.user_id = u.id
    ORDER BY s.score DESC
    LIMIT 20
  `);
    res.json(result.rows);
});
// Llamar procedimiento agregar_puntuacion
app.post('/score/procedure', auth, async (req, res) => {
    const { score } = req.body;
    try {
        await pool.query('CALL agregar_puntuacion($1, $2)', [req.user.id, score]);
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'error en procedimiento' });
    }
});

// Llamar procedimiento cambiar_rol_usuario (solo admin)
app.post('/admin/change-role', auth, async (req, res) => {
    if (req.user.username !== 'admin') return res.status(403).json({ error: 'no autorizado' });
    const { username, nuevo_rol } = req.body;
    try {
        await pool.query('CALL cambiar_rol_usuario($1, $2)', [username, nuevo_rol]);
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'error en procedimiento' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
