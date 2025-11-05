const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv/config');

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const sql = fs.readFileSync(path.join(__dirname, 'create-user-table.sql'), 'utf8');

    await client.query(sql);
    console.log('User table created successfully');

  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
