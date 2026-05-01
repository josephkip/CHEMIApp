require('dotenv').config({ path: '../../.env' });
const knex = require('./config/database');
const bcrypt = require('bcryptjs');

async function fixAdmins() {
  try {
    const hash = await bcrypt.hash('Admin@123', 12);
    
    // Demote jkk
    await knex('users').where('username', 'jkk').update({ role: 'admin' });
    
    // Ensure admin is super_admin and has password Admin@123
    await knex('users').where('username', 'admin').update({ role: 'super_admin', password_hash: hash });
    
    console.log('Fixed users!');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
fixAdmins();
