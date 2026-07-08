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

The platform supports three core personas:

- Admin: creates drivers, registers bins, dispatches routes, tracks route progress, and manages citizen reports.
- Driver: views assigned route, updates bin outcomes, and completes routes.
- Citizen: reports waste issues, tracks report status, and views their report history.

The system is built as a monorepo with a Next.js frontend and an Express + Drizzle backend backed by PostgreSQL.

## Tech Stack Overview

### Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- NextAuth.js (Credentials & Google OAuth)
- Serwist (PWA offline support & background sync)
- IndexedDB (Offline data persistence)
- SWR for polling and cache revalidation
- Leaflet + React Leaflet for map rendering
- OSRM integration for route optimization path display
- Sonner for notifications

### Backend

- Node.js + Express 5
- TypeScript
- Drizzle ORM + Drizzle Kit
- PostgreSQL (pg driver)
- Redis + BullMQ (Background job processing)
- Cloudinary (Image storage)
- Google Auth Library (OAuth token verification)
- Gemini API (AI-powered analytics)
- Express Rate Limit (API security)
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

- Citizen Reporting Flow: Citizens can report waste issues, upload photos, and track the status of their reports. Admins can view, manage, and update the status of these reports.
- AI Image Triage: Automatic background analysis of citizen-reported waste images using Gemini API. It categorizes the waste, assesses severity, and determines validity with confidence scores.
- PWA Support & Offline Mode: Fully functional offline capabilities with IndexedDB state persistence and background sync.
- Authentication: Credentials and Google OAuth authentication with role-aware sessions.
- Protected pages with role checks for admin-only sections.
- Admin map view with current bin states.
- Route dispatch workflow with bin locking on active routes.
- Driver route screen with per-stop status updates.
- Photo Uploads: Cloudinary integration for capturing proof of waste collection.
- Route completion guard that blocks closure until all bins are resolved.
- Live admin status panel for pending route progress.
- Background Processing: BullMQ for handling async tasks and background queues reliably.
- Driver and bin creation from admin workspace.
- Consistent button loading states on async user actions.

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+
- Redis Server (for BullMQ)
- Cloudinary Account (for image uploads)
- Google Cloud Console Project (for OAuth)
- Gemini API Key (for AI features)

## Installation

From the repository root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Environment Variables

Copy the example configuration files and update the values.

### backend/.env

```bash
cp backend/.env.example backend/.env
```

```env
# Database configuration
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
PORT=5000

# Authentication
JWT_SECRET="your_super_secret_jwt_string_here"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"

# File Storage
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"

# AI
GEMINI_API_KEY="your_gemini_api_key_here"

# Redis
REDIS_URL="rediss://default:password@host:port"
```

### frontend/.env.local

```bash
cp frontend/.env.example frontend/.env.local
```

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_here"
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
NEXT_PUBLIC_BACKEND_URL="http://localhost:5000"
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
```

Notes:

- NextAuth secrets and OAuth credentials should be properly matching between environments.
- Backend API host is referenced via `NEXT_PUBLIC_BACKEND_URL` in the frontend API utilities.

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
- Citizens
  - Email: `citizen@waste.com` | Password: `password123`

## API Overview

Base URL: `/api`

### Authentication (`/auth`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/login` | Authenticate user via credentials | Public |

### Bins (`/bins`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/bins` | Retrieve all bins | Admin |
| POST | `/bins` | Create a new bin | Admin |

### Routes (`/routes`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/routes/driver/:driverId` | Get routes for a specific driver | Authenticated |
| PATCH | `/routes/:routeId/bins/:binId/status` | Update bin status in a route | Authenticated |
| POST | `/routes` | Create and dispatch a new route | Admin |
| PATCH | `/routes/:routeId/status` | Update overall route status | Authenticated |
| GET | `/routes/pending` | Get all pending routes | Admin |

### Users (`/users`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/users/drivers` | Get list of all drivers | Admin |
| POST | `/users/drivers` | Register a new driver | Admin |

### Cities (`/cities`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/cities` | Retrieve all cities | Admin |
| POST | `/cities` | Create a new city | Admin |
| DELETE | `/cities/:cityId` | Delete a specific city | Admin |

### Reports (`/reports`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/reports` | Create a new report | Authenticated |
| GET | `/reports/mine` | Get current user's reports | Authenticated |
| GET | `/reports` | Retrieve all reports | Admin |
| PATCH | `/reports/:reportId/status` | Update a report's status | Admin |
| DELETE | `/reports/:reportId` | Delete a specific report | Authenticated |

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
  - Turn-by-turn routing, shift start/end flow, and driver performance KPIs.
- AI-Driven Route Optimization
  - Dynamic rerouting based on real-time severity of citizen reports and high-priority AI alerts.
- Backend Cron Jobs
  - Daily route auto-generation, stale-route escalation, missed-bin alerts, and cleanup tasks.
- Driver Capacity and Vehicle Management
  - Vehicle assignment, payload limits, fuel tracking, and optimization by capacity.
- Admin Reports and Analytics
  - Unified driver tracking, productivity dashboards, SLA reports, and zone-level performance trends.
