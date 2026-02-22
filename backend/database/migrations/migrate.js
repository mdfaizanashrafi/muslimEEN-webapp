/**
 * Database Migration Script
 * Runs SQL migrations from the migrations folder
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running database migrations...');
    
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname);
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`📁 Found ${files.length} migration files`);
    
    // Run each migration
    for (const file of files) {
      // Check if migration already ran
      const { rows } = await client.query(
        'SELECT * FROM migrations WHERE filename = $1',
        [file]
      );
      
      if (rows.length > 0) {
        console.log(`  ⏭️  Skipping ${file} (already executed)`);
        continue;
      }
      
      // Read and execute migration
      const filepath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filepath, 'utf8');
      
      console.log(`  📝 Executing ${file}...`);
      await client.query(sql);
      
      // Record migration
      await client.query(
        'INSERT INTO migrations (filename) VALUES ($1)',
        [file]
      );
      
      console.log(`  ✅ ${file} completed`);
    }
    
    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runMigrations()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
