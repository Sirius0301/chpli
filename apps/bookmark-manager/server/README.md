# Bookmark Manager API

FastAPI backend for bookmark management.

## Setup

```bash
# 1. Create virtual environment
python -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy env and edit
cp .env.example .env

# 4. Run migrations
alembic upgrade head

# 5. Start dev server
uvicorn app.main:app --reload --port 8001
```

## Alembic Commands

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Downgrade
alembic downgrade -1
```
