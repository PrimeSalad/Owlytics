# 📋 Accomplishment Report System — God Mode Plan

> **Stack:** React + TypeScript (Vite) · Express + Supabase · PDFKit · Socket.io  
> **Current state:** Basic `ReportsPage.tsx` exists with Update / Emergency / Accomplishment types. Server has stub `generateAccomplishment` endpoint. No image upload, no compiled export, no per-event aggregation.

---

## 🎯 Goal

Any committee member or officer can submit a **per-activity report** with text + images. The Secretary / President can then **compile all reports for an event** into a single, beautifully formatted **Accomplishment Report PDF** that can be downloaded or printed.

---

## 🗂️ Feature Breakdown

### 1. Report Submission (Committee / Officer)

| Feature | Details |
|---|---|
| **Event + Activity selector** | Dropdown: pick event → pick activity under that event |
| **Report type** | `Accomplishment` (default for this flow), `Update`, `Emergency` |
| **Rich text content** | Textarea with character count (min 50 chars for Accomplishment) |
| **Image upload** | Up to **5 images** per report, drag-and-drop or file picker |
| **Image preview** | Thumbnail grid before submit, removable |
| **Caption per image** | Optional short caption shown in the compiled PDF |
| **Status tag** | `Draft` → `Submitted` → `Approved` / `Rejected` |
| **Re-submit** | If rejected, author can edit and resubmit |

---

### 2. Report Review (Officer / President / Secretary)

| Feature | Details |
|---|---|
| **Review queue** | Filterable list: by event, by activity, by status, by author |
| **Approve / Reject** | One-click with optional rejection note |
| **Real-time badge** | Socket.io pushes pending count to Navbar badge |
| **View images inline** | Lightbox / image viewer inside the report modal |
| **Comment thread** | Reviewer can leave inline comments (reuses existing comment pattern from Tasks) |

---

### 3. Compiled Accomplishment Report (Secretary / President)

| Feature | Details |
|---|---|
| **Event-level compilation** | Aggregate all `Approved` Accomplishment reports for one event |
| **Preview page** | Web preview before export — shows final layout |
| **Section order** | Drag-and-drop to reorder activity sections in the compiled report |
| **Cover page** | Organization name, event title, date range, prepared-by |
| **Per-activity section** | Activity name · time · committee · narrative text · photos grid |
| **Photo layout** | 2-column grid, captions below each photo |
| **Summary stats** | Total attendees, activities completed, officers involved |
| **Export to PDF** | Server-side PDFKit render, streamed as download |
| **Export to DOCX** | Optional: `docx` npm package for Word export |
| **Print-friendly** | CSS `@media print` version of the web preview |
| **Watermark** | "DRAFT" watermark until President marks as Final |
| **Version history** | Each export is saved with timestamp + exported-by |

---

### 4. Notifications & Real-time

| Trigger | Who gets notified |
|---|---|
| New report submitted | Officer + Secretary (role room via Socket.io) |
| Report approved | Report author |
| Report rejected | Report author + rejection note |
| Compiled PDF ready | President + Secretary |
| Emergency report | President (existing behavior, keep) |

---

## 🗄️ Database Changes (Supabase)

### `reports` table — add columns

```sql
ALTER TABLE reports
  ADD COLUMN activity_id   UUID REFERENCES activities(id),
  ADD COLUMN status        TEXT NOT NULL DEFAULT 'Submitted'
                           CHECK (status IN ('Draft','Submitted','Approved','Rejected')),
  ADD COLUMN rejection_note TEXT,
  ADD COLUMN approved_by   UUID REFERENCES profiles(id),
  ADD COLUMN approved_at   TIMESTAMPTZ;
```

### `report_attachments` table — add caption

```sql
ALTER TABLE report_attachments
  ADD COLUMN caption TEXT,
  ADD COLUMN sort_order INT DEFAULT 0;
```

### `accomplishment_exports` table — new

