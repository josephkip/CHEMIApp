const { Client } = require('pg');

const url = 'postgresql://postgres.cqjtkeifxvjtjjwpxzoc:postgres15076@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString: url, connectionTimeoutMillis: 10000 });

(async () => {
  try {
    await client.connect();
    console.log('✅ CONNECTED TO SUPABASE!');
    const res = await client.query('SELECT version()');
    console.log('DB Version:', res.rows[0].version.substring(0, 60));
    await client.end();
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
})();
