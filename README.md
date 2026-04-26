# የዕቅድ አስተዳደር ሥርዓት
## 22 ማዞሪያ ሙሉ ወንጌል አጥቢያ — Plan Management System

A digital planning and reporting system for the 22 Mazoria Full Gospel Church assembly.
Replaces paper-based Amharic annual plans, budget costing sheets, and quarterly progress reports.

---

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

That single command will:
1. Start PostgreSQL (port 5433)
2. Start MinIO object storage (port 9000)
3. Run Django migrations
4. Seed demo data — admin, elders, 5 ministries, prior-year approved plans
5. Start the Django REST API on **http://localhost:8001**
6. Start the Angular UI on **http://localhost:4300**

Open **http://localhost:4300** in your browser.

---

## Running Services & Ports

| Service | URL | Notes |
|---|---|---|
| Angular UI | http://localhost:4300 | Main application |
| Django API | http://localhost:8001 | REST API + Django admin |
| Django Admin | http://localhost:8001/admin/ | Login with `admin` / `Admin1234!` |
| MinIO Console | http://localhost:9001 | Object storage UI (`minioadmin` / `minioadmin`) |
| PostgreSQL | localhost:5432 | DB `plansys`, user `plansys` |

---

## Demo Credentials

| Role | Username | Password | Portal |
|---|---|---|---|
| አስተዳዳሪ (Admin) | `admin` | `Admin1234!` | http://localhost:4300 → /admin |
| ሽማግሌ (Elder) | `elder1` | `Elder1234!` | http://localhost:4300 → /elder |
| ሽማግሌ (Elder) | `elder2` | `Elder1234!` | http://localhost:4300 → /elder |
| ዘርፍ ኃላፊ — ሕጻናት | `leader1` | `Leader1234!` | http://localhost:4300 → /ministry |
| ዘርፍ ኃላፊ — ወጣቶች | `leader2` | `Leader1234!` | http://localhost:4300 → /ministry |
| ዘርፍ ኃላፊ — ሴቶች | `leader3` | `Leader1234!` | http://localhost:4300 → /ministry |
| ዘርፍ ኃላፊ — አምልኮ | `leader4` | `Leader1234!` | http://localhost:4300 → /ministry |
| ዘርፍ ኃላፊ — ወንጌላዊ | `leader5` | `Leader1234!` | http://localhost:4300 → /ministry |

---

## Verification Steps

### 1. Ministry Leader — fill and submit a plan
1. Go to http://localhost:4300, login as `leader1` / `Leader1234!`
2. Click **ዕቅድ ጀምር** (Start Plan) on the dashboard
3. Work through the wizard steps: Introduction → General Objective → Goals → Activities → Budget → Assumptions → M&E → Risks → Schedule → Review
4. Click **ረቂቅ አስቀምጥ** at any point to save a draft (autosaves every 20 s)
5. On the final step, click **አስገባ** to submit

### 2. Elder — approve or return a plan
1. Login as `elder1` / `Elder1234!`
2. The **ዕቅዶች** tab shows all submitted plans
3. Click **ይመልከቱ** on a submitted plan
4. Click **አጽድቅ** to approve, or add a comment and click **ለክለሳ መልስ** to return it

### 3. Elder — open a quarterly report window
1. As `elder1`, click the **የሪፖርት መስኮቶች** tab
2. Toggle **ክፍት?** on for the ministry + quarter you want to unlock

### 4. Ministry Leader — submit a quarterly report
1. Login as the corresponding ministry leader (e.g. `leader1`)
2. The dashboard shows **ሪፖርት አዘጋጅ** buttons for each quarter once unlocked
3. The report wizard pre-loads goals and activities from the approved plan
4. Fill in progress percentages, budget utilization, narrative sections, then click **ሪፖርቱን አስገባ**

### 5. Admin — manage ministries and users
1. Login as `admin` / `Admin1234!`
2. Use the **የአገልግሎት ዘርፎች** tab to create or toggle ministries
3. Use the **ተጠቃሚዎች** tab to create users, assign roles/ministries, or reset passwords

---

## Architecture

