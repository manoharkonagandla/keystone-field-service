# Demo Video Script (3–5 minutes)

Goal: prove the deployed platform works end-to-end for all four roles and that the
lifecycle/security rules actually hold. Screen-record your browser (free tools: OBS
Studio, Windows Game Bar `Win+G`, macOS `Cmd+Shift+5`, or a browser extension like
Loom's free tier). Upload to YouTube (unlisted) or Google Drive with link sharing set
to "Anyone with the link."

## Suggested run-through (~4 minutes)

**0:00–0:20 — Intro**
"This is Project KEYSTONE, a field service management platform for Meridian Facilities
Management, built with Spring Boot, React, and PostgreSQL. I'll walk through all four
roles and the work-order lifecycle."

**0:20–1:00 — Dispatcher**
- Log in as `dispatcher@keystone.local`.
- Show the board (Kanban by status).
- Create a new work order for a customer/site.
- Assign it to a technician — point out it moves to ASSIGNED and the board updates.

**1:00–2:00 — Technician**
- Log in as `technician@keystone.local`.
- Show "My Jobs" — only assigned jobs are visible.
- Open the new job, click **Start Work** (ASSIGNED → IN_PROGRESS).
- Log parts used (point out stock decrements) and log time.
- Mark it **Complete**.

**2:00–2:40 — Manager**
- Log in as `manager@keystone.local`.
- Show the Dashboard: status counts, SLA compliance, overdue count, per-technician load.
- Open the completed job and **Close** it — point out only a manager can do this.
- (Optional) Show Parts inventory management.

**2:40–3:20 — Customer portal**
- Log in as `customer@keystone.local`.
- Show "My Requests" — only this customer's own work orders are visible.
- Raise a new request from the portal.
- Point out you cannot see other customers' data.

**3:20–4:00 — Security & wrap-up**
- (Optional but strong) Open Swagger UI, show `POST /api/auth/login`, and demonstrate
  that calling a protected endpoint without a token returns 401, and that an illegal
  status transition (e.g. NEW → COMPLETED) returns 409.
- Close with: "That's KEYSTONE — full lifecycle, role-based access enforced server-side,
  SLA tracking, and a live deployment. Thanks for watching."

## Recording tips
- Increase your browser zoom/font size slightly so text is readable on a recording.
- Do a full run-through once without recording so you're not narrating cold.
- Trim the very start/end in your video editor (or YouTube Studio's built-in trimmer)
  if there's dead air.
