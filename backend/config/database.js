const { Pool } = require('pg');

// Create a new pool using the DATABASE_URL from your Render environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for connecting securely on Render
  },
});

// Log when successfully connected
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL via DATABASE_URL');
});

// Log errors
pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

module.exports = pool;
