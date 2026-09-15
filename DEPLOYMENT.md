# 🚀 ReviveAI — Production Cloud & Vercel Deployment Guide

ReviveAI is built for high-performance cloud deployment. The frontend and backend can be deployed together or independently using standard cloud primitives.

---

## 📋 Architecture Overview

```
┌──────────────────────────────────────┐       API Requests (HTTPS)       ┌──────────────────────────────────────┐
│       FRONTEND (Vercel / CDN)        │ ───────────────────────────────> │      BACKEND (Render / Railway / GCP) │
│  React 18 + Vite + Tailwind + SPA    │                                  │  FastAPI + SQLAlchemy + Guardrails    │
│  Base URL: https://reviveai.vercel.app│                                  │  Base URL: https://api.reviveai.io   │
└──────────────────────────────────────┘                                  └──────────────────────────────────────┘
```

---

## ⚡ Option 1: Vercel (Frontend) + Render/Railway (Backend) [Recommended]

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

This repository includes a `render.yaml` blueprint that launches both the FastAPI backend and the static frontend in one click.

1. Push your code to GitHub.
2. In Render, click **Blueprints** $\to$ **New Blueprint Instance**.
3. Select your repository.
4. Render will automatically read `render.yaml`, configure the backend and frontend services, wire the internal API URLs, and deploy both services simultaneously.

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
