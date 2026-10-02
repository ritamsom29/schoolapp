# Complete Deployment Guide: School Registration & Attendance System

This repository is ready for production deployment across several platforms. Choose the option that fits your setup:

---

## Option 1: Docker & Docker Compose (Recommended for Any VPS / Dedicated Server)

**Requirements:** Any server running Ubuntu/Debian/CentOS or Windows Server with Docker and Docker Compose installed.

### Steps:
1. Clone your project onto the server:
   ```bash
   git clone <your-repo-url>
   cd schoolapp
   ```
2. Build and start containers:
   ```bash
   docker compose up -d --build
   ```
3. Initialize and seed database:
   ```bash
   docker compose exec backend python run_seed.py
   ```
4. Access the application:
   - Web application: `http://<SERVER_IP>/`
   - Backend API documentation: `http://<SERVER_IP>:8000/docs`
   - All API requests are proxied internally via Nginx (`/api/*` to backend).

---

## Option 2: Render / Railway (Cloud Deployment)

### Backend (Web Service):
1. Create a **New Web Service** connected to your GitHub repository.
2. Root Directory: `backend`
3. Environment: `Python 3`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `python run_seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Set Environment Variables:
   - `SECRET_KEY`: `<Generate a random 32-character string>`
   - `CORS_ORIGINS`: `["https://your-frontend-app.vercel.app"]`
   - `DATABASE_URL`: `sqlite:///./school_attendance.db` (or attach a managed PostgreSQL database)

---

## Option 3: Vercel or Netlify (Frontend) + Render/VPS (Backend)

### Frontend Deployment on Vercel:
1. Import your repository on [Vercel](https://vercel.com).
2. Root Directory: `frontend`
3. Framework Preset: `Vite`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variable:
   - `VITE_API_URL`: `https://your-backend-api.onrender.com`

---

## Option 4: Deploying the Companion Mobile App (Expo)

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```
2. Update `.env` or set environment variable:
   ```
   EXPO_PUBLIC_API_URL=https://your-deployed-backend.com
   ```
3. Test locally on physical devices using Expo Go:
   ```bash
   npx expo start
   ```
4. Build native APK / iOS bundle with EAS:
   ```bash
   npm install -g eas-cli
   eas login
   eas build -p android --profile preview
   ```
