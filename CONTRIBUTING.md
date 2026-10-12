# CyberGuard Project

## Overview
This repo contains a Python FastAPI backend and a Next.js frontend. The backend handles user authentication and persistence, while the frontend renders the game-like UI and interacts with the backend.

## Repository structure
- `Backend/` — FastAPI API and database setup
- `Frontend/cyberguard-frontend/` — Next.js app

## Requirements
- Python 3.10+
- Node.js 18+
- PostgreSQL (for the database-backed runtime)
- Git

## Backend setup
From the repo root:

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Set your database URL before running the app:

```bash
export DATABASE_URL="postgresql+asyncpg://user:password@localhost:5432/cyberguard"
# Windows PowerShell:
# $env:DATABASE_URL = "postgresql+asyncpg://user:password@localhost:5432/cyberguard"
```

Run the backend:

```bash
uvicorn main:app --reload --port 8000
```

Optional migration step:

```bash
alembic -c alembic.ini upgrade head
```

## Frontend setup
From the repo root:

```bash
cd Frontend/cyberguard-frontend
npm install
```

Run the frontend:

```bash
npm run dev
```

Run a type-check:

```bash
npx tsc --noEmit
```

## Development workflow
- Work on feature branches.
- Keep runtime artifacts out of Git (`.venv`, `__pycache__`, `node_modules`, `.next`, `*.pyc`, `.env`).
- Before committing, run local checks:

```bash
cd Backend
python -m compileall .

cd ../Frontend/cyberguard-frontend
npx tsc --noEmit
```

## Commit guidelines
- Keep commits focused and descriptive.
- Do not commit secrets or local environment files.
- If you add new environment variables, update this document.

## Troubleshooting
- If the app cannot connect to the database, verify your `DATABASE_URL`.
- If frontend type-check fails, fix TypeScript errors before committing.
- If Python startup fails, confirm dependencies are installed into the active virtual environment.
