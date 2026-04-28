const { Client } = require('pg');

async function testConn() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/chemiapp'
  });

  try {
    await client.connect();
    console.log('Successfully connected to chemiapp database');
    const res = await client.query('SELECT 1');
    console.log('Query result:', res.rows[0]);
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await client.end();
  }
}

testConn();
