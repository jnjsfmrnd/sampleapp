# SampleApp

A full-stack app with Express/TypeScript backend, React frontend, PostgreSQL database, Docker Compose, user/admin separation, soft deletes, and audit fields.

## Prerequisites
- Node.js (v18+ recommended)
- Docker & Docker Compose
- (Optional) PostgreSQL locally if not using Docker for DB

## Quick Start (Development)

1. **Clone the repo:**
   ```sh
   git clone https://github.com/jnjsfmrnd/sampleapp.git
   cd sampleapp
   ```

2. **Copy and edit environment variables:**
   - Edit `.env`, `.env.local`, and `.env.prod` as needed. Do NOT commit secrets.

3. **Start PostgreSQL with Docker:**
   ```sh
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. **Install dependencies:**
   ```sh
   cd server && npm install
   cd ../client && npm install
   ```

5. **Start backend (in /server):**
   ```sh
   npm run dev
   ```

6. **Start frontend (in /client):**
   ```sh
   npm run dev
   ```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Production

1. **Build and run everything with Docker Compose:**
   ```sh
   docker-compose up --build
   ```
- Frontend: http://localhost
- Backend: http://localhost:4000

## Useful Commands

- **Stop all Docker containers:**
  ```sh
  docker-compose down
  ```
- **Reset DB volume (dangerous, erases data):**
  ```sh
  docker-compose down -v
  ```

## Features
- User/admin registration and login
- Admin dashboard (generate random users, manage users)
- Users can edit their own account
- Soft deletes, audit fields, partial unique index for usernames
- Environment-based config

## Notes
- Do NOT commit `.env*` files with secrets to GitHub.
- All `node_modules` are gitignored.
- For any issues, check logs in backend/frontend terminals or Docker logs.

---

Feel free to open issues or PRs!