```
PlanManagementSystem/
├── docker-compose.yml       # Full stack orchestration
├── .env.example             # Environment variable template (copy to .env)
├── backend/                 # Django 5 + Django REST Framework
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── config/              # Settings, root URLs, JSON logging
│   └── apps/
│       ├── accounts/        # Custom User model, JWT auth, role permissions
│       ├── ministries/      # Ministry, FiscalYear, ReportWindow models
│       ├── plans/           # Plan + Goals + Outputs + Activities + Budget + Schedule
│       ├── reports/         # QuarterlyReport + activity progress + budget utilization
│       ├── documents/       # File upload/download via MinIO
│       └── audit/           # Immutable audit log for all state transitions
└── frontend/                # Angular 18 standalone components + Angular Material
    └── src/app/
        ├── core/            # Services, guards, JWT interceptor, TypeScript models
        └── features/
            ├── auth/        # Login page (Amharic, role-based redirect)
            ├── ministry/    # Dashboard, plan wizard (10 steps), report wizard
            ├── elder/       # Plans dashboard, plan review, report window toggles
            └── admin/       # Ministry management, user management, password reset
```

---

## API Reference

Base URL: `http://localhost:8001/api`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/auth/login/` | All | JWT login |
| POST | `/auth/refresh/` | All | Refresh access token |
| GET | `/auth/me/` | All | Current user profile |
| GET/POST | `/plans/` | All | List / create annual plans |
| GET/PATCH | `/plans/{id}/` | All | Retrieve / update plan (nested save) |
| POST | `/plans/{id}/submit/` | Ministry Leader | Submit plan to elders |
| POST | `/plans/{id}/approve/` | Elder / Admin | Approve submitted plan |
| POST | `/plans/{id}/return/` | Elder / Admin | Return plan for revision |
| GET/POST | `/reports/` | All | List / create quarterly reports |
| PATCH | `/reports/{id}/` | Ministry Leader | Save report (nested) |
| POST | `/reports/{id}/submit/` | Ministry Leader | Submit quarterly report |
| GET/POST | `/report-windows/` | Elder / Admin | List / create report windows |
| POST | `/report-windows/{id}/toggle/` | Elder / Admin | Open or close report window |
| GET/POST | `/ministries/` | All / Admin | List / create ministries |
| GET/POST | `/fiscal-years/` | All / Admin | List / create fiscal years |
| POST | `/fiscal-years/{id}/toggle_plan_window/` | Admin | Open or close plan submission |
| GET/POST | `/users/` | Admin | List / create users |
| POST | `/users/{id}/reset-password/` | Admin | Reset a user's password |
| POST | `/documents/upload/` | Ministry Leader | Upload file (multipart) |
| GET | `/documents/{id}/download/` | All | Get presigned download URL |

---

## Running Tests

```bash
docker compose exec backend python manage.py test apps.plans
```

Tests cover: JWT auth, plan create/save/submit lifecycle, elder approve/return, and ministry-level data isolation.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DJANGO_SECRET_KEY` | *(required)* | Django secret key — change in production |
| `DJANGO_DEBUG` | `1` | Set to `0` in production |
| `DJANGO_ALLOWED_HOSTS` | `localhost,...` | Comma-separated allowed hosts |
| `POSTGRES_DB` | `plansys` | PostgreSQL database name |
| `POSTGRES_USER` | `plansys` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `plansys` | PostgreSQL password |
| `MINIO_ROOT_USER` | `minioadmin` | MinIO access key |
| `MINIO_ROOT_PASSWORD` | `minioadmin` | MinIO secret key |
| `MINIO_BUCKET` | `plansys-docs` | Bucket name for uploaded documents |
| `JWT_ACCESS_LIFETIME_MINUTES` | `60` | Access token lifetime |
| `JWT_REFRESH_LIFETIME_DAYS` | `7` | Refresh token lifetime |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4300` | Allowed CORS origins |

---

## Known Limitations (v1)

- PDF export of plans and reports is not yet implemented (v2)
- Email notifications are not configured in development (SMTP stub only)
- Document presigned download URLs expire after 1 hour
- Ethiopian Ge'ez calendar display uses Gregorian dates internally; calendar conversion is a v2 feature
- Multi-church / multi-tenant support is out of scope for this release
