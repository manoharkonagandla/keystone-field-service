# Project KEYSTONE — Field Service Management Platform

A full-stack field-service platform built for Zidio Development's Java Full-Stack
Engineering Brief. Dispatchers raise and assign work orders, technicians update them
from the field, managers track SLAs and dashboards, and customers self-serve requests —
all through one system of record.

**Stack:** Spring Boot 3 (Java 21) · Spring Security + JWT · Spring Data JPA · PostgreSQL
· Flyway · React 18 + TypeScript (Vite) · springdoc-openapi (Swagger UI)

No paid APIs or services are used anywhere in this project. Postgres, JWT auth, and
email notifications (optional, via any free SMTP account) are all free/open-source.

---

## 1. Architecture summary

```
React SPA (Vite)  ──HTTP/JSON──▶  Spring Boot REST API  ──JPA/Hibernate──▶  PostgreSQL
                                        │
                                        ├─ Spring Security + JWT (stateless auth, RBAC)
                                        ├─ Service layer: work-order state machine,
                                        │   SLA calculation, transactional parts/time
                                        ├─ Flyway (versioned schema + seed data)
                                        └─ Scheduled job: SLA breach scan (every 5 min)
```

**Layers:** Controllers (thin, HTTP only) → Services (business rules, `@Transactional`
boundaries, the work-order state machine) → Repositories (Spring Data JPA) → PostgreSQL.
Entities never leak to the client — everything is mapped to DTOs (Java `record`s).

**Work-order lifecycle** (enforced server-side, in `WorkOrderStatus` + `WorkOrderService`,
never just in the UI):

```
NEW → ASSIGNED → IN_PROGRESS → COMPLETED → CLOSED
        │            │  ▲            │
        │            ▼  │            ▼
        │         ON_HOLD        IN_PROGRESS (reopen)
        ▼
    CANCELLED (from NEW or ASSIGNED)
```

Every transition writes an append-only `work_order_status_history` row. Illegal jumps
(e.g. `NEW → COMPLETED`) are rejected with HTTP 409. Role restrictions are enforced in
`WorkOrderService.assertRoleCanTransition`: only the assigned technician (or a manager)
can start/hold/resume/complete; only a manager can close; only a dispatcher/manager can
cancel.

**Roles & access** (`@PreAuthorize` on every controller method, re-checked server-side —
never trusted from the UI):

| Role | Can do |
|---|---|
| Dispatcher | Create customers/sites/work orders, assign technicians, view the board |
| Technician | View/act on their own assigned jobs, log parts & time |
| Manager | Everything a dispatcher can, plus close jobs, manage parts, view reports |
| Customer | Raise requests for their own sites, view only their own work orders |

---

## 2. Repository layout

```
keystone/
  backend/     Spring Boot service (Java 21, Maven)
  frontend/    React + TypeScript SPA (Vite)
  docker-compose.yml   Local dev: Postgres + backend in containers
  render.yaml          Render.com blueprint for free-tier deployment
```

---

## 3. Run it locally

### Option A — Docker Compose (fastest)

```bash
docker compose up --build
```

- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- Postgres: localhost:5432 (db `keystone`, user/pass `keystone`/`keystone`)

Then, in a second terminal, run the frontend:

```bash
cd frontend
cp .env.example .env      # VITE_API_BASE_URL=http://localhost:8080/api
npm install
npm run dev
```

Open http://localhost:5173 and log in with one of the seed accounts below.

### Option B — Run backend directly with Maven + a local Postgres

```bash
# 1. Start Postgres (any method) with a database named "keystone"
createdb keystone   # or use the docker-compose "db" service alone

# 2. Set environment variables (see backend/.env.example) and run:
cd backend
export DATABASE_URL=jdbc:postgresql://localhost:5432/keystone
export DATABASE_USERNAME=keystone
export DATABASE_PASSWORD=keystone
export JWT_SECRET=dev-only-secret-change-in-production-32chars-min
./mvnw spring-boot:run
```

Flyway runs automatically on startup — it creates the schema (`V1__init_schema.sql`)
and inserts seed data (`V2__seed_data.sql`). No manual migration step is needed.

---

## 4. Seed logins

All seed accounts use the password: **`Passw0rd!`**

| Role | Email |
|---|---|
| Dispatcher | dispatcher@keystone.local |
| Technician | technician@keystone.local |
| Technician (2nd) | technician2@keystone.local |
| Manager | manager@keystone.local |
| Customer | customer@keystone.local |

---

## 5. Environment variables

