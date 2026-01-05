# DevOps Training —  Dockerize 3‑Tier App

This repository contains a simple 3‑tier Node.js application (frontend, backend, Postgres DB). This README documents how I Dockerized the app (frontend + backend), how to run it with Docker, and verification steps used for the assignment.


**Files added/updated**
- `Dockerfile.backend` — Node.js backend Dockerfile (uses `node:alpine`, installs deps, exposes port, accepts environment variables). The application is a Node.js monolith serving frontend and backend together, so a single Dockerfile is used and a separate frontend Dockerfile is not required.
- `.dockerignore` — ignores node_modules, logs, and local build artifacts.

Prerequisites
- Docker installed and running.

Quick overview
- Backend: listens on port 3000 inside container (map to host as desired).
- Database: Postgres official image with a volume mounted for persistence.

Run using plain `docker run` (example)

1) Create a Docker network so containers can communicate by name:

```bash
docker network create devops-net
```

2) Start Postgres with persistent volume and environment variables (use an env file):

```bash
docker run -d \
  --name pg-db \
  --network devops-net \
  --env-file postgres.env \
  -v pgdata:/var/lib/postgresql/data \
  postgres:14-alpine
```

3) Build and run backend (example assumes `Dockerfile.backend` present):

```bash
docker build -f Dockerfile.backend -t app-backend:latest .

docker run -d \
  --name app-backend \
  --network devops-net \
  -p 3000:3000 \
  --env-file backend.env \
  app-backend:latest
```


Verify the services
- Check running containers:

```bash
docker ps
```

- Inspect backend logs:

```bash
docker logs -f app-backend
```

- Exec into the backend container and curl the DB‑facing endpoint or localhost:

```bash
docker exec -it app-backend /bin/sh
curl http://localhost:3000/health   # or other endpoints
```

- From host, verify frontend and backend endpoints:

```bash
curl http://localhost:8080
```

Networking notes
- Using a user-defined bridge network (here `devops-net`) allows containers to resolve each other by name, e.g., `DB_HOST=pg-db`.

Additional note
- The application is a Node.js monolith serving frontend and backend together, so a single Dockerfile is correct. PostgreSQL runs in a separate container with persistent storage, and containers communicate over a user-defined Docker network using environment variables.

Stopping and cleanup

```bash
docker stop app-frontend app-backend pg-db
docker rm app-frontend app-backend pg-db
docker network rm devops-net
```

Persisting DB data
- The `-v pgdata:/var/lib/postgresql/data` volume persists Postgres data across container restarts. To inspect:

```bash
docker volume ls
docker volume inspect pgdata
```

Docker best practices used
- Base image: `node:alpine` to keep images lightweight.
- Minimize layers: combine `RUN` steps and clean package caches where applicable.
- Use a `.dockerignore` to avoid copying `node_modules` and local artifacts into the image.
- Pass secrets via environment variables (or Docker secrets for production).
- Prefer multi-stage builds for frontend to produce a small static artifact.


