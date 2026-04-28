const path = require('path');

// Load .env for local development (Vercel uses env vars directly)
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Set NODE_ENV to production if on Vercel
if (process.env.VERCEL) {
  process.env.NODE_ENV = 'production';
}

const app = require(path.join(__dirname, '../backend/src/app'));

module.exports = app;
