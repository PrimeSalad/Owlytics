# Student Monitoring System — MERN Ultra Edition

A high-performance, real-time Student Monitoring System architected for student organizations. This system leverages the **MERN Stack** (MongoDB, Express.js, React, Node.js) to provide a seamless, scalable, and responsive experience for managing events, attendance, and organizational workflows.

---

## 🚀 Vision

To fully digitize and streamline student organization operations through QR-based attendance, real-time reporting, and automated accomplishment compilation — ensuring transparency, accountability, and efficiency across all organizational levels.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
| Category | Technology | Purpose |
| :--- | :--- | :--- |
| Framework | React 18+ (Vite) | Fast builds, HMR, ESM-native |
| Styling | Tailwind CSS v3 | Utility-first, responsive design |
| State | Zustand | Lightweight global state |
| Server State | TanStack Query v5 | Caching, background sync, optimistic updates |
| Routing | React Router v6 | Nested routes, protected routes |
| Forms | React Hook Form + Zod | Type-safe, performant form handling |
| UI Primitives | Radix UI + Lucide React | Accessible headless components + icons |
| Charts | Recharts | Dashboard analytics visualizations |
| QR Scanner | `html5-qrcode` | Camera-based QR scanning |
| QR Generator | `qrcode` (npm) | Client-side QR image generation |
| PDF Viewer | `react-pdf` | Preview generated reports in-browser |
| Notifications | `react-hot-toast` | Toast alerts for real-time events |
| Socket Client | `socket.io-client` | Real-time emergency alerts and live updates |

### Backend (`/server`)
| Category | Technology | Purpose |
| :--- | :--- | :--- |
| Runtime | Node.js 20 LTS | Stable, long-term support |
| Framework | Express.js | REST API, middleware pipeline |
| Database | MongoDB Atlas | Cloud-native NoSQL, free tier available |
| ODM | Mongoose 8 | Schema modeling, validation, hooks |
| Auth | JWT + HTTP-only cookies | Stateless auth, XSS-resistant token storage |
| Real-time | Socket.io 4 | Bidirectional event-driven communication |
| File Storage | Cloudinary | Image/PDF uploads with CDN delivery |
| PDF Generation | `pdfkit` | Server-side PDF report generation |
| Email | Nodemailer + Gmail SMTP | QR code delivery, notifications |
| CSV Parsing | `papaparse` / `csv-parser` | Bulk student import |
| Validation | Zod (shared schema) | Runtime input validation on API layer |
| Security | `helmet`, `express-rate-limit`, `mongo-sanitize`, `cors` | Hardened API |
| Logging | `morgan` + `winston` | HTTP request logs + structured app logs |
| Environment | `dotenv` | Secrets management |

### DevOps & Tooling
| Tool | Purpose |
| :--- | :--- |
| Turborepo | Monorepo task orchestration (shared types/schemas) |
| ESLint + Prettier | Code quality and formatting |
| Husky + lint-staged | Pre-commit hooks |
| Vitest | Unit/integration testing (frontend) |
| Jest + Supertest | API endpoint testing (backend) |
| Vercel | Frontend deployment (CI/CD on push) |
| Render | Backend deployment (free tier, auto-deploy) |
| MongoDB Atlas | Database hosting |
| Cloudinary | Media hosting |

---

## 🏗️ Project Structure

