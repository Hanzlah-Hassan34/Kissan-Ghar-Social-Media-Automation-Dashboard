import pool from '../db.js';

async function setPlainPassword() {
  try {
    console.log('Setting plain text password...');
    
    // Update the user's password to plain text "65432"
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      ['65432', 'waqaschohan@gmail.com']
    );
    
    if (result.rowCount > 0) {
      console.log('✅ Password updated successfully!');
      console.log('');
      console.log('=== LOGIN CREDENTIALS ===');
      console.log('Email: waqaschohan@gmail.com');
      console.log('Password: 65432');
      console.log('========================');
      console.log('');
      console.log('Note: Password is stored as plain text (no hashing)');
    } else {
      console.log('❌ No user found with email waqaschohan@gmail.com');
    }
    
    // Verify the password
    const { rows } = await pool.query(
      'SELECT password_hash FROM users WHERE email = $1',
      ['waqaschohan@gmail.com']
    );
    
    if (rows.length > 0) {
      console.log('Stored password:', rows[0].password_hash);
      console.log('Verification:', rows[0].password_hash === '65432' ? '✅ PASS' : '❌ FAIL');
    }
    
  } catch (error) {
    console.error('❌ Error setting password:', error.message);
  } finally {
    await pool.end();
  }
}

setPlainPassword();
