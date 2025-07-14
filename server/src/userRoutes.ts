
import express, { Request, Response, NextFunction } from 'express';
import { pool } from './db';
import { User } from './user';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthUser } from './types';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const MASTER_ADMIN_PASSWORD = process.env.MASTER_ADMIN_PASSWORD || 'SetYourStrongAdminPasswordHere';

// Register (Create User or Admin)
router.post('/', async (req, res) => {
  const { firstName, lastName, username, password, typeOfDisability, province, city, dateValid, isAdmin, masterPassword } = req.body;
  try {
    let finalDateValid = dateValid;
    if (isAdmin) {
      if (masterPassword !== MASTER_ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Invalid master admin password' });
      }
      // Set admin default valid date as 10 years from now
      const now = new Date();
      now.setFullYear(now.getFullYear() + 10);
      finalDateValid = now.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, username, password, type_of_disability, province, city, date_valid, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [firstName, lastName, username, hashedPassword, typeOfDisability, province, city, finalDateValid, !!isAdmin]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND is_deleted = FALSE', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials, Password' });
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, isAdmin: user.is_admin });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Middleware to check JWT and set req.user
const auth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'string') return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded as AuthUser;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const adminOnly = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: 'No user in request' });
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (!result.rows[0]?.is_admin) return res.status(403).json({ error: 'Admin only' });
  next();
};

// Read all Users (not deleted)
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE is_deleted = FALSE');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Read single User (not deleted)
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Set user dateValid (admin only)
router.patch('/:id/dateValid', auth, adminOnly, async (req, res) => {
  const { dateValid } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET date_valid = $1, updated_at = CURRENT_TIMESTAMP, modified_by = $2 WHERE id = $3 AND is_deleted = FALSE AND is_admin = FALSE RETURNING *`,
      [dateValid, req.user!.username, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found or is admin' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Admin can update other non-admin users
router.put('/:id', auth, adminOnly, async (req, res) => {
  const { firstName, lastName, username, password, typeOfDisability, province, city, dateValid } = req.body;
  try {
    let hashedPassword = password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    const result = await pool.query(
      `UPDATE users SET first_name = $1, last_name = $2, username = $3, password = $4, type_of_disability = $5, province = $6, city = $7, date_valid = $8, updated_at = CURRENT_TIMESTAMP, modified_by = $9 WHERE id = $10 AND is_deleted = FALSE AND is_admin = FALSE RETURNING *`,
      [firstName, lastName, username, hashedPassword, typeOfDisability, province, city, dateValid, req.user!.username, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found or is admin' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Admin can delete users (admin or non-admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  const masterPassword = req.body ? req.body.masterPassword : undefined;
  try {
    // Check if user to delete is admin
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1 AND is_deleted = FALSE', [req.params.id]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const userToDelete = userResult.rows[0];
    if (userToDelete.is_admin) {
      if (masterPassword !== MASTER_ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Master password required to delete admin user' });
      }
    } else if (userToDelete.is_admin === false) {
      // Only allow delete for non-admins without master password
    } else {
      return res.status(400).json({ error: 'Invalid user type' });
    }
    const result = await pool.query(
      `UPDATE users SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, modified_by = $1 WHERE id = $2 AND is_deleted = FALSE RETURNING *`,
      [req.user!.username, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found or already deleted' });
    res.json({ message: 'User soft deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

router.post('/generate-random', auth, adminOnly, async (_req, res) => {
  let faker;
  try {
    faker = require('faker');
  } catch (e) {
    return res.status(500).json({ error: 'Faker library not available' });
  }
  const users = [];
  try {
    for (let i = 0; i < 10; i++) {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const username = `user_${faker.datatype.uuid().slice(0, 8)}`;
      const password = await bcrypt.hash('password123', 10);
      const typeOfDisability = faker.random.arrayElement(['Visual', 'Hearing', 'Mobility', 'Cognitive', 'None']);
      const province = faker.address.state();
      const city = faker.address.city();
      const dateValid = faker.date.future().toISOString().split('T')[0];
      const result = await pool.query(
        `INSERT INTO users (first_name, last_name, username, password, type_of_disability, province, city, date_valid, is_admin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false) RETURNING *`,
        [firstName, lastName, username, password, typeOfDisability, province, city, dateValid]
      );
      users.push(result.rows[0]);
    }
    res.status(201).json({ message: '10 random users created', users });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// User can edit their own entry
router.patch('/:id/self', auth, async (req, res) => {
  // Only allow user to edit their own entry
  if (!req.user || parseInt(req.params.id) !== req.user.id) {
    return res.status(403).json({ error: 'You can only edit your own entry' });
  }
  const { firstName, lastName, password, typeOfDisability, province, city, dateValid } = req.body;
  try {
    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    const result = await pool.query(
      `UPDATE users SET first_name = $1, last_name = $2, password = COALESCE($3, password), type_of_disability = $4, province = $5, city = $6, date_valid = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 AND is_deleted = FALSE RETURNING *`,
      [firstName, lastName, hashedPassword, typeOfDisability, province, city, dateValid, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

export default router;
