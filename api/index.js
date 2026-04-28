const path = require('path');

// Load env from root .env if present (local dev)
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require(path.join(__dirname, '../backend/src/app'));

module.exports = app;
