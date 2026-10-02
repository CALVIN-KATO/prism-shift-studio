# Prism Shift Studio

Full-stack website for Prism Shift Studio: React + Vite + Tailwind + Framer Motion + Lucide client, Express REST API, SQLite via Knex (better-sqlite3).

## Structure
- `client/` React app (landing page `/`, admin `/admin/login`, `/admin/dashboard`)
- `server/` Express API (`/api/auth/login`, `/api/inquiries`, `/api/portfolio`, `/api/stats`)
- `database/` `schema.sql`, `db.js` (Knex init), `seed.js` (admin user, 5 portfolio items, 3 inquiries)

## Setup (Node 18+)
```bash
# 1. Install backend and frontend dependencies
npm install
npm run client:install

# 2. Create the database tables, then load sample data
npm run migrate
npm run seed

# 3. Start the API (http://localhost:4000)
npm start

# 4. In a second terminal, start the client (http://localhost:5173)
npm run client:dev
```
Open http://localhost:5173. The Vite dev server proxies `/api` to port 4000.

## Admin login
Seed creates `admin` / `admin123`. **Change it** before going live:
```bash
ADMIN_USER=youruser ADMIN_PASSWORD='a-strong-password' npm run seed
```
Note: `npm run seed` clears existing data, so only use it for first setup.

## Production
```bash
npm run client:build
JWT_SECRET='long-random-string' PORT=4000 npm start
```
The Express server then serves the built client and the API together from one port. Always set `JWT_SECRET`.

## Environment variables
`PORT` (default 4000), `JWT_SECRET`, `DB_FILE` (SQLite path), `ADMIN_USER`, `ADMIN_PASSWORD` (seed only).

## Notes
- Dashboard metrics: Active = approved inquiries, Completed = archived inquiries, Estimated revenue = sum of budget-range midpoints for approved and archived inquiries.
- Pricing, testimonials, working hours and seed portfolio content are sample data. Edit them in `client/src/Landing.jsx` and `database/seed.js`.
- Contact details come from the studio poster (Nkozi campus, Uganda; +256 702 162 541 / +256 788 158 626; calvinkato13@gmail.com).
