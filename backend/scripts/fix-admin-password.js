const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'muslimeen',
  user: 'postgres',
  password: '@Qwe@123',
});

async function fixPassword() {
  const userId = 'b2059620-c641-4674-ae0f-4ba09b87ef48';
  const password = '@Qwe@123786';
  
  console.log('Hashing password with bcrypt...');
  const passwordHash = await bcrypt.hash(password, 12);
  console.log('Hash:', passwordHash);
  
  console.log('Updating admin password...');
  const result = await pool.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING email',
    [passwordHash, userId]
  );
  
  if (result.rowCount === 0) {
    console.log('❌ User not found!');
  } else {
    console.log('✅ Password updated for user:', result.rows[0].email);
  }
  
  await pool.end();
}

fixPassword().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
