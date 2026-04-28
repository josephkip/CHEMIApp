const path = require('path');

// Support multiple .env locations:
// 1. DOTENV_CONFIG_PATH env var (set by Electron main.js)
// 2. Relative to backend root (dev mode: backend/../.env)
// 3. Adjacent to the executable (packaged mode)
const envPaths = [
  process.env.DOTENV_CONFIG_PATH,
  path.join(__dirname, '../../../.env'),
  path.join(__dirname, '../../.env'),
  path.join(process.cwd(), '.env')
].filter(Boolean);

let envLoaded = false;
for (const envPath of envPaths) {
  const result = require('dotenv').config({ path: envPath });
  if (!result.error) {
    console.log(`✅ Loaded .env from: ${envPath}`);
    envLoaded = true;
    break;
  }
}
if (!envLoaded) {
  console.warn('⚠ No .env file found, using environment variables and defaults');
}

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  PHARMACY: {
    name: process.env.PHARMACY_NAME || 'CHEMIApp Pharmacy',
    phone: process.env.PHARMACY_PHONE || '+254700000000',
    email: process.env.PHARMACY_EMAIL || 'info@chemiapp.com',
    address: process.env.PHARMACY_ADDRESS || 'Nairobi, Kenya',
    license: process.env.PHARMACY_LICENSE || 'PHARM-2024-001',
    currency: process.env.CURRENCY || 'KES'
  }
};
