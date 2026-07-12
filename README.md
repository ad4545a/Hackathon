# TransitOps — Smart Transport Operations Platform

TransitOps is a centralized transport operations platform for managing fleets of vehicles and drivers. It replaces manual registers, spreadsheets, and disconnected records with a real-time database-driven platform featuring business rule validation, atomic trip dispatch transactions, driver compliance tracking, maintenance management, and analytical dashboards.

## Stack & Architecture

- **Backend**: Node.js, Express, Mongoose (MongoDB)
- **Frontend**: Vite React, Tailwind CSS, shadcn/ui, TanStack Query
- **Database**: MongoDB Replica Set (configured via Docker Compose) for transaction support
- **Design System**: Modern responsive layout with clean visual hierarchy, role-based workflows, and micro-interactions.

---

## Getting Started

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### 2. Local Infrastructure Setup
To support atomic database operations, we use a single-node MongoDB replica set:
```bash
docker compose up -d
```
This spins up MongoDB and automatically runs `rs.initiate()` inside the container.

### 3. Server Configuration & Setup
Navigate to the `server/` folder, copy `.env.example` to `.env`, and customize if necessary.
```bash
cd server
cp .env.example .env
npm install
```

### 4. Database Seeding
Populate the database with pre-configured users (roles: Fleet Manager, Dispatcher, Safety Officer, Financial Analyst) and initial vehicle assets:
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```

---

## Git Workflow Guidelines
We use a structured branch layout:
- `main`: Production-ready, stable code.
- `develop`: Integration branch for developers.
- `feat/*` or `fix/*`: Feature and hotfix branches.

**Commit Message Convention**:
- `feat(scope): descriptions`
- `fix(scope): descriptions`
- `refactor(scope): descriptions`
