# Owlytics Task Progress

Last checked: 2026-05-11

## Run Status

- [x] Repository cloned into `C:\Users\carlu\Desktop\MJ\Owlytics`
- [x] Dependencies installed with `npm install`
- [x] Root workspace metadata fixed with `packageManager`
- [x] Server TypeScript build fixed by adding the missing `mongoose` dependency and `MONGODB_URI` env key
- [x] Server starts locally with placeholder Supabase env values
- [x] API health check passes at `http://localhost:5000/api/health`
- [x] Client starts locally at `http://127.0.0.1:5173`
- [x] Direct package builds pass: `npm run build --workspace server` and `npm run build --workspace client`
- [ ] Root `npm run build` still fails through Turbo on this Windows/npm setup even though the package builds pass directly
- [ ] Real login/data flows still need a real Supabase project with `supabase_schema.sql` applied and valid env keys

## Setup And Architecture

- [x] Supabase SQL schema exists in `supabase_schema.sql`
- [x] API controllers are wired to Supabase tables and Supabase Auth
- [x] `.env.example` now documents the Supabase variables used by the current code
- [ ] Decide whether the project is Supabase-first or MongoDB-first
- [ ] Remove or migrate stale Mongoose models, `db.ts`, `seed.ts`, and `check.ts`
- [ ] Update `plan.md` so the roadmap matches the implemented Supabase architecture
- [ ] Add local development setup steps for creating a Supabase project, applying schema, and seeding users
- [ ] Add a reliable root build/dev workflow, either by fixing Turbo execution or replacing the scripts

## Auth, Roles, And Users

- [x] Supabase login flow exists on the client
- [x] Protected routes exist on the client
- [x] `requireAuth` and `requireRole` middleware exist on the server
- [x] User/member list, create, edit, and deactivate flows exist
- [ ] Add a bootstrap/seed path for the first President account
- [ ] Add role-based data scoping, not just role-based route access
- [ ] Add Supabase RLS policies before production
- [ ] Add auth and RBAC tests
- [ ] Reconcile `auth.controller.login` with the client, which currently logs in directly through Supabase

## Student Management

- [x] Student CRUD API exists
- [x] Student list, search, pagination, add/edit/delete UI exists
- [x] Student QR display modal exists
- [ ] Generate encrypted QR payloads and QR image URLs when students are created
- [ ] Add QR regeneration endpoint and UI action
- [ ] Replace QR print behavior with a real download action
- [ ] Implement CSV/Excel import logic behind `/api/students/import`
- [ ] Add import UI with validation errors and batch summary
- [ ] Add email delivery for QR codes

## Events And Activities

- [x] Event list/create/edit/delete/status update API exists
- [x] Event list/create/edit/delete/status UI exists
- [x] Activity create and status update flow exists
- [ ] Add officer assignment UI and update logic
- [ ] Add committee assignment UI and update logic
- [ ] Add activity update submissions from committee users
- [ ] Add file upload/storage for activity updates
- [ ] Add activity delete support
- [ ] Validate event and activity date ranges
- [ ] Filter event visibility by role and assignment

## Attendance

- [x] Attendance schedule create/list API exists
- [x] Attendance schedule builder UI exists
- [x] Attendance record list UI exists
- [ ] Implement the QR camera scanner page
- [ ] Add the scanner dependency and wire camera permissions/errors
- [ ] Implement QR decrypt, student lookup, salt validation, session-window validation, duplicate prevention, and Present/Late status logic
- [ ] Persist successful scans to `attendance_records`
- [ ] Emit `attendance:scan` over Socket.io after successful scans
- [ ] Implement offline scan buffering in the client
- [ ] Implement `/api/attendance/sync`
- [ ] Implement automatic absent marking
- [ ] Implement manual absent marking instead of the current placeholder response
- [ ] Implement attendance CSV/PDF export
- [ ] Persist and enforce assigned scanners

## Reports And Notifications

- [x] Report list/create/detail/resolve API exists
- [x] Report list/create/resolve UI exists
- [x] Emergency report Socket.io emit exists on create
- [ ] Add authenticated Socket.io connection and role-room joining from the client
- [ ] Add client listeners for emergency, attendance, report, and notification events
- [ ] Implement attachment upload instead of accepting pre-existing URLs only
- [ ] Implement Cloudinary or Supabase Storage integration
- [ ] Implement accomplishment PDF generation behind `/api/reports/accomplishment/:eventId`
- [ ] Add PDF preview/download UI
- [ ] Persist notifications and add read/unread flows

## Dashboard And Frontend Polish

- [x] Role-specific dashboard components exist
- [x] Directory combines students and members
- [x] Basic loading and empty states exist on main pages
- [ ] Replace placeholder scanner dashboard data with active session data
- [ ] Add real attendance trend data instead of derived/mock chart values
- [ ] Add responsive QA pass for mobile widths
- [ ] Add error boundary components
- [ ] Add route-level code splitting; current client bundle is larger than Vite's 500 kB warning threshold
- [ ] Add complete form validation and permission-aware hiding/disabling of actions

## Quality, Security, And Deployment

- [ ] Add ESLint v9 flat config; current lint scripts fail because `eslint.config.*` is missing
- [ ] Add frontend unit tests for auth, forms, and offline scan buffering
- [ ] Add backend integration tests for auth, events, students, scans, and reports
- [ ] Add E2E smoke tests for login, event creation, schedule creation, scan, and report generation
- [ ] Fix the high-severity `nodemailer` npm audit finding
- [ ] Upgrade deprecated/risky packages such as Multer 1.x
- [ ] Add production deployment docs and env checklists
- [ ] Add CI for install, build, lint, test, and audit
