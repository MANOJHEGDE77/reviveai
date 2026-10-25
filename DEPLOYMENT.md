# 🚀 ReviveAI — Production Cloud & Vercel Deployment Guide

ReviveAI is built for high-performance cloud deployment. The frontend and backend can be deployed together or independently using standard cloud primitives.

---

## 📋 Architecture Overview

```
┌────────────────────────────────────────────────────────┐       API Requests (HTTPS)       ┌──────────────────────────────────────┐
│                FRONTEND & API (Vercel)                 │ ───────────────────────────────> │      BACKEND SERVERLESS (FastAPI)    │
│  React 18 + Vite + Tailwind + SPA                      │                                  │  FastAPI + SQLAlchemy + Guardrails    │
│  Base URL: https://reviveai-zeta.vercel.app            │                                  │  Path: /api/*                        │
└────────────────────────────────────────────────────────┘                                  └──────────────────────────────────────┘
```

> **Live Production Deployment**: [https://reviveai-zeta.vercel.app](https://reviveai-zeta.vercel.app)

---

## ⚡ Option 1: 1-Click Vercel Fullstack Serverless (Turnkey)

ReviveAI is fully equipped for 1-click deployment directly on Vercel with both the Vite React frontend and serverless Python FastAPI backend running together via `api/index.py` and `vercel.json`.

### Option 1A: Via Vercel Web Dashboard (Recommended)
1. Push this repository to your GitHub account (`git push origin main`).
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
3. Keep default settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
4. *(Optional)* Add Environment Variables in Vercel:
   - `GEMINI_API_KEY`: *(Optional: for dynamic Gemini LLM structured reasoning)*
   - `DATABASE_URL`: *(Optional: if you wish to connect Neon / Supabase PostgreSQL instead of the auto-seeded SQLite in `/tmp`)*
5. Click **Deploy**. Your entire frontend and `/api` backend endpoints will be live immediately!

### Option 1B: Via Vercel CLI
If you prefer deploying from your terminal:
```bash
# 1. Login to Vercel (first time only)
npx vercel login

# 2. Deploy to preview or production
npx vercel --prod
```

---

## ⚡ Option 2: Vercel (Frontend) + Render/Railway (Backend)

For high-throughput persistent production instances, you can decouple frontend on Vercel and backend on Render/Railway:

### Step 1: Deploy Backend to Render or Railway

#### Via Render.com:
1. Push your repository to GitHub.
2. Log into [Render.com](https://render.com) and click **New +** $\to$ **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Name**: `reviveai-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   - `DATABASE_URL`: `sqlite:///./reviveai.db` (or PostgreSQL URL)
   - `APPROVAL_THRESHOLD_INR`: `50000.0`
   - `MAX_RETRIES`: `2`
   - `GEMINI_API_KEY`: *(Optional: your Google Gemini API key for dynamic AI reasoning)*
6. Click **Deploy Web Service**.
7. Copy your assigned Render backend URL (e.g. `https://reviveai-api.onrender.com`).

---

### Step 2: Deploy Frontend to Vercel

1. Log into [Vercel](https://vercel.com) and click **Add New...** $\to$ **Project**.
2. Select your `Aimodel3` GitHub repository.
3. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Select `frontend` (or leave as root; `vercel.json` will handle builds automatically).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL`: `https://reviveai-api.onrender.com/api` *(replace with your backend URL from Step 1)*
5. Click **Deploy**.

> **Note on SPA Routing**: The included `vercel.json` automatically configures URL rewriting so routes like `/dashboard`, `/investigations`, `/recovery`, `/approvals`, and `/simulation` resolve seamlessly without 404 errors.

---

## 🌟 Option 2: 1-Click Render Blueprint (`render.yaml`)

This repository includes an enterprise-grade `render.yaml` blueprint that launches both the FastAPI backend and the static frontend in one click.

1. Push your code to GitHub.
2. In Render, click **Blueprints** $\to$ **New Blueprint Instance**.
3. Select your repository.
4. Render will automatically read `render.yaml`, configure the backend and frontend services, wire the internal API URLs, and deploy both services simultaneously.
5. **Media & Launch Video Streaming**: `render.yaml` is pre-configured with `Accept-Ranges: bytes` and long-term immutable caching for `/reviveai_product_launch.mp4` as well as SPA rewrites for the `/launch-video` route and static pass-through for `/launch_video.html`.

---

## 🐳 Option 3: Docker & Docker Compose (Self-Hosted / VPS / AWS EC2)

To run the complete platform on any cloud VPS (Ubuntu/Debian, AWS EC2, DigitalOcean, Hetzner):

```bash
# 1. Clone repository
git clone https://github.com/your-org/reviveai.git
cd reviveai

# 2. Configure environment variables (optional)
cp .env.example .env

# 3. Build and launch containers
docker compose up -d --build

# 4. Verify containers are running
docker compose ps
```

- **Frontend Web UI**: Accessible at port `80` (or `http://your-server-ip:5173`)
- **Backend API Docs**: Accessible at `http://your-server-ip:8000/docs`

---

## 🛡️ CORS & Security Configuration

The backend is pre-configured with open CORS middleware:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
This ensures your Vercel frontend can communicate with the backend on any domain without cross-origin blocks.

---

## 🧪 Post-Deployment Health Check

Verify your cloud deployment with the built-in health endpoint:

```bash
curl -X GET "https://your-backend-url/api/health"
```

Expected JSON response:
```json
{
  "status": "healthy",
  "service": "ReviveAI Autonomous Revenue Recovery Platform",
  "guardrails": {
    "max_retries": 2,
    "approval_threshold_inr": 50000.0,
    "recovery_window_hours": 24
  }
}
```
