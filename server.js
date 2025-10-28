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

// Conexión
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_this';

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// REGISTER
app.post('/register', async (req, res) => {
  const { username, password, rol } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'missing fields' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    // get rol id
    const roleRes = await pool.query('SELECT id FROM roles WHERE nombre=$1', [rol || 'jugador']);
    const rolId = roleRes.rows[0] ? roleRes.rows[0].id : null;
    await pool.query('INSERT INTO usuarios (username, password, rol_id) VALUES ($1, $2, $3)', [username, hashed, rolId]);
    res.json({ ok: true });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'user exists' });
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// LOGIN
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const r = await pool.query('SELECT id, password, rol_id FROM usuarios WHERE username=$1', [username]);
  if (r.rows.length === 0) return res.status(401).json({ error: 'invalid creds' });
  const user = r.rows[0];
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'invalid creds' });
  // get role name
  const roleRes = await pool.query('SELECT nombre FROM roles WHERE id=$1', [user.rol_id]);
  const roleName = roleRes.rows[0] ? roleRes.rows[0].nombre : null;
  const token = jwt.sign({ id: user.id, username, role: roleName }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// middleware auth
function auth(requiredRole) {
  return (req, res, next) => {
    const h = req.headers.authorization;
    if (!h) return res.status(401).json({ error: 'no auth' });
    const token = h.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      if (requiredRole && payload.role !== requiredRole) return res.status(403).json({ error: 'forbidden' });
      next();
    } catch (e) {
      return res.status(401).json({ error: 'invalid token' });
    }
  };
}

// CRUD usuarios (solo admin)
app.get('/admin/users', auth('admin'), async (req, res) => {
  const r = await pool.query('SELECT id, username, rol_id, creado_en FROM usuarios');
  res.json(r.rows);
});

app.delete('/admin/users/:id', auth('admin'), async (req, res) => {
  await pool.query('DELETE FROM usuarios WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// Guardar puntuación vía PROCEDURE (recomendado)
app.post('/score/procedure', auth(), async (req, res) => {
  const { score } = req.body;
  if (typeof score !== 'number') return res.status(400).json({ error: 'invalid score' });
  try {
    await pool.query('CALL agregar_puntuacion($1, $2)', [req.user.id, score]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'procedure error' });
  }
});

// Alternativa: guardar puntuacion directo
app.post('/score', auth(), async (req, res) => {
  const { score } = req.body;
  if (typeof score !== 'number') return res.status(400).json({ error: 'invalid score' });
  await pool.query('INSERT INTO puntuaciones (usuario_id, puntuacion) VALUES ($1, $2)', [req.user.id, score]);
  res.json({ ok: true });
});

// Obtener top scores
app.get('/scores/top', async (req, res) => {
  const r = await pool.query(`
    SELECT s.id, s.puntuacion, s.creado_en, u.username
    FROM puntuaciones s
    JOIN usuarios u ON s.usuario_id = u.id
    ORDER BY s.puntuacion DESC
    LIMIT 20
  `);
  res.json(r.rows);
});

// Endpoint para admin: usar procedimiento cambiar_rol_usuario
app.post('/admin/change-role', auth('admin'), async (req, res) => {
  const { username, nuevo_rol } = req.body;
  try {
    await pool.query('CALL cambiar_rol_usuario($1, $2)', [username, nuevo_rol]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'procedure error' });
  }
});

// Endpoint para ver logs (admin)
app.get('/admin/logs', auth('admin'), async (req, res) => {
  const r = await pool.query('SELECT * FROM log_actividades ORDER BY creado_en DESC LIMIT 100');
  res.json(r.rows);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
