/**
 * Run once to insert the two seed users.
 * From the backend/ directory:  node scripts/seed-users.js
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port:     Number(process.env.DB_PORT) || 5432,
});

async function seed() {
  const adminHash  = await bcrypt.hash('Admin@123',  10);
  const viewerHash = await bcrypt.hash('Viewer@123', 10);

  await pool.query(
    `INSERT INTO users (email, password_hash, role, name)
     VALUES
       ('admin@janbros.com',  $1, 'admin',  'Admin User'),
       ('viewer@janbros.com', $2, 'viewer', 'Viewer User')
     ON CONFLICT (email) DO NOTHING`,
    [adminHash, viewerHash]
  );

  console.log('✅ Seed users inserted (or already existed).');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
