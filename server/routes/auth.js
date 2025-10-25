import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1)
});

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'kissan_ghar_super_secure_jwt_secret_2025',
    { expiresIn: '24h' }
  );
}

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });
    }

    const { email, password } = parse.data;

    // Find user by email
    const { rows } = await req.db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    // Check password (plain text comparison)
    if (password !== user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    // Return user info and token
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint (optional - for future use)
router.post('/register', async (req, res) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });
    }

    const { email, password, name } = parse.data;

    // Check if user already exists
    const { rows: existingUsers } = await req.db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user (store password as plain text)
    const { rows } = await req.db.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, role',
      [email, password, name]
    );

    const user = rows[0];
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kissan_ghar_super_secure_jwt_secret_2025');
    
    // Get fresh user data
    const { rows } = await req.db.query(
      'SELECT id, email, name, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: rows[0]
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
