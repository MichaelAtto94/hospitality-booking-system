# Docker deployment

## Requirements
- Docker Desktop with Docker Compose
- At least 2 GB free memory

## Start
1. Copy `.env.docker.example` to `.env.docker`.
2. Replace both placeholder secrets.
3. Run `docker compose --env-file .env.docker up --build -d`.
4. Open `http://localhost:3000`.
5. Open `http://localhost:3000/api/health`.

## Logs
Run `docker compose --env-file .env.docker logs -f application`.

## Stop without deleting data
Run `docker compose --env-file .env.docker down`.

## Update
Run `docker compose --env-file .env.docker up --build -d`.

Never run `docker compose down -v` against a production installation unless you intentionally want to delete the PostgreSQL volume.
