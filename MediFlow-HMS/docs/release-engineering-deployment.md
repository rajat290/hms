# Release Engineering And Deployment

## Purpose

This branch adds the operational foundation needed to move the project from "works on my machine" toward a repeatable release flow:

- CI checks on every push and pull request to `main`
- Docker images for backend, patient app, and admin app
- a `docker-compose` stack for local production-like startup
- environment examples for each app
- deployment docs that explain the expected runtime shape

## What Changed

### CI

File:

- [ci.yml](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/.github/workflows/ci.yml)

The workflow now:

- runs backend Jest tests
- runs frontend Vitest tests and production build
- runs admin Vitest tests and production build
- builds all three Docker images as a deployment smoke check

This matters because regressions now fail before release instead of being discovered after merge or during manual deployment.

### Containers

Files:

- [backend/Dockerfile](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/Dockerfile)
- [frontend/Dockerfile](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/frontend/Dockerfile)
- [admin/Dockerfile](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/admin/Dockerfile)
- [frontend/nginx.conf](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/frontend/nginx.conf)
- [admin/nginx.conf](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/admin/nginx.conf)
- [.dockerignore](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/.dockerignore)

The patient and admin apps use multi-stage builds:

- Node builds the Vite bundles
- Nginx serves the built SPA with `try_files` fallback for React Router

The backend image stays lean and runs the API directly with production dependencies only.

### Compose Stack

File:

- [docker-compose.yml](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/docker-compose.yml)

The compose stack starts:

- MongoDB
- backend API
- patient app
- admin app

Default ports:

- patient app: `5173`
- admin app: `5174`
- backend API: `4000`
- MongoDB: `27017`

### Environment Examples

Files:

- [backend/.env.example](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/.env.example)
- [frontend/.env.example](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/frontend/.env.example)
- [admin/.env.example](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/admin/.env.example)

These files document the expected runtime values and remove guesswork from local setup, CI, and future deployment targets.

### API-Only Backend Deployment

Files:

- [backend/config/appConfig.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/config/appConfig.js)
- [backend/bootstrap/startServer.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/bootstrap/startServer.js)

The backend now supports `ENABLE_STATIC_ASSETS=false`.

That lets you deploy the API container independently from the frontend containers without assuming local frontend build files exist inside the backend image.

## Quick Start

### Local Docker Startup

1. Copy the example env files into real `.env` files if you want custom values.
2. From the repo root run:

```bash
docker compose up --build
```

3. Open:

- patient app: `http://localhost:5173`
- admin app: `http://localhost:5174`
- backend health: `http://localhost:4000/api/health`

### CI Coverage

The workflow is designed to answer four release questions automatically:

- do backend tests still pass?
- do both React apps still pass tests?
- do both React apps still produce production builds?
- do the deployment images still build successfully?

## Recommended Next Step

This branch gives you a working release foundation. The next step after merging it should be choosing the real deployment target:

- Render / Railway / Fly for quick managed deployment
- AWS / GCP / Azure for full infrastructure control
- container registry plus managed MongoDB for production scaling

Once that target is chosen, this setup can be extended into environment-specific deploy workflows without rewriting the foundation.