### Backend (`backend/.env.example`)

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | JDBC URL for Postgres | `jdbc:postgresql://localhost:5432/keystone` |
| `DATABASE_USERNAME` / `DATABASE_PASSWORD` | DB credentials | `keystone` / `keystone` |
| `JWT_SECRET` | HMAC signing key (32+ chars) | dev-only value, **change in production** |
| `JWT_EXPIRATION_MS` | Token lifetime | `86400000` (24h) |
| `ALLOWED_ORIGINS` | CORS allow-list for the frontend origin | `http://localhost:5173` |
| `EMAIL_NOTIFICATIONS_ENABLED` | Turn on SMTP email sends | `false` (notifications still log) |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` / `MAIL_FROM` | Any free SMTP account (e.g. Gmail app password, Brevo free tier) | unset |
| `SLA_URGENT_MINUTES` / `SLA_HIGH_MINUTES` / `SLA_MEDIUM_MINUTES` / `SLA_LOW_MINUTES` | SLA windows by priority | 240 / 480 / 1440 / 4320 |

### Frontend (`frontend/.env.example`)

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API | `http://localhost:8080/api` |

---

## 6. Deploying to Render (free tier — no paid APIs)

### 6.1 Push to GitHub first
See the companion `GITHUB_GUIDE.md` if you haven't pushed this repo yet.

### 6.2 Create the free Postgres database
1. Render dashboard → **New** → **PostgreSQL** → name it `keystone-db`, plan **Free** → Create.
2. Once it's ready, open it and copy from the **Info** tab: *Hostname*, *Port*, *Database*,
   *Username*, *Password* (use the **External** values if connecting from outside Render,
   or **Internal** values — either works once the backend is also on Render).

### 6.3 Create the backend web service
1. Render dashboard → **New** → **Web Service** → connect your GitHub repo.
2. Runtime: **Docker**. Root/Dockerfile path: `backend/Dockerfile`, Docker context: `backend`.
3. Plan: **Free**.
4. Add environment variables:
   - `DATABASE_URL` = `jdbc:postgresql://<hostname>:<port>/<database>`
   - `DATABASE_USERNAME` = `<username>`
   - `DATABASE_PASSWORD` = `<password>`
   - `JWT_SECRET` = (click "Generate" or paste any long random string)
   - `ALLOWED_ORIGINS` = the URL of your deployed frontend (set after step 6.4, then redeploy)
5. Health check path: `/actuator/health` (add `spring-boot-starter-actuator` if you want
   this to work out of the box — otherwise just remove the health check or point it at
   `/api/auth/login` with method restrictions, since Spring Security exposes it as 405
   rather than failing the check).
6. Deploy. First build takes a few minutes (Maven downloads dependencies).

> `render.yaml` in the repo root already describes this service and database as a
> Render "Blueprint" — you can use **New → Blueprint** instead of doing it by hand,
> then just fill in the `DATABASE_URL` / `DATABASE_USERNAME` / `DATABASE_PASSWORD`
> values Render leaves blank (see the comments inside `render.yaml`).

### 6.4 Deploy the frontend as a free Render Static Site
1. Render dashboard → **New** → **Static Site** → same GitHub repo.
2. Root directory: `frontend`.
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Environment variable: `VITE_API_BASE_URL` = `https://<your-backend>.onrender.com/api`
6. Deploy. Then go back to the backend service and set `ALLOWED_ORIGINS` to this
   static site's URL, and redeploy the backend so CORS allows it.

Both free-tier Render services spin down after inactivity and take ~30–60s to wake up
on the first request — this is normal for the free plan.

### 6.5 Verify
- Frontend URL loads the login page.
- Swagger UI at `https://<your-backend>.onrender.com/swagger-ui.html`.
- Log in with a seed account and confirm you can see the board/dashboard.

---

## 7. API documentation

Once running, browse the full OpenAPI/Swagger docs at:

```
http://localhost:8080/swagger-ui.html          (local)
https://<your-backend>.onrender.com/swagger-ui.html   (deployed)
```

---

## 8. Testing the security boundaries

The brief explicitly calls out testing these against the raw API, not just the UI:

- A `CUSTOMER` calling `GET /api/work-orders/{id}` for another customer's order → `403`.
- A `TECHNICIAN` calling `POST /api/work-orders/{id}/status` on a job not assigned to
  them → `403`.
- Any request without a valid `Authorization: Bearer <token>` header to a protected
  endpoint → `401`.
- An illegal lifecycle jump, e.g. `NEW → COMPLETED` → `409`.

You can exercise these directly from Swagger UI (use the seed logins to get tokens
from `POST /api/auth/login`, then "Authorize" with the bearer token).

---

## 9. Scope notes

Out of scope per the brief (not implemented, by design): payment/invoicing, native
mobile apps, route optimisation/GPS, third-party ERP integrations. See
`Zidio_Project_java_1_1.pdf` §4.3 for the full list.
