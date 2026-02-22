/**
 * Seed User Script
 * Creates a test user for login testing
 * 
 * Usage: DATABASE_URL="your-render-db-url" node seed-user.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Please set DATABASE_URL environment variable');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createUser() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating test user...');
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Users table does not exist. Run migrations first!');
      process.exit(1);
    }
    
    const passwordHash = await bcrypt.hash('TestPass123!', 12);
    
    await client.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, role, verification_tier, created_at)
      VALUES (gen_random_uuid(), 'test@example.com', $1, 'Test', 'User', 'muslim_unverified', 'basic', NOW())
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = $1, first_name = 'Test', last_name = 'User'
    `, [passwordHash]);
    
    console.log('✅ User created successfully!');
    console.log('');
    console.log('🎉 LOGIN CREDENTIALS:');
    console.log('   Email: test@example.com');
    console.log('   Password: TestPass123!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createUser();
