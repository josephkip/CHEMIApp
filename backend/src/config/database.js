const knex = require('knex');
const config = require('./env');

const isProduction = config.NODE_ENV === 'production';

const knexConfig = {
  client: 'pg',
  connection: isProduction
    ? {
        connectionString: config.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : config.DATABASE_URL,
  pool: { min: 0, max: 5 },
  acquireConnectionTimeout: 30000
};

const db = knex(knexConfig);

// Test connection
db.raw('SELECT 1')
  .then(() => console.log('✅ PostgreSQL connected successfully'))
  .catch(err => console.error('❌ PostgreSQL connection failed:', err.message));

module.exports = db;
