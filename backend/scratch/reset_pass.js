const { Client } = require('pg');

async function resetPass() {
  const client = new Client({
    connectionString: 'postgresql://postgres@localhost:5432/postgres' // No password, hope for trust/peer
  });

  try {
    await client.connect();
    console.log('Connected to postgres');
    await client.query("ALTER USER postgres WITH PASSWORD 'postgres'");
    console.log('Password for postgres user reset to "postgres"');
  } catch (err) {
    console.error('Reset failed:', err.message);
  } finally {
    await client.end();
  }
}

resetPass();