```sql
CREATE TABLE accomplishment_exports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES events(id),
  exported_by  UUID NOT NULL REFERENCES profiles(id),
  pdf_url      TEXT,
  is_final     BOOLEAN DEFAULT FALSE,
  section_order JSONB,          -- ordered array of activity_ids
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

---

## 🖥️ Frontend — New / Modified Files

```
client/src/
├── pages/
│   └── ReportsPage.tsx              ← REWRITE (god mode)
├── features/
│   └── reports/
│       ├── ReportSubmitModal.tsx    ← NEW: full submission form w/ image upload
│       ├── ReportCard.tsx           ← NEW: card with status badge + image thumbnails
│       ├── ReportDetailModal.tsx    ← NEW: full view, approve/reject, comments, lightbox
│       ├── CompileReportModal.tsx   ← NEW: event picker + section reorder + export
│       ├── AccomplishmentPreview.tsx← NEW: web preview of compiled report
│       ├── ImageUploader.tsx        ← NEW: drag-drop multi-image with captions
│       └── useReports.ts            ← NEW: React Query hooks
```

### `ReportsPage.tsx` — Layout

```
┌─────────────────────────────────────────────────────────┐
│  Reports                          [+ New Report] [Export]│
├─────────────────────────────────────────────────────────┤
│  [All] [Accomplishment] [Update] [Emergency]             │
│  Filter: Event ▾  Status ▾  Author ▾                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Report Card  │  │ Report Card  │  │ Report Card  │  │
│  │ [img thumb]  │  │ [img thumb]  │  │ [img thumb]  │  │
│  │ Title        │  │ Title        │  │ Title        │  │
│  │ Activity     │  │ Activity     │  │ Activity     │  │
│  │ Author · Date│  │ Author · Date│  │ Author · Date│  │
│  │ ● Approved   │  │ ● Submitted  │  │ ● Rejected   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### `ReportSubmitModal.tsx` — Form Layout

```
┌─────────────────────────────────────────────────────────┐
│  Submit Accomplishment Report                        [×] │
├─────────────────────────────────────────────────────────┤
│  Event *          [Select event ▾]                       │
│  Activity *       [Select activity ▾]                    │
│  Report Type      [Accomplishment ▾]                     │
│  Title *          [________________________________]      │
│  Narrative *      [________________________________]      │
│                   [________________________________]      │
│                   [________________________________]      │
│                   [  250 / 2000 chars             ]      │
│                                                          │
│  Photos (up to 5)                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────┐  │
│  │ img1 │ │ img2 │ │ img3 │ │ img4 │ │  + Add Photo │  │
│  │[cap] │ │[cap] │ │[cap] │ │[cap] │ └──────────────┘  │
│  └──────┘ └──────┘ └──────┘ └──────┘                    │
│                                                          │
│                        [Cancel]  [Save Draft]  [Submit]  │
└─────────────────────────────────────────────────────────┘
```

### `CompileReportModal.tsx` — Compile Flow

```
Step 1: Select Event
  └─ Shows count of Approved reports per event

Step 2: Arrange Sections
  └─ Drag-and-drop list of activities
  └─ Toggle include/exclude per activity
  └─ Preview thumbnail of each section

Step 3: Cover Page Details
  └─ Organization name (pre-filled from settings)
  └─ Prepared by (pre-filled: current user)
  └─ Date prepared (today)
  └─ Custom subtitle / theme

Step 4: Export
  └─ [Preview in Browser]  [Download PDF]  [Mark as Final]
```

---

## ⚙️ Backend — New / Modified Files

```
server/src/
├── controllers/
│   └── report.controller.ts         ← EXTEND: approve, reject, compile
├── routes/
│   └── report.routes.ts             ← EXTEND: new endpoints
├── services/
│   └── pdfService.ts                ← NEW: PDFKit accomplishment generator
├── middleware/
│   └── upload.ts                    ← EXTEND: image upload to Supabase Storage
```

