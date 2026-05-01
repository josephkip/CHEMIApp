require('dotenv').config({ path: '../../.env' });
const knex = require('./config/database');

async function elevate() {
  try {
    const updated = await knex('users')
      .whereIn('username', ['jkk', 'admin'])
      .update({ role: 'super_admin' });
    
    console.log(`Successfully elevated ${updated} user(s) to super_admin.`);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
elevate();
