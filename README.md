# 🚀 Acquisitions - Node.js Backend with Neon Database & Docker

A production-grade RESTful API built with **Express 5**, **Drizzle ORM**, and **Neon Database**. It features a dual-environment DevOps setup:

- **Development**: Uses **Neon Local Proxy** via Docker to automatically manage isolated, ephemeral database branches per git branch.
- **Production**: Connects directly to the serverless **Neon Cloud Database** via TLS without local proxies.

---

## 🏗️ Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                               1. DEVELOPMENT SETUP                                |
|                                                                                   |
|  +------------------------+      SQL Query       +-----------------------------+  |
|  | Acquisitions App       | -------------------> | Neon Local Proxy Container  |  |
|  | (NODE_ENV=development) |                      | (neondatabase/neon_local)   |  |
|  +------------------------+                      +-----------------------------+  |
|               |                                                 |                 |
|               | Reads .git/HEAD                                 | Auto-creates    |
|               v                                                 v Ephemeral Branch|
|        Git Branch context                            Neon Cloud API               |
+-----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
|                               2. PRODUCTION SETUP                                 |
|                                                                                   |
|  +------------------------+               Direct TLS / HTTPS Connection           |
|  | Acquisitions App       | ------------------------------------------------->    |
|  | (NODE_ENV=production)  |           Neon Cloud Database Serverless          |
|  +------------------------+           (*.neon.tech)                               |
+-----------------------------------------------------------------------------------+
```

---

## 📋 Prerequisites

- **Docker** and **Docker Compose** (v2.0+)
- **Node.js** (v18+) & **npm** (if running outside Docker)
- A **Neon Cloud Account** with a Project ID & API Key (for Neon Local dev branch management)

---

## 🛠️ Environment Configuration

Copy the example configuration file:

```bash
cp .env.example .env.development
cp .env.example .env.production
```

### Environment Variable Matrix

| Variable           | Description                      | Development (Neon Local)                                     | Production (Neon Cloud)                                          |
| :----------------- | :------------------------------- | :----------------------------------------------------------- | :--------------------------------------------------------------- |
| `NODE_ENV`         | Application runtime mode         | `development`                                                | `production`                                                     |
| `PORT`             | HTTP Server Port                 | `3000`                                                       | `3000`                                                           |
| `DATABASE_URL`     | Postgres Connection URL          | `postgres://neon:npg@neon-local:5432/neondb?sslmode=require` | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `NEON_LOCAL_HOST`  | Hostname of Neon Local container | `neon-local` (in Compose) or `localhost`                     | _Not Used_                                                       |
| `NEON_API_KEY`     | Neon Cloud API Token             | `nk_...`                                                     | _Not Used_                                                       |
| `NEON_PROJECT_ID`  | Neon Project Identifier          | `ep-xyz...`                                                  | _Not Used_                                                       |
| `PARENT_BRANCH_ID` | Parent branch for dev forks      | `main`                                                       | _Not Used_                                                       |
| `DELETE_BRANCH`    | Auto-cleanup dev branches        | `true`                                                       | _Not Used_                                                       |
| `JWT_SECRET`       | Secret key for auth tokens       | `dev_jwt_secret_123`                                         | `<strong-production-secret>`                                     |
| `ARCJET_KEY`       | Arcjet security key              | `ajkey_...`                                                  | `ajkey_...`                                                      |

---

## ⚡ 1. Local Development with Neon Local Proxy

In development, **Neon Local** runs alongside the app in `docker-compose.dev.yml`. Neon Local inspects your repository's `.git/HEAD` and automatically creates or connects to a dedicated, ephemeral Neon Cloud database branch corresponding to your current git branch.

### Quick Start (Development)

Run the convenience script:

```bash
npm run dev:docker
# OR manually:
docker-compose -f docker-compose.dev.yml --env-file .env.development up --build
```

### What Happens Behind the Scenes:

1. `neon-local` container starts on port `5432` and connects to Neon Cloud using `NEON_API_KEY`.
2. It detects your current Git branch (e.g., `feature/user-auth` or `main`).
3. Neon Local creates a copy-on-write database branch in Neon Cloud.
4. The Node.js `app` container connects to `postgres://neon:npg@neon-local:5432/neondb`.
5. Code edits in `./src` immediately trigger hot-reloads inside the container.

### Database Migrations in Development

Generate and apply migrations using Drizzle ORM:

```bash
# Generate SQL migrations from schema
npm run db:generate

# Apply migrations to the current database branch
npm run db:migrate

# Open Drizzle Studio UI to view database records
npm run db:studio
```

---

## 🏭 2. Production Deployment with Neon Cloud

In production, the application connects directly to your production **Neon Cloud Database** over HTTPS/TLS. No proxy container (`neon-local`) is launched.

### Quick Start (Production)

Run the convenience script:

```bash
npm run prod:docker
# OR manually:
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Verification & Health Check

Verify that the production service is healthy:

```bash
curl http://localhost:3000/health
# Response: {"status":"OK","timestamp":"...","uptime":12.34}
```

---

## 🔐 How `DATABASE_URL` and `database.js` Switch Environments

The database driver (`@neondatabase/serverless`) is configured in `src/config/database.js`:

```javascript
import 'dotenv/config';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Detect Development Mode & configure Neon Local Proxy Endpoint
if (process.env.NODE_ENV === 'development') {
  const host = process.env.NEON_LOCAL_HOST || 'neon-local';
  neonConfig.fetchEndpoint = `http://${host}:5432/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export { db, sql };
```

- **In Development (`NODE_ENV=development`)**: `database.js` routes SQL fetch queries to `http://neon-local:5432/sql`.
- **In Production (`NODE_ENV=production`)**: `database.js` leaves default endpoints untouched, allowing `@neondatabase/serverless` to connect directly to the Neon Cloud URL specified in `DATABASE_URL`.

---

## 🐳 Docker Command Cheat Sheet

| Task                | Command                                                                                                       |
| :------------------ | :------------------------------------------------------------------------------------------------------------ |
| **Start Dev Mode**  | `npm run dev:docker` or `docker-compose -f docker-compose.dev.yml --env-file .env.development up --build`     |
| **Stop Dev Mode**   | `docker-compose -f docker-compose.dev.yml down`                                                               |
| **Start Prod Mode** | `npm run prod:docker` or `docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build` |
| **Stop Prod Mode**  | `docker-compose -f docker-compose.prod.yml down`                                                              |
| **View App Logs**   | `docker logs -f acquisitions-app-dev` (or `acquisitions-app-prod`)                                            |
| **View Proxy Logs** | `docker logs -f acquisitions-neon-local`                                                                      |
