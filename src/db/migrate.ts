import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(sql);
  console.log('✅ Migración PostgreSQL completada');
  await pool.end();
}

migrate().catch((err) => {
  console.error('❌ Error en migración:', err);
  process.exit(1);
});
