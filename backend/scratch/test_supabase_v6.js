const { Client } = require('pg');

async function testConn() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@[2a05:d018:135e:1683:2878:9e83:fe8e:de3b]:5432/postgres'
  });

  try {
    await client.connect();
    console.log('Successfully connected to Supabase (IPv6)');
    const res = await client.query('SELECT 1');
    console.log('Query result:', res.rows[0]);
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await client.end();
  }
}

testConn();
