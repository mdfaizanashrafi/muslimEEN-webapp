/**
 * Seed Invitation Script
 * Run this locally to create a test invitation
 * 
 * Usage: DATABASE_URL="your-render-db-url" node seed-invitation.js
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Please set DATABASE_URL environment variable');
  console.error('Example: DATABASE_URL="postgres://user:pass@host:5432/dbname" node seed-invitation.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedInvitation() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating test invitation...');
    
    // Check if invitations table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'invitations'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('📁 Creating invitations table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS invitations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(12) UNIQUE NOT NULL,
          email VARCHAR(255),
          invitee_email VARCHAR(255),
          created_by UUID,
          status VARCHAR(20) DEFAULT 'pending',
          max_uses INTEGER DEFAULT 1,
          used_count INTEGER DEFAULT 0,
          expires_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          used_at TIMESTAMP,
          used_by UUID
        )
      `);
      console.log('✅ Table created');
    }
    
    // Create test invitation
    const code = 'WELCOME2024';
    
    await client.query(`
      INSERT INTO invitations (id, code, status, max_uses, used_count, created_at)
      VALUES (gen_random_uuid(), $1, 'pending', 10, 0, NOW())
      ON CONFLICT (code) DO UPDATE 
      SET status = 'pending', used_count = 0, max_uses = 10
    `, [code]);
    
    console.log('✅ Invitation created successfully!');
    console.log('');
    console.log('🎉 TEST CODE: WELCOME2024');
    console.log('   (Can be used 10 times)');
    console.log('');
    
    // Verify
    const result = await client.query('SELECT * FROM invitations WHERE code = $1', [code]);
    console.log('Database record:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedInvitation();