### New API Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/api/reports` | Officer+ | List with filters (existing, extend) |
| `POST` | `/api/reports` | Committee+ | Submit report (extend: images, activity, status) |
| `GET` | `/api/reports/:id` | Any auth | Get single report with attachments |
| `PATCH` | `/api/reports/:id/approve` | Officer+ | Approve report |
| `PATCH` | `/api/reports/:id/reject` | Officer+ | Reject with note |
| `PATCH` | `/api/reports/:id/resolve` | Officer+ | Resolve emergency (existing) |
| `POST` | `/api/reports/compile/:eventId` | Secretary+ | Generate compiled PDF |
| `GET` | `/api/reports/exports/:eventId` | Secretary+ | List past exports for event |

### `pdfService.ts` — PDF Layout

```
Page 1: Cover
  ├─ Organization logo (top center)
  ├─ "ACCOMPLISHMENT REPORT" (large heading)
  ├─ Event title
  ├─ Date range
  ├─ Prepared by + date
  └─ "DRAFT" diagonal watermark (if not final)

Page 2+: Per-Activity Sections
  ├─ Section header: Activity name + time + committee
  ├─ Narrative text (justified)
  └─ Photo grid (2 columns, captions below)
      ├─ [Photo 1]    [Photo 2]
      ├─ Caption 1    Caption 2
      ├─ [Photo 3]    [Photo 4]
      └─ Caption 3    Caption 4

Last Page: Summary
  ├─ Total activities: N
  ├─ Total reports submitted: N
  ├─ Officers involved: list
  └─ Signature block (President / Secretary)
```

---

## 🔌 Image Upload Flow

```
Client                    Server                   Supabase Storage
  │                          │                           │
  │── POST /api/reports ───► │                           │
  │   (multipart/form-data)  │── upload buffer ─────────►│
  │                          │◄─ public URL ─────────────│
  │                          │── insert report + URLs ──►│ (DB)
  │◄─ 201 { report } ────────│                           │
```

- Use `multer` (already installed) for multipart parsing
- Upload to `Supabase Storage` bucket `report-images`
- Store public URL + path in `report_attachments`
- Max file size: **5 MB per image**, accepted: `image/jpeg`, `image/png`, `image/webp`
- Server resizes to max 1920px wide before storing (use `sharp` or skip for MVP)

---

## 📦 New Dependencies

| Package | Side | Purpose |
|---|---|---|
| `pdfkit` | server | Already installed ✅ |
| `multer` | server | Already installed ✅ |
| `@supabase/supabase-js` | server | Already installed ✅ |
| `react-dropzone` | client | Drag-drop image upload |
| `yet-another-react-lightbox` | client | Image lightbox viewer |
| `@dnd-kit/sortable` | client | Already installed ✅ (section reorder) |

Install needed:
```bash
# client
npm install react-dropzone yet-another-react-lightbox

# server (optional, for image resize)
npm install sharp
```

---

## 🚦 Implementation Phases

### Phase 1 — Enhanced Submission (1–2 days)
- [ ] DB migration: add `status`, `activity_id`, `rejection_note` to `reports`
- [ ] Add `caption`, `sort_order` to `report_attachments`
- [ ] Extend `createReportSchema` validator
- [ ] Extend `createReport` controller: handle multipart, upload images to Supabase Storage
- [ ] Rewrite `ReportSubmitModal.tsx` with `ImageUploader.tsx`
- [ ] Update `Report` type in `client/src/types/index.ts`

### Phase 2 — Review Flow (1 day)
- [ ] Add `approveReport` + `rejectReport` controllers
- [ ] Add routes `PATCH /reports/:id/approve` and `PATCH /reports/:id/reject`
- [ ] Build `ReportDetailModal.tsx` with approve/reject UI + image lightbox
- [ ] Socket.io: emit `report:approved` / `report:rejected` to author's user room
- [ ] Navbar badge for pending reports (Secretary / Officer / President only)

