import pool from '../db.js';
import bcrypt from 'bcryptjs';

async function fixPassword() {
  try {
    console.log('Fixing password hash...');
    
    // Hash the password "654321"
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('654321', saltRounds);
    
    console.log('Generated password hash:', passwordHash);
    
    // Update the user's password
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [passwordHash, 'waqaschohan@gmail.com']
    );
    
    if (result.rowCount > 0) {
      console.log('✅ Password updated successfully!');
    } else {
      console.log('❌ No user found with email waqaschohan@gmail.com');
    }
    
    // Verify the password works
    const { rows } = await pool.query(
      'SELECT password_hash FROM users WHERE email = $1',
      ['waqaschohan@gmail.com']
    );
    
    if (rows.length > 0) {
      const isValid = await bcrypt.compare('654321', rows[0].password_hash);
      console.log('Password verification test:', isValid ? '✅ PASS' : '❌ FAIL');
    }
    
  } catch (error) {
    console.error('❌ Error fixing password:', error.message);
  } finally {
    await pool.end();
  }
}

fixPassword();
