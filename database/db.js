const fs = require('fs');
const path = require('path');
const knex = require('knex');

const db = knex({
  client: 'better-sqlite3',
  connection: { filename: process.env.DB_FILE || path.join(__dirname, 'prism.sqlite') },
  useNullAsDefault: true,
});

// Applies schema.sql (idempotent: CREATE TABLE IF NOT EXISTS)
async function init() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  for (const stmt of sql.split(';').map((s) => s.trim()).filter(Boolean)) {
    await db.raw(stmt);
  }
}

module.exports = { db, init };

if (require.main === module) {
  init()
    .then(() => { console.log('Database schema applied.'); return db.destroy(); })
    .catch((e) => { console.error(e); process.exit(1); });
}
