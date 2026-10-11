# Society Contact Book

A production-minded learning project for a residential society contact directory. It uses React, Vite, Tailwind CSS, Express, Prisma, mysql2, and MySQL 8.

## What Exists

The repository was empty before implementation. The current project contains:

- `server/`: Express REST API, cookie auth, CSRF protection, role checks, tenant-scoped services, Prisma schema, migration, and seed script.
- `client/`: Vite React app with dashboard, contact directory, contact details, add/edit contact, flats, and admin user management.
- `docs/`: Database design notes and SQL learning guide based on the actual schema.

## Requirements Source Notes

The attached Word document is treated as the primary contact-book requirements source. It defines the categories, required contact fields, work details, preferred days, and examples. `Home Visit` appears in examples but not the main work-type list, so it is seeded as an extra supported work type with a source note.

## Local MySQL Setup

Create a database and user:

```sql
CREATE DATABASE society_contact_book CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'society_app'@'localhost' IDENTIFIED BY 'change_me';
GRANT ALL PRIVILEGES ON society_contact_book.* TO 'society_app'@'localhost';
FLUSH PRIVILEGES;
```

Copy environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` with your real local `DATABASE_URL`, a long `JWT_SECRET`, and a one-time `SETUP_TOKEN`.

## Install And Run

```bash
npm install
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Backend: `http://localhost:4000`  
Frontend: `http://localhost:5173`

## Create The First Administrator

After migrations and seed data, create the first admin with the setup token:

```bash
curl -X POST http://localhost:4000/api/auth/setup \
  -H "Content-Type: application/json" \
  -H "x-setup-token: replace_with_one_time_local_setup_token" \
  -d '{
    "societyName": "Demo Society",
    "societyCode": "DEMO",
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "change_this_password"
  }'
```

The setup endpoint refuses to create another initial admin after one already exists. Do not commit real passwords or tokens.

## Run Checks

```bash
npm test
npm run build
```

Use a separate MySQL database for integration tests before adding destructive database test setup.

## Security Notes

Implemented: bcrypt password hashing, HTTP-only auth cookie, CSRF token check for cookie-authenticated unsafe requests, Helmet, CORS restricted to the configured frontend origin, auth rate limiting, Zod validation, backend role checks, and society-scoped queries.

Production follow-up: serve uploaded images through an authenticated controller or object storage signed URLs, add stronger file signature scanning, rotate setup tokens after use, and configure HTTPS-only cookies.
