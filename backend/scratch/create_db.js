const { Client } = require('pg');

async function createDb() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
  });

  try {
    await client.connect();
    console.log('Connected to postgres database');
    await client.query('CREATE DATABASE chemiapp');
    console.log('Database chemiapp created successfully');
  } catch (err) {
    if (err.code === '42P04') {
      console.log('Database chemiapp already exists');
    } else {
      console.error('Error creating database:', err.message);
    }
  } finally {
    await client.end();
  }
}

createDb();
