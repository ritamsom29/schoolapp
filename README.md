# School Registration and Attendance Management System

A production-ready full-stack School Registration and Attendance Management System featuring real-time data persistence, automated percentage calculations, working days computation with public/school holiday exclusion, official PDF & Excel export, and an integrated companion mobile app for teachers with offline-first synchronization.

---

## 🏗 Architecture & Stack

- **Web Frontend:** React 19, Vite, Tailwind CSS v4, React Router 7, Axios, Recharts, Lucide Icons, React Hot Toast.
- **Backend:** Python FastAPI, SQLAlchemy 2.0 ORM, Pydantic v2, Python-Jose JWT Authentication, Passlib/Bcrypt hashing.
- **Database:** SQLite (development) / PostgreSQL (production-compatible).
- **Reports:** ReportLab (official PDF generation) & OpenPyXL (custom formatted Excel spreadsheets).
- **Mobile Companion:** React Native (Expo SDK 52) with AsyncStorage offline queuing & background sync.

---

## 📁 Project Structure

```
schoolapp/
├── backend/
│   ├── app/
│   │   ├── auth/              # JWT tokens, password hashing, dependencies
│   │   ├── config.py          # App configuration & environment settings
│   │   ├── database/          # SQLAlchemy engine, session, and seed scripts
│   │   ├── models/            # 10 database tables with constraints & relations
│   │   ├── reports/           # ReportLab PDF & OpenPyXL Excel generators
│   │   ├── routers/           # Auth, students, teachers, academic, attendance, dashboard, reports, settings
│   │   └── schemas/           # Pydantic request/response validation schemas
│   ├── tests/                 # Automated pytest test suite
│   ├── requirements.txt       # Python dependencies
│   ├── run_seed.py            # Database initialization and sample data seed
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── context/           # AuthContext (JWT persistence, roles)
│   │   ├── layouts/           # Responsive AdminLayout with sidebar navigation
│   │   ├── pages/             # Students, Teachers, Classes, Attendance, Reports, Dashboard, Settings, Login
│   │   └── services/          # Centralized Axios API service layer
│   ├── package.json
│   └── vite.config.js
├── mobile/
│   ├── App.js                 # Teacher mobile app with offline attendance taking
│   ├── services/api.js        # Offline storage queue & auto-sync logic
│   └── package.json
└── README.md
```

---

## ⚡ Quick Start & Setup

### 1. Backend Setup

```bash
cd backend

# Create virtual environment & install requirements
python -m venv venv
.\venv\Scripts\activate      # Windows
# or source venv/bin/activate  # macOS / Linux

pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Initialize and seed database with 32 students, 5 teachers, 12 classes, 36 sections, holidays & attendance
python run_seed.py

# Run FastAPI backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Interactive API documentation: `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run Vite development server
npm run dev
```
Open web portal: `http://localhost:5173`

---

### 3. Mobile Companion Setup (For Teachers)

```bash
cd mobile

# Install dependencies
npm install

# Start Expo dev server
npm start
```

---

## 🔑 Default Login Credentials

| Role | Username | Email | Password | Assigned Grade |
|---|---|---|---|---|
| **Administrator** | `admin` | `admin@school.com` | `admin123` | Full Access |
| **Teacher 1** | `rajesh` | `rajesh@school.com` | `teacher123` | Class 10 - Section A |
| **Teacher 2** | `priya` | `priya@school.com` | `teacher123` | Class 10 - Section B |
| **Teacher 3** | `amit` | `amit@school.com` | `teacher123` | Class 9 - Section A |
| **Teacher 4** | `neha` | `neha@school.com` | `teacher123` | Class 9 - Section B |
| **Teacher 5** | `suresh` | `suresh@school.com` | `teacher123` | Class 8 - Section A |

---

## 🧪 Testing

Run backend automated test suite:
```bash
cd backend
pytest -v
```

All 5 core suites pass (`test_health_check`, `test_admin_login_success`, `test_invalid_login`, `test_get_students_authenticated`, `test_dashboard_statistics`).
