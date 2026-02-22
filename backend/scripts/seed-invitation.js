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
    
    // Create test invitation with 12 character code
    const code = 'WELCOME20241'; // 12 characters
    
    await client.query(`
      INSERT INTO invitations (id, code, invitee_email, status, created_at, expires_at)
      VALUES (gen_random_uuid(), $1, 'test@example.com', 'pending', NOW(), NOW() + INTERVAL '30 days')
      ON CONFLICT (code) DO UPDATE 
      SET status = 'pending', invitee_email = 'test@example.com'
    `, [code]);
    
    console.log('✅ Invitation created successfully!');
    console.log('');
    console.log('🎉 TEST CODE: WELCOME20241 (12 characters)');
    console.log('');
    
    // Verify
    const result = await client.query('SELECT * FROM invitations WHERE code = $1', [code]);
    console.log('Code length:', result.rows[0].code.length, 'characters');
    console.log('Database record:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedInvitation();
