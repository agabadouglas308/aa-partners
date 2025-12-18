# AA & Partners — Backend

This folder contains a minimal Node.js + Express backend that stores contact form submissions in PostgreSQL and optionally sends confirmation emails via Gmail.

Setup

1. Install dependencies

```bash
cd backend
npm install
```

2. Create `.env` from `.env.example` and set `DATABASE_URL`, `EMAIL_USER`, `EMAIL_PASS`.

3. Initialize database (run `init_db.sql` in psql):

```bash
psql -U postgres -f init_db.sql
```

4. Start server

```bash
npm run dev
```

Endpoints

- `POST /api/contact` — accepts `{ name, email, phone, service, message }`
- `POST /api/chat` — basic chatbot placeholder
- `GET /api/health` — health check

Docker (recommended for deployment)

1. Build and run with Docker Compose (creates Postgres and backend):

```bash
docker-compose up --build -d
```

2. View logs

```bash
docker-compose logs -f backend
```

Notes:
- The compose file mounts `backend/init_db.sql` into Postgres' `docker-entrypoint-initdb.d` so the `aa_partners` database and `contacts` table are created on first run.
- Set `EMAIL_USER` and `EMAIL_PASS` in your environment or pass them to Compose for email features.

Environment variables
---------------------

Create a `.env` file (or provide env vars to your host/Compose) with the values in `.env.example`.

- `DATABASE_URL` — Postgres connection string used by the backend.
- `PORT` — port the backend listens on (default `3000`).
- `EMAIL_USER` and `EMAIL_PASS` — optional Gmail credentials used to send contact notifications. If these are not provided, the server will still accept contact submissions but will not send emails.

When using `docker-compose`, you can export `EMAIL_USER` and `EMAIL_PASS` in your shell before running `docker-compose up`, or add an `env_file` entry to the `backend` service in `docker-compose.yml` pointing to a local `.env` file.

The provided `docker-compose.yml` already contains an `env_file: .env` entry for the `backend` service. Create a `.env` (copy from `.env.example`) in the project root before running `docker-compose up`:

```bash
cp .env.example .env
# then edit .env to set EMAIL_USER / EMAIL_PASS if you want email sending
```

By default the server will now prefer `website.html` as the site root if present; otherwise it serves `AA AND PARTNERS.html`.

Run tests with Docker Compose
---------------------------

You can run the backend test suite inside a container without installing `npm` locally. From the project root run:

```bash
docker-compose build backend
docker-compose run --rm tests
```

The `tests` service installs devDependencies and runs `npm test` with `NODE_ENV=test`, so it doesn't require the database service.

