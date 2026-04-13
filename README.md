# Smart Waste System

Smart Waste System is a full stack waste collection operations platform for city-level workflows. It provides role-based access for administrators and drivers, route dispatch and tracking, real-time status updates, and map-assisted route execution.

## Table of Contents

1. Project Overview
2. Tech Stack Overview
3. Monorepo Structure
4. Core Features
5. Prerequisites
6. Installation
7. Environment Variables
8. Database Setup
9. Running the Application
10. Default Seed Credentials
11. API Overview
12. Available Scripts
13. Future Scope

## Project Overview

The platform supports two core personas:

- Admin: creates drivers, registers bins, dispatches routes, and tracks route progress.
- Driver: views assigned route, updates bin outcomes, and completes routes.

The system is built as a monorepo with a Next.js frontend and an Express + Drizzle backend backed by PostgreSQL.

## Tech Stack Overview

### Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- NextAuth.js (credentials-based login)
- SWR for polling and cache revalidation
- Leaflet + React Leaflet for map rendering
- OSRM integration for route optimization path display
- Sonner for notifications

### Backend

- Node.js + Express 5
- TypeScript
- Drizzle ORM + Drizzle Kit
- PostgreSQL (pg driver)
- bcrypt for password hashing
- jsonwebtoken for token verification
- CORS + dotenv

## Monorepo Structure

```text
smart-waste-system/
	backend/
		src/
			controllers/
			db/
			middleware/
			routes/
	frontend/
		app/
		components/
		lib/
```

## Core Features

- Credentials-based authentication with role-aware sessions.
- Protected pages with role checks for admin-only sections.
- Admin map view with current bin states.
- Route dispatch workflow with bin locking on active routes.
- Driver route screen with per-stop status updates.
- Route completion guard that blocks closure until all bins are resolved.
- Live admin status panel for pending route progress.
- Driver and bin creation from admin workspace.
- Consistent button loading states on async user actions.

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+

## Installation

From the repository root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Environment Variables

Create the following files.

### backend/.env

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/smart_waste
PORT=5000
NEXTAUTH_SECRET=replace_with_a_strong_shared_secret
```

### frontend/.env.local

```env
NEXTAUTH_SECRET=replace_with_the_same_shared_secret_as_backend
NEXTAUTH_URL=http://localhost:3000
```

Notes:

- `NEXTAUTH_SECRET` must be the same in frontend and backend because the frontend signs tokens that the backend verifies.
- Backend API host is currently referenced as `http://localhost:5000` in frontend API utilities and NextAuth authorize flow.

## Database Setup

From the `backend` folder:

```bash
npm run db:push
```

Optional seed and reset helpers:

```bash
# Seed users and bins
npx tsx src/db/seed.ts

# Drop all core tables
npx tsx src/db/drop.ts
```

## Running the Application

Use two terminals.

Terminal 1 (backend):

```bash
cd backend
npm run dev
```

Terminal 2 (frontend):

```bash
cd frontend
npm run dev
```

Application URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`

## Default Seed Credentials

If you run the seed script, these accounts are created:

- Admin
  - Email: `admin@waste.com`
  - Password: `admin123`
- Drivers
  - Email: `amit@waste.com` | Password: `password123`
  - Email: `rahul@waste.com` | Password: `password123`
  - Email: `priya@waste.com` | Password: `password123`

## API Overview

Base URL: `/api`

Authentication:

- `POST /auth/login`

Bins (admin):

- `GET /bins`
- `POST /bins`

Routes:

- `GET /routes/driver/:driverId` (authenticated)
- `PATCH /routes/:routeId/bins/:binId/status`
- `POST /routes` (admin)
- `PATCH /routes/:routeId/status`
- `GET /routes/pending` (admin)

Users (admin):

- `GET /users/drivers`
- `POST /users/drivers`

## Available Scripts

### backend/package.json

- `npm run dev` - start backend in watch mode with tsx.
- `npm run db:push` - apply Drizzle schema to the database.

### frontend/package.json

- `npm run dev` - start Next.js development server.
- `npm run build` - create production build.
- `npm run start` - run production build.
- `npm run lint` - run ESLint.

## Future Scope

- Advanced Driver Dashboard
  - Turn-by-turn routing, offline sync, shift start/end flow, and driver performance KPIs.
- Backend Cron Jobs
  - Daily route auto-generation, stale-route escalation, missed-bin alerts, and cleanup tasks.
- Driver Capacity and Vehicle Management
  - Vehicle assignment, payload limits, fuel tracking, and optimization by capacity.
- Admin Reports and Analytics
  - Unified driver tracking, productivity dashboards, SLA reports, and zone-level performance trends.