```
student-monitoring-system/
├── client/                         # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/                 # Static images, fonts
│   │   ├── components/             # Reusable UI components
│   │   │   ├── ui/                 # Base: Button, Input, Modal, Badge
│   │   │   ├── layout/             # Sidebar, Navbar, PageWrapper
│   │   │   ├── qr/                 # QRScanner, QRDisplay
│   │   │   ├── charts/             # AttendanceChart, TaskProgressChart
│   │   │   └── reports/            # ReportCard, ReportForm
│   │   ├── features/               # Feature-sliced modules
│   │   │   ├── auth/               # Login, Register, useAuth hook
│   │   │   ├── students/           # StudentTable, StudentForm, ImportModal
│   │   │   ├── events/             # EventList, EventForm, ActivityManager
│   │   │   ├── attendance/         # AttendanceScheduler, ScannerView, LogTable
│   │   │   ├── reports/            # ReportSubmit, AccomplishmentExport
│   │   │   └── dashboard/          # PresidentDashboard, OfficerDashboard
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # axios instance, socket client, utils
│   │   ├── pages/                  # Route-level page components
│   │   ├── store/                  # Zustand stores
│   │   ├── types/                  # Shared TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── server/                         # Express backend
│   ├── src/
│   │   ├── config/                 # db.ts, cloudinary.ts, socket.ts
│   │   ├── controllers/            # Route handler logic
│   │   │   ├── auth.controller.ts
│   │   │   ├── student.controller.ts
│   │   │   ├── event.controller.ts
│   │   │   ├── attendance.controller.ts
│   │   │   └── report.controller.ts
│   │   ├── middleware/             # auth, error handler, rate limiter, upload
│   │   ├── models/                 # Mongoose schemas
│   │   ├── routes/                 # Express routers
│   │   ├── services/               # Business logic (PDF gen, email, QR)
│   │   ├── utils/                  # Helpers, constants
│   │   ├── validators/             # Zod schemas for request bodies
│   │   └── app.ts                  # Express app setup
│   ├── server.ts                   # Entry point (HTTP + Socket.io)
│   └── package.json
│
├── shared/                         # Shared types/schemas (optional)
│   └── types/
├── turbo.json
└── package.json                    # Root workspace
```

---

## 👥 User Roles & Permissions (RBAC)

| Role | Description | Permissions |
| :--- | :--- | :--- |
| **President** | Executive Overseer | Full CRUD on all resources. View all dashboards, reports, and analytics. Receive emergency alerts. |
| **Secretary** | Records & Attendance Manager | Manage student database (CRUD + import). Create/edit attendance schedules. View all attendance logs. Generate reports. |
| **Officer** | Activity Manager | Create and manage assigned events and activities. Assign committees. View activity-level reports. |
| **Committee** | Field Reporter | Submit activity updates and emergency reports. Upload photos/attachments. View own assigned activities. |
| **Attendance** | Scan Specialist | Generate QR codes for sessions. Scan student QR codes. View real-time attendance log for active session. |

**Implementation:** JWT payload includes `role`. A `requireRole(...roles)` middleware guards each route. Frontend uses a `useAuth()` hook to conditionally render UI elements.

---

## 📐 Database Schema (Detailed)

