const knex = require('knex');
const config = require('./env');

const knexConfig = {
  client: 'pg',
  connection: config.DATABASE_URL,
  pool: { min: 2, max: 10 },
  acquireConnectionTimeout: 10000
};

const db = knex(knexConfig);

// Test connection
db.raw('SELECT 1')
  .then(() => console.log('✅ PostgreSQL connected successfully'))
  .catch(err => console.error('❌ PostgreSQL connection failed:', err.message));

module.exports = db;
