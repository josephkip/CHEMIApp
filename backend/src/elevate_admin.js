require('dotenv').config({ path: '../../.env' });
const knex = require('./config/database');

async function elevate() {
  try {
    const updated = await knex('users')
      .where('role', 'admin')
      .update({ role: 'super_admin' });
    console.log(`Elevated ${updated} admins to super_admin.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}
elevate();