### `users` Collection
```js
{
  _id: ObjectId,
  studentId: String,          // Unique org member ID (e.g., "2024-0001")
  name: { first: String, last: String },
  email: String,              // Unique
  password: String,           // bcrypt hashed (12 rounds)
  role: Enum['President','Secretary','Officer','Committee','Attendance'],
  avatarUrl: String,          // Cloudinary URL
  assignedCommitteeId: ObjectId | null,  // Ref → events.activities.committeeId
  isActive: Boolean,          // Soft-delete / deactivation
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### `students` Collection
```js
{
  _id: ObjectId,
  studentId: String,          // School-issued ID (unique)
  name: { first: String, last: String },
  email: String,
  section: String,            // e.g., "BSIT 3-A"
  yearLevel: Number,          // 1–4
  qrCodeData: String,         // AES-encrypted payload: { studentId, salt }
  qrCodeUrl: String,          // Cloudinary URL of QR image (for email/PDF)
  attendanceHistory: [ObjectId],  // Refs → attendancerecords
  importBatchId: String,      // Tracks which CSV import created this record
  createdAt: Date,
  updatedAt: Date
}
```

### `events` Collection
```js
{
  _id: ObjectId,
  title: String,
  description: String,
  venue: String,
  dateRange: { start: Date, end: Date },
  status: Enum['Planning','Ongoing','Completed','Cancelled'],
  createdBy: ObjectId,        // Ref → users
  assignedOfficers: [ObjectId],  // Refs → users (role: Officer)
  activities: [
    {
      _id: ObjectId,
      name: String,
      description: String,
      startTime: Date,
      endTime: Date,
      committeeId: ObjectId,  // Ref → users (role: Committee)
      status: Enum['Pending','InProgress','Done'],
      updates: [
        {
          content: String,
          attachments: [String],  // Cloudinary URLs
          submittedBy: ObjectId,
          submittedAt: Date
        }
      ]
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### `attendanceschedules` Collection
```js
{
  _id: ObjectId,
  eventId: ObjectId,          // Ref → events
  label: String,              // e.g., "Day 1 - Morning"
  sessions: [
    {
      _id: ObjectId,
      label: Enum['AM In','AM Out','PM In','PM Out'],
      openAt: Date,           // QR scanning window opens
      closeAt: Date,          // QR scanning window closes
      gracePeriodMinutes: Number  // Minutes after openAt before marking "Late"
    }
  ],
  assignedScanners: [ObjectId],  // Refs → users (role: Attendance)
  createdBy: ObjectId,
  createdAt: Date
}
```

### `attendancerecords` Collection
```js
{
  _id: ObjectId,
  eventId: ObjectId,
  scheduleId: ObjectId,
  sessionId: ObjectId,        // Ref → attendanceschedules.sessions._id
  studentId: ObjectId,        // Ref → students
  status: Enum['Present','Late','Absent'],
  scannedBy: ObjectId,        // Ref → users (role: Attendance)
  timestamp: Date,
  locationData: {             // Optional, if geo-fencing enabled
    lat: Number,
    lng: Number
  },
  isOfflineSync: Boolean,     // True if record was buffered offline
  createdAt: Date
}
```

### `reports` Collection
```js
{
  _id: ObjectId,
  eventId: ObjectId,
  activityId: ObjectId | null,
  authorId: ObjectId,         // Ref → users
  type: Enum['Update','Emergency','Accomplishment'],
  title: String,
  content: String,            // Markdown-formatted text
  attachments: [
    {
      url: String,            // Cloudinary URL
      publicId: String,       // For deletion
      fileType: Enum['image','pdf','document']
    }
  ],
  isResolved: Boolean,        // For Emergency type
  resolvedBy: ObjectId | null,
  resolvedAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

### `notifications` Collection
```js
{
  _id: ObjectId,
  recipientId: ObjectId,      // Ref → users
  type: Enum['Emergency','EventUpdate','AttendanceAlert','System'],
  title: String,
  message: String,
  relatedId: ObjectId | null, // Ref to event/report/etc.
  isRead: Boolean,
  createdAt: Date
}
```

---

## 🔌 API Endpoints (REST)

### Auth — `/api/auth`
| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| POST | `/login` | Public | Login, returns JWT in HTTP-only cookie |
| POST | `/logout` | Auth | Clear cookie |
| GET | `/me` | Auth | Get current user profile |
| PATCH | `/me/password` | Auth | Change own password |

### Users — `/api/users`
| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| GET | `/` | President, Secretary | List all org members |
| POST | `/` | President | Create new org member account |
| PATCH | `/:id` | President | Update role/status |
| DELETE | `/:id` | President | Deactivate account (soft delete) |

### Students — `/api/students`
| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| GET | `/` | Secretary+ | List all students (paginated, searchable) |
| POST | `/` | Secretary | Add single student |
| POST | `/import` | Secretary | Bulk import via CSV/Excel |
| GET | `/:id` | Secretary+ | Get student + attendance history |
| PATCH | `/:id` | Secretary | Update student info |
| DELETE | `/:id` | Secretary | Remove student |
| GET | `/:id/qr` | Secretary, Attendance | Get/regenerate QR code |

### Events — `/api/events`
| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| GET | `/` | Auth | List events (filtered by role) |
| POST | `/` | President, Officer | Create event |
| GET | `/:id` | Auth | Get event details + activities |
| PATCH | `/:id` | President, Officer | Update event |
| DELETE | `/:id` | President | Delete event |
| POST | `/:id/activities` | Officer | Add activity to event |
| PATCH | `/:id/activities/:actId` | Officer, Committee | Update activity |

### Attendance — `/api/attendance`
| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| POST | `/schedules` | Secretary | Create attendance schedule |
| GET | `/schedules/:eventId` | Auth | Get schedules for event |
| POST | `/scan` | Attendance | Submit a QR scan |
| POST | `/sync` | Attendance | Sync offline-buffered scans |
| GET | `/records/:eventId` | Secretary+ | Get all records for event |
| GET | `/records/:eventId/export` | Secretary+ | Export attendance as CSV/PDF |
| POST | `/mark-absent/:scheduleId` | Secretary | Manually trigger absent marking |

### Reports — `/api/reports`
| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| GET | `/` | Officer+ | List reports (filterable by type/event) |
| POST | `/` | Committee, Officer | Submit update or emergency report |
| GET | `/:id` | Auth | Get report detail |
| PATCH | `/:id/resolve` | President, Officer | Resolve emergency report |
| POST | `/accomplishment/:eventId` | Secretary+ | Generate accomplishment PDF |

---

## ⚡ Real-time Events (Socket.io)

### Server → Client Emissions
| Event | Payload | Listeners |
| :--- | :--- | :--- |
| `attendance:scan` | `{ studentName, sessionLabel, status, timestamp }` | Secretary, Attendance |
| `report:emergency` | `{ reportId, title, authorName, eventTitle }` | President, Officers |
| `report:update` | `{ reportId, activityName }` | Assigned Officer |
| `event:statusChange` | `{ eventId, newStatus }` | All |
| `notification:new` | `{ notificationId, message }` | Recipient only |

### Client → Server Emissions
| Event | Payload | Sender |
| :--- | :--- | :--- |
| `join:event` | `{ eventId }` | All authenticated users |
| `leave:event` | `{ eventId }` | All authenticated users |

**Room Strategy:** Each event has a Socket.io room (`event:{eventId}`). Users join on event page load. Role-based rooms (`role:President`) for cross-event broadcasts.

---

## 📲 QR Attendance System (Detailed)

### QR Code Structure
Each student's QR encodes an AES-256 encrypted JSON payload:
```json
{ "sid": "2024-0001", "salt": "random-uuid-v4" }
```
- The salt is stored in the `students` collection and rotated on each QR regeneration.
- Decryption key is stored server-side only (env variable).

### Scan Validation Flow
```
Scanner submits QR data
  → Server decrypts payload → validates studentId + salt
  → Checks active session window (openAt ≤ now ≤ closeAt)
  → Checks for duplicate scan in same session
  → Determines status: Present (within grace) or Late
  → Saves AttendanceRecord
  → Emits `attendance:scan` via Socket.io
  → Returns result to scanner UI
```

### Offline Scan Buffer
- Scanner stores scans in `localStorage` when `navigator.onLine === false`.
- On reconnect, calls `POST /api/attendance/sync` with buffered array.
- Server processes each record, skipping duplicates, and returns a sync summary.

### Automatic Absent Marking
- A scheduled job (node-cron) runs at `closeAt + 5 minutes` for each session.
- Finds all students not in `attendancerecords` for that session → inserts `Absent` records.
- Can also be triggered manually by Secretary via `POST /api/attendance/mark-absent/:scheduleId`.

---

## 📊 Dashboard & Analytics

### President Dashboard
- **Summary Cards:** Total events, active events, total students, overall attendance rate.
- **Attendance Trend Chart:** Line chart — attendance % per event over time.
- **Task Completion Chart:** Donut chart — Done / InProgress / Pending activities.
- **Emergency Feed:** Live list of unresolved emergency reports with resolve button.
- **Recent Activity Log:** Latest scans, report submissions, event status changes.

### Secretary Dashboard
- **Attendance Monitor:** Real-time table updating via Socket.io during active sessions.
- **Student Stats:** Year-level distribution bar chart, section breakdown.
- **Upcoming Schedules:** Calendar view of attendance sessions.

### Officer Dashboard
- **My Events:** Cards showing assigned events with status badges.
- **Activity Progress:** Per-event activity completion tracker.
- **Committee Updates Feed:** Latest updates from assigned committees.

### Attendance Dashboard
- **Active Session Panel:** Shows current session label, open/close time, scan count.
- **Live Scan Log:** Real-time list of scanned students (name, status, time).
- **QR Scanner View:** Full-screen camera scanner with audio/visual feedback.

---

## 📄 Automated Accomplishment Report (PDF)

### Report Contents (Auto-aggregated)
1. **Cover Page** — Event title, date range, venue, prepared by, date generated.
2. **Executive Summary** — Overall attendance rate, total activities, completion rate.
3. **Attendance Summary Table** — Per-session breakdown (Present / Late / Absent counts).
4. **Activity Reports** — Per activity: description, committee, status, all submitted updates with timestamps.
5. **Photo Documentation** — Grid of uploaded images from committee reports.
6. **Appendix** — Full attendance list (student name, ID, per-session status).

### Generation Flow
```
Secretary clicks "Generate Accomplishment Report"
  → POST /api/reports/accomplishment/:eventId
  → Server aggregates: Event + Activities + Updates + AttendanceRecords + Students
  → pdfkit builds PDF in memory
  → PDF uploaded to Cloudinary → URL returned
  → Report record saved in `reports` collection (type: Accomplishment)
  → Frontend opens PDF in react-pdf viewer / triggers download
```

---

## 🔒 Security Implementation

| Concern | Implementation |
| :--- | :--- |
| Auth token storage | JWT in HTTP-only, Secure, SameSite=Strict cookie |
| Password hashing | bcrypt with 12 salt rounds |
| Brute-force protection | `express-rate-limit`: 5 login attempts / 15 min per IP |
| NoSQL injection | `mongo-sanitize` middleware on all request bodies |
| XSS prevention | `helmet` sets Content-Security-Policy headers |
| CORS | Whitelist only frontend domain (`FRONTEND_URL` env var) |
| Input validation | Zod schemas on all POST/PATCH request bodies |
| QR anti-spoofing | AES-256 encrypted payload + server-side salt validation |
| File upload safety | Cloudinary validates MIME type; max 10MB per file |
| Sensitive routes | `requireRole()` middleware on every protected endpoint |
| Secrets | All keys in `.env`, never committed (`.gitignore`) |

---

## 🗺️ Development Roadmap

### Phase 1 — Foundation (Sprint 1–2) ~2 weeks
**Goal:** Working auth, project skeleton, DB connection.
- [ ] Initialize monorepo with Turborepo (client + server workspaces)
- [ ] Configure ESLint, Prettier, Husky pre-commit hooks
- [ ] Setup MongoDB Atlas cluster + Mongoose connection
- [ ] Implement `User` model + bcrypt password hashing
- [ ] Build JWT auth: login, logout, `/me` endpoint, HTTP-only cookie
- [ ] `requireAuth` and `requireRole` middleware
- [ ] Frontend: Vite + React + Tailwind + React Router setup
- [ ] Frontend: Login page + protected route wrapper + Zustand auth store
- [ ] Frontend: Base layout (Sidebar with role-based nav, Navbar, PageWrapper)

**Deliverable:** Authenticated users can log in and see a role-appropriate shell UI.

---

### Phase 2 — Student & User Management (Sprint 3–4) ~2 weeks
**Goal:** Full student database with import capability.
- [ ] `Student` model + CRUD API endpoints
- [ ] QR code generation service (AES encryption + `qrcode` npm)
- [ ] Email service (Nodemailer) — send QR code to student email
- [ ] CSV/Excel import endpoint (`csv-parser` + validation + batch insert)
- [ ] Frontend: Student list page (paginated table, search, filter by year/section)
- [ ] Frontend: Add/Edit student modal (React Hook Form + Zod)
- [ ] Frontend: CSV import modal with drag-and-drop and error reporting
- [ ] Frontend: QR code display modal with download/email options
- [ ] `User` management page (President only) — create/edit/deactivate org members

**Deliverable:** Secretary can manage the full student database and distribute QR codes.

---

### Phase 3 — Event & Activity Management (Sprint 5–6) ~2 weeks
**Goal:** Full event lifecycle management.
- [ ] `Event` model + CRUD API
- [ ] Activity sub-document management (add/edit/delete activities within event)
- [ ] Officer assignment to events; Committee assignment to activities
- [ ] Frontend: Event list page with status filters
- [ ] Frontend: Event creation/edit form (multi-step: details → activities → officers)
- [ ] Frontend: Activity management panel within event detail page
- [ ] Frontend: Committee update submission form (with file upload to Cloudinary)
- [ ] Frontend: Officer view — activity progress tracker

**Deliverable:** Officers can create events, assign activities, and committees can submit updates.

---

### Phase 4 — Attendance System (Sprint 7–8) ~2 weeks
**Goal:** Full QR scanning and attendance tracking.
- [ ] `AttendanceSchedule` + `AttendanceRecord` models
- [ ] Attendance schedule creation API (Secretary)
- [ ] QR scan validation endpoint (decrypt → validate → record)
- [ ] Offline sync endpoint (`POST /api/attendance/sync`)
- [ ] `node-cron` job for automatic absent marking
- [ ] Manual absent-marking trigger endpoint
- [ ] Attendance export (CSV + PDF) endpoint
- [ ] Frontend: Attendance schedule builder (Secretary)
- [ ] Frontend: QR Scanner view (Attendance role) — `html5-qrcode` + live scan log
- [ ] Frontend: Offline buffer logic in scanner (localStorage + sync on reconnect)
- [ ] Frontend: Real-time attendance monitor table (Secretary, Socket.io)
- [ ] Frontend: Attendance records table with export buttons

**Deliverable:** Attendance role can scan QR codes; Secretary sees live updates; absent marking is automated.

---

### Phase 5 — Reports & Real-time Alerts (Sprint 9–10) ~2 weeks
**Goal:** Emergency reporting, Socket.io integration, PDF accomplishment reports.
- [ ] `Report` + `Notification` models
- [ ] Report submission API (Update + Emergency types)
- [ ] Emergency resolve endpoint
- [ ] Socket.io server setup — rooms, event emissions
- [ ] Accomplishment report PDF generation service (`pdfkit`)
- [ ] PDF upload to Cloudinary + report record save
- [ ] Frontend: Socket.io client setup + connection management
- [ ] Frontend: Emergency report form (Committee) with file upload
- [ ] Frontend: Emergency feed widget (President dashboard, real-time)
- [ ] Frontend: Report list page with type filters
- [ ] Frontend: Accomplishment report generator button + PDF preview modal
- [ ] Frontend: Toast notifications for real-time events

**Deliverable:** Committees can file emergency reports; President sees them instantly; Secretary can generate PDF accomplishment reports.

---

### Phase 6 — Dashboard Analytics & Polish (Sprint 11–12) ~2 weeks
**Goal:** Full analytics dashboards, mobile optimization, deployment.
- [ ] President dashboard — summary cards, trend charts (Recharts), emergency feed
- [ ] Secretary dashboard — real-time attendance monitor, student stats charts
- [ ] Officer dashboard — event cards, activity progress
- [ ] Attendance dashboard — active session panel, live scan log
- [ ] Mobile-responsive audit (all pages tested on 375px viewport)
- [ ] Loading skeletons and empty states for all data tables
- [ ] Error boundary components
- [ ] Unit tests (Vitest) for critical frontend logic (QR buffer, form validation)
- [ ] API integration tests (Jest + Supertest) for auth, scan, and report endpoints
- [ ] Environment variable setup for Vercel + Render
- [ ] Deploy frontend to Vercel (connect GitHub repo, set env vars)
- [ ] Deploy backend to Render (set env vars, MongoDB Atlas IP whitelist)
- [ ] End-to-end smoke test on production URLs

**Deliverable:** Fully deployed, production-ready system.

---

## 🧪 Testing Strategy

| Layer | Tool | What to Test |
| :--- | :--- | :--- |
| Unit (Frontend) | Vitest + React Testing Library | QR offline buffer logic, form validation, role-based rendering |
| Unit (Backend) | Jest | QR decrypt/validate service, PDF generation service, absent-marking logic |
| Integration (API) | Jest + Supertest | Auth flow, scan endpoint, CSV import, report submission |
| E2E (Optional) | Playwright | Login → create event → scan QR → generate report flow |

---

## 🌐 Environment Variables

### Server (`.env`)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-256-bit-secret
JWT_EXPIRES_IN=7d
COOKIE_SECRET=your-cookie-secret
QR_ENCRYPTION_KEY=your-32-char-aes-key
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
```

### Client (`.env`)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 📈 Success Metrics

| Metric | Target |
| :--- | :--- |
| Attendance tracking accuracy | 100% (zero manual errors) |
| QR scan response time | < 500ms per scan |
| Accomplishment report generation | < 10 seconds |
| Time saved on report compilation | ≥ 50% vs. manual process |
| Real-time alert delivery | < 2 seconds (emergency to President screen) |
| Mobile usability | All core flows usable on 375px viewport |
| Uptime (production) | ≥ 99% (Vercel + Render SLA) |

---

## 🚧 Known Constraints & Mitigations

| Constraint | Mitigation |
| :--- | :--- |
| Render free tier spins down after inactivity | Add a keep-alive ping (UptimeRobot free tier) |
| MongoDB Atlas free tier 512MB limit | Paginate all list queries; archive old records |
| Camera access requires HTTPS | Vercel provides HTTPS by default; use ngrok for local mobile testing |
| Offline scan sync conflicts | Server deduplicates by `(studentId, sessionId)` unique index |
| Large PDF generation blocking event loop | Run `pdfkit` in a worker thread or queue with `bull` if needed |

---

*Last updated: May 2026 — Built for High-Performance Student Organizations.*
