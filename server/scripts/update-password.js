import pool from '../db.js';
import bcrypt from 'bcryptjs';

async function updatePassword() {
  try {
    console.log('Updating password to "65432"...');
    
    // Hash the password "65432"
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('65432', saltRounds);
    
    console.log('Generated password hash:', passwordHash);
    
    // Update the user's password
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [passwordHash, 'waqaschohan@gmail.com']
    );
    
    if (result.rowCount > 0) {
      console.log('✅ Password updated successfully!');
      console.log('');
      console.log('=== LOGIN CREDENTIALS ===');
      console.log('Email: waqaschohan@gmail.com');
      console.log('Password: 65432');
      console.log('========================');
    } else {
      console.log('❌ No user found with email waqaschohan@gmail.com');
    }
    
    // Verify the password works
    const { rows } = await pool.query(
      'SELECT password_hash FROM users WHERE email = $1',
      ['waqaschohan@gmail.com']
    );
    
    if (rows.length > 0) {
      const isValid = await bcrypt.compare('65432', rows[0].password_hash);
      console.log('Password verification test:', isValid ? '✅ PASS' : '❌ FAIL');
    }
    
  } catch (error) {
    console.error('❌ Error updating password:', error.message);
  } finally {
    await pool.end();
  }
}

updatePassword();
