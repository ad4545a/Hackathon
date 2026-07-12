# BRAIN.md
> Persistent context for the coding agent working Member 3's scope on TransitOps.
> Read this file first, every session. Update the **Status Log** and **Decisions Log**
> at the end of every work session. Do not re-scan the full project PRD — everything
> needed day-to-day lives in this repo's `/docs` folder (PRD.md, WORKFLOW.md,
> TECH_STACK.md, PHASES.md) plus this file.

---

## 1. Identity & Scope
- **Owner**: Member 3
- **Modules owned**: `maintenance`, `fuel`, `expenses`, `analytics`
- **Also owns**: frontend UI integration for these 3 domains (Maintenance, Fuel, Expenses pages) + shared contribution to Dashboard analytics charts (per master PRD §30 — vertical ownership, not backend-only)
- **Do not touch**: `auth`, `users`, `vehicles` (M1) · `drivers`, `trips` (M2) · app shell/router/global dashboard shell (M4)
- **Reference docs in this repo**: `docs/PRD.md`, `docs/WORKFLOW.md`, `docs/TECH_STACK.md`, `docs/PHASES.md`

---

## 2. File Ownership Map
```
server/src/modules/maintenance/**   ← owned
server/src/modules/fuel/**          ← owned
server/src/modules/expenses/**      ← owned
server/src/modules/analytics/**     ← owned
client/src/features/maintenance/**  ← owned
client/src/features/fuel/**         ← owned
client/src/features/expenses/**     ← owned
client/src/features/dashboard/**    ← shared with M4 (analytics charts only, not shell)
```

---

## 3. Task Checklist (source of truth for "what's left")
Mark `[x]` as completed. Keep this list updated — this is what the agent should scan
instead of re-deriving tasks from the master PRD each session.

### Maintenance
- [x] `maintenance.model.js` schema + indexes (`vehicleId`, `status`)
- [x] `maintenance.validation.js` (Zod: vehicleId, maintenanceType, description, startDate, cost)
- [x] `maintenance.repository.js`
- [x] `maintenance.service.js` — start (transactional, checks vehicle AVAILABLE → IN_SHOP)
- [x] `maintenance.service.js` — complete (transactional, ACTIVE→COMPLETED, vehicle→AVAILABLE|RETIRED)
- [x] `maintenance.controller.js` + `maintenance.routes.js`
- [x] RBAC wired: Fleet Manager CRUD, others Read-only
- [ ] Frontend: maintenance list table + start/complete forms + status badges

### Fuel
- [x] `fuel.model.js` schema + indexes (`vehicleId`, `date`)
- [x] `fuel.validation.js` (liters>0, cost>=0, odometer>=0)
- [x] `fuel.repository.js` + `fuel.service.js`
- [x] `fuel.service.createFuelLog()` exported for M2's trip-completion service to call internally
- [x] `fuel.controller.js` + `fuel.routes.js`
- [x] RBAC wired: Fleet Manager CRUD, Dispatcher Create, others Read
- [ ] Frontend: fuel log table + entry form

### Expenses
- [x] `expenses.model.js` schema + indexes (`vehicleId`, `date`)
- [x] `expenses.validation.js` (amount>=0, type enum)
- [x] `expenses.repository.js` + `expenses.service.js`
- [x] Decision made + documented (see §5) on Expense vs Fuel/Maintenance overlap
- [x] `expenses.controller.js` + `expenses.routes.js`
- [x] RBAC wired: Fleet Manager & Financial Analyst CRUD, Dispatcher Create, Safety Read
- [ ] Frontend: expenses table + entry form

### Analytics
- [x] `analytics.repository.js` — fleet utilization pipeline
- [x] `analytics.repository.js` — fuel efficiency pipeline
- [x] `analytics.repository.js` — operational cost pipeline
- [x] `analytics.repository.js` — vehicle ROI pipeline
- [x] `analytics.controller.js` + `analytics.routes.js` (4 endpoints)
- [x] Contribution to `GET /dashboard/summary` (coordinate with M4)
- [ ] Frontend: charts wired via TanStack Query on Analytics page

### Integration / Cross-team
- [ ] Confirmed contract with M2: fuel-log creation callable from Trip completion
- [ ] Confirmed contract with M4: dashboard summary shape + analytics endpoint shapes
- [ ] Confirmed with M1: RBAC middleware usage pattern, replica-set Docker Compose is up

---

## 4. API Contract Snapshot (don't re-derive — copy/paste when coding)
```
POST   /api/v1/maintenance
GET    /api/v1/maintenance
POST   /api/v1/maintenance/:id/complete

POST   /api/v1/fuel-logs
GET    /api/v1/fuel-logs

POST   /api/v1/expenses
GET    /api/v1/expenses

GET    /api/v1/analytics/fleet-utilization
GET    /api/v1/analytics/fuel-efficiency
GET    /api/v1/analytics/operational-cost
GET    /api/v1/analytics/vehicle-roi
```

Response envelope:
```json
{ "success": true, "data": {}, "meta": {} }
{ "success": false, "error": { "code": "STRING_CODE", "message": "...", "details": {} } }
```

---

## 5. Decisions Log
> Append-only. One line per decision, with date. This is what prevents the agent
> from re-litigating settled questions.

- `2026-07-12` — Expense vs Fuel/Maintenance double-count: **[DECIDED]**. Applied default recommendation: Operational Cost = FuelLog.cost + Maintenance.cost only; Expense collection contributes only TOLL/OTHER/REPAIR types to Operational Cost, never FUEL/MAINTENANCE types.
- `2026-07-12` — Maintenance start/complete confirmed transactional (mongoose session), matching M2's Trip dispatch pattern.
- `2026-07-12` — Fuel log creation must be a reusable service function, not just an HTTP handler, so M2 can call it during trip completion without an internal HTTP round-trip.

---

## 6. Status Log
> Update at the end of every work session: what shipped, what's blocked, what's next.

- `2026-07-12` — Docs generated (PRD, WORKFLOW, TECH_STACK, PHASES, BRAIN). No code written yet. Next: confirm Vehicle model shape with M1 before starting `maintenance.model.js`.
- `2026-07-12` — Shipped Maintenance backend module (model, validation, repo, service, controller, routes, tests). Next: Fuel module backend.
- `2026-07-12` — Shipped Fuel backend module (model, validation, repo, service, controller, routes, tests). Next: Expenses module backend.
- `2026-07-12` — Shipped Expenses backend module (model, validation, repo, service, controller, routes, tests). Next: Analytics module backend.
- `2026-07-12` — Shipped Analytics backend module (repository pipelines, service, controller, routes, tests). Next: Frontend integration.

---

## 7. Known Blockers / Dependencies
| Blocker | Owned by | Needed for |
|---|---|---|
| Vehicle model + status enum finalized | M1 | Maintenance model (vehicleId ref, status sync) |
| Trip completion service signature | M2 | Fuel log auto-creation hook |
| Docker Compose replica set running | M1 | Any Maintenance transaction testing |
| Dashboard shell / query client setup | M4 | Wiring your analytics charts into the UI |

---

## 8. Definition of Done (per your feature)
```
Model + Validation + API + Business Rules + Error Handling
+ Frontend Integration + Loading/Empty/Error states
+ Responsive UI + Manual Test + Git PR Reviewed
```
Not done just because the backend route works. Not done just because the frontend renders mock data.
