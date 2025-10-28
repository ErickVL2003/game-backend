// seed.js
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  try {
    const hashedAdmin = await bcrypt.hash('AdminPass123!', 10);
    const hashedUser = await bcrypt.hash('UserPass123!', 10);

    // Crear admin si no existe
    await pool.query(`
      INSERT INTO usuarios (username, password, rol_id)
      SELECT $1, $2, r.id FROM roles r WHERE r.nombre='admin'
      ON CONFLICT (username) DO NOTHING
    `, ['admin', hashedAdmin]);

    // Crear un jugador demo
    await pool.query(`
      INSERT INTO usuarios (username, password, rol_id)
      SELECT $1, $2, r.id FROM roles r WHERE r.nombre='jugador'
      ON CONFLICT (username) DO NOTHING
    `, ['player1', hashedUser]);

    console.log('Seed complete');
  } catch (err) {
    console.error('Seed error', err);
  } finally {
    await pool.end();
  }
}

seed();
