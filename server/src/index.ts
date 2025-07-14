import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './userRoutes';
import { pool } from './db';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Ensure users table exists
const createTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        type_of_disability VARCHAR(100),
        province VARCHAR(100),
        city VARCHAR(100),
        date_valid DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_deleted BOOLEAN DEFAULT FALSE,
        deleted_at TIMESTAMP NULL,
        username VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        modified_by VARCHAR(100) NULL
      );
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'users_username_unique_active'
        ) THEN
          CREATE UNIQUE INDEX users_username_unique_active ON users(username) WHERE is_deleted = FALSE;
        END IF;
      END$$;
    `);
    console.log('Users table ensured and partial unique index set.');
  } catch (err) {
    console.error('Error creating users table:', err);
    process.exit(1);
  }
};

// PORT is defined in .env. If not, fallback to 4000
createTable().then(() => {
  app.use('/users', userRoutes);
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
