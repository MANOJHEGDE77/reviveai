# Contributing to ReviveAI

Thank you for your interest in contributing to **ReviveAI**! We welcome contributions to our autonomous revenue recovery platform, including new recovery playbooks, UI enhancements, AI diagnostic prompts, and performance optimizations.

---

## 🚀 Getting Started

### Prerequisites
- **Python**: 3.12+ / 3.13
- **Node.js**: 20+ & npm
- **Git**
- Optional: Docker & Docker Compose

### Local Development Setup

1. **Fork & Clone** the repository:
   ```bash
   git clone https://github.com/<your-username>/reviveai.git
   cd reviveai
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate

   pip install -r requirements.txt
   python -m uvicorn app.main:app --reload --port 8000
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Verify Installations**:
   - Backend API Docs: `http://localhost:8000/docs`
   - Frontend Console: `http://localhost:5173/`

---

## 🛡 Architectural & Safety Rules

When making contributions to the core engine:
1. **Deterministic Guardrails**: Financial safety rules in `backend/app/guardrails.py` must never be bypassed:
   - Max retry attempts $\le 2$.
   - Human approval required for amounts $\ge ₹50,000$.
   - Recovery window bounded by 24 hours.
   - Immediate auto-termination upon settlement.
2. **Explainability**: Every decision produced by the AI Agent (`backend/app/ai_agent.py`) must include customer LTV, previous transactions, and cohort recovery context.
3. **Audit Trail**: Every state change or action execution must generate an immutable `AuditLog` entry.

---

## 🧪 Testing Guidelines

Before submitting any Pull Request, ensure that all test suites pass:

### Backend Tests
```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Build & Type Check
```bash
cd frontend
npm run build
```

---

## 🌿 Git Workflow & Commit Guidelines

1. Create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Follow Conventional Commits:
   - `feat: add WhatsApp dynamic retry strategy`
   - `fix: resolve race condition in approval handler`
   - `docs: update architecture diagram`
   - `test: add unit tests for mandate timeout recovery`
3. Push to your branch and open a Pull Request against `main`.

---

## 📄 License
By contributing to ReviveAI, you agree that your contributions will be licensed under the [MIT License](LICENSE).