### Phase 3 — Compiled PDF (2–3 days)
- [ ] Create `accomplishment_exports` table
- [ ] Build `pdfService.ts` with PDFKit: cover page, activity sections, photo grid, summary
- [ ] Add `POST /api/reports/compile/:eventId` endpoint
- [ ] Build `CompileReportModal.tsx` (4-step wizard)
- [ ] Build `AccomplishmentPreview.tsx` (web preview before export)
- [ ] Add drag-and-drop section reorder using `@dnd-kit/sortable`

### Phase 4 — Polish (1 day)
- [ ] Print CSS for `AccomplishmentPreview`
- [ ] "Mark as Final" removes DRAFT watermark from PDF
- [ ] Export history list per event
- [ ] Empty states, loading skeletons, error boundaries
- [ ] Mobile-responsive report cards and modals

---

## 🎨 UI Design Tokens (match existing project style)

```
Status colors:
  Draft      → slate-400 bg-slate-50
  Submitted  → amber-600 bg-amber-50
  Approved   → green-600 bg-green-50
  Rejected   → red-600   bg-red-50

Report card:
  - White card, rounded-2xl, shadow-sm
  - Left color bar (4px) matching status color
  - Image thumbnails: 3-up strip at bottom of card
  - Hover: shadow-md, slight translateY(-1px)

Compile modal:
  - Step indicator at top (1 → 2 → 3 → 4)
  - Section drag handles: ⠿ icon, slate-300
  - Preview iframe or div with print-like styling
```

---

## 🔐 Role Permissions Matrix

| Action | Committee | Officer | Secretary | President |
|---|---|---|---|---|
| Submit report | ✅ | ✅ | ✅ | ✅ |
| View own reports | ✅ | ✅ | ✅ | ✅ |
| View all reports | ❌ | ✅ | ✅ | ✅ |
| Approve / Reject | ❌ | ✅ | ✅ | ✅ |
| Compile PDF | ❌ | ❌ | ✅ | ✅ |
| Mark as Final | ❌ | ❌ | ❌ | ✅ |
| Delete report | ❌ | ❌ | ❌ | ✅ |

---

## 📁 File Change Summary

| File | Action |
|---|---|
| `docs/reports.md` | NEW — this plan |
| `migrations/reports_v2.sql` | NEW — DB schema changes |
| `server/src/validators/report.validator.ts` | EXTEND |
| `server/src/controllers/report.controller.ts` | EXTEND |
| `server/src/routes/report.routes.ts` | EXTEND |
| `server/src/services/pdfService.ts` | NEW |
| `server/src/middleware/upload.ts` | EXTEND (Supabase Storage) |
| `client/src/types/index.ts` | EXTEND (Report type) |
| `client/src/pages/ReportsPage.tsx` | REWRITE |
| `client/src/features/reports/ReportSubmitModal.tsx` | NEW |
| `client/src/features/reports/ReportCard.tsx` | NEW |
| `client/src/features/reports/ReportDetailModal.tsx` | NEW |
| `client/src/features/reports/CompileReportModal.tsx` | NEW |
| `client/src/features/reports/AccomplishmentPreview.tsx` | NEW |
| `client/src/features/reports/ImageUploader.tsx` | NEW |
| `client/src/features/reports/useReports.ts` | NEW |

---

## 🧪 Testing Checklist

- [ ] Committee submits report with 3 images → images appear in DB + Storage
- [ ] Officer approves → author gets socket notification
- [ ] Officer rejects with note → author sees rejection note on their report
- [ ] Secretary compiles event with 4 activities → PDF downloads correctly
- [ ] PDF contains all approved reports, photos with captions, cover page
- [ ] DRAFT watermark present; President marks Final → watermark gone
- [ ] Role gates: Committee cannot access compile endpoint (403)
- [ ] Image > 5MB rejected with clear error message
- [ ] Non-image file type rejected
- [ ] Empty event (no approved reports) shows helpful message in compile modal

---

*Last updated: May 16, 2026 · Author: Kiro*
