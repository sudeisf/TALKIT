# Talkit

Talkit is a full-stack collaborative learning platform where learners and helpers can ask questions, discuss solutions in real time, and track progress through activities and achievements.

It is designed for communities that need both structured Q&A workflows and live communication in one product. The frontend delivers a fast, app-like experience, while the backend provides secure APIs, asynchronous task processing, and WebSocket-powered real-time updates.

## Tech Stack

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Django](https://img.shields.io/badge/Django-5-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-API-A30000?style=for-the-badge&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Celery](https://img.shields.io/badge/Celery-Tasks-37814A?style=for-the-badge&logo=celery&logoColor=white)](https://docs.celeryq.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

This monorepo includes:
- Frontend: Next.js 15 app (App Router, TypeScript, Tailwind)
- Backend: Django 5 + Django REST Framework + Channels (WebSockets)
- Background services: Celery + Redis
- Database: PostgreSQL (pgvector image)
- Containerized development with Docker Compose

## Repository Structure

```
.
|-- client/          # Next.js frontend
|-- server/          # Django backend
|-- docker-compose.yaml
|-- .env.example
`-- README.md
```

## Architecture Details

Talkit uses a split architecture with a React-based client and a Django backend.

### High-level flow

1. User interacts with the Next.js frontend.
2. Frontend sends HTTP requests to Django REST endpoints.
3. Django reads/writes application data in PostgreSQL.
4. Redis supports caching, channels (WebSocket layer), and Celery broker/result storage.
5. Django Channels handles real-time events (chat/notifications) over WebSockets.
6. Celery workers process background jobs (tasks defined in app modules).

### Service responsibilities

- client/
	- Next.js App Router UI, route groups, and client state management.
- server/
	- Django API, auth/session logic, business rules, and WebSocket entrypoint.
- postgres
	- Primary relational data store.
- redis
	- Cache + pub/sub + background queue backend.
- celery worker/beat (local or optional process)
	- Asynchronous and scheduled workloads.

### Backend architecture slices

- config/
	- Platform wiring (settings, URLs, ASGI, Celery).
- users/
	- User/account domain and auth-related endpoints.
- questions/
	- Question workflows, serializers, tasks, and filters.
- chat/
	- Messaging models, views, and WebSocket consumer.
- notifications/
	- Notification domain and real-time delivery integration.
- achievements/, activities/, common/
	- Shared platform features and supporting domain logic.

## How To Navigate This Repo

Use this path when you are new to the codebase.

### If you are working on frontend features

1. Start at client/src/app/layout.tsx and client/src/app/page.tsx for app shell and entry page.
2. Open route-group folders in client/src/app/(auth), client/src/app/(helper), and client/src/app/(learner).
3. Check reusable UI in client/src/components/ui and feature components in client/src/components/helper and client/src/components/learner.
4. Review shared logic in client/src/lib, client/src/hooks, client/src/contexts, and client/src/providers.
5. Track API usage from client/src/lib/api to find backend endpoint dependencies.

### If you are working on backend features

1. Start with server/config/settings.py and server/config/urls.py.
2. Pick domain app folder (server/users, server/questions, server/chat, server/notifications).
3. Follow each domain in this order:
	 - models.py for data schema
	 - serializers.py or serilizers.py for request/response mapping
	 - views.py and urls.py for endpoint surface
	 - services.py and tasks.py for business/background logic
	 - consumer.py for WebSocket behavior (where present)
4. Check cross-domain behavior in signals.py files.
5. Validate expected behavior in each app's tests.py.

### Quick task-to-file map

- Add or change API route: server/<app>/urls.py + server/<app>/views.py
- Change DB structure: server/<app>/models.py then run migrations
- Update async job: server/<app>/tasks.py + server/config/celery.py
- Update real-time socket behavior: server/chat/consumer.py or server/notifications/consumer.py
- Update global UI shell: client/src/app/layout.tsx
- Update page-level UI: client/src/app/**
- Update reusable UI primitives: client/src/components/ui/**

## Prerequisites

Choose one of the two workflows:

1. Docker workflow (recommended)
2. Local workflow (manual frontend + backend)

### Docker workflow prerequisites

- Docker Desktop
- Docker Compose

### Local workflow prerequisites

- Node.js 18+
- npm 9+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

## Environment Variables

Create a root `.env` file using `.env.example` as a base.

Current `.env.example` contains:

```
DEBUG=True
SECRET_KEY=your-secret-key-here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id-here
```

Recommended additions for local development:

```
# Django database URL (local)
DATABASE_URL=postgres://sudeis:<your-password>@localhost:5433/talkit_db

# Redis URLs (optional, defaults exist in Django settings)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
REDIS_CACHE_URL=redis://localhost:6379/1
CHANNEL_REDIS_URL=redis://127.0.0.1:6379/2

# Optional backend integrations
GOOGLE_CLIENT_ID=
GOOGLE_API_KEY=
GEMINI_API_KEY=
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
CLOUDINARY_URL=
```

Note: Docker Compose also injects service-level environment variables for container networking.

## Run with Docker (Recommended)

From repository root:

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Swagger docs: http://localhost:8000/swagger/
- ReDoc: http://localhost:8000/redoc/
- PostgreSQL: localhost:5433
- Redis: localhost:6379

Stop all services:

```bash
docker compose down
```

## Run Locally (Without Docker)

### 1) Backend setup

From `server`:

```bash
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend runs at: http://127.0.0.1:8000

### 2) Frontend setup

From `client`:

```bash
npm install
npm run dev
```

Frontend runs at: http://localhost:3000

### 3) Optional background workers (Celery)

From `server`:

```bash
celery -A config worker --loglevel=info
```

Optional scheduler:

```bash
celery -A config beat --loglevel=info
```

## API and Real-Time

- Django REST routes are mounted under:
	- `/users/`
	- `/questions/`
	- `/chat/`
	- `/notifications/`
- OpenAPI docs:
	- `/swagger/`
	- `/redoc/`
- WebSockets are served through Django Channels ASGI app.

## Common Development Commands

### Frontend (in `client`)

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run format
```

### Backend (in `server`)

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py test
```

## Troubleshooting

- If frontend cannot reach backend in Docker, verify `NEXT_PUBLIC_API_URL` and ensure all compose services are healthy.
- If backend cannot connect to database locally, verify `DATABASE_URL` and PostgreSQL port.
- If WebSockets or Celery fail, ensure Redis is running and Redis URLs are correct.
- On Windows, Celery may need the solo pool; this is already handled in Django settings.

## License

Add your project license here (for example, MIT).
