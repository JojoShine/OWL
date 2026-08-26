# Docker Deployment Architecture Design

## Goal

Containerize the frontend and backend once, then reuse the same application images in two explicit deployment modes:

- The current verification environment connects to independently deployed PostgreSQL, Redis, and MinIO services.
- A future single-server production environment can add Docker-managed PostgreSQL, Redis, and MinIO without changing application code or rebuilding images for infrastructure selection.

## Architecture

The deployment is split into composable layers instead of one environment-specific Compose file:

- `compose.yaml` defines the frontend, backend, and one-shot database migration service.
- `compose.verify.yaml` supplies verification-environment overrides for external middleware and ingress settings.
- `compose.middleware.yaml` optionally adds PostgreSQL, Redis, and MinIO with persistent named volumes and private container networking.
- `compose.production.yaml` supplies production restart policies, resource limits, health checks, logging limits, and ingress settings.

The selected Compose files determine where middleware comes from. Application code must not probe the environment and automatically decide whether to create infrastructure or initialize a database.

## Application Images

Frontend and backend use separate multi-stage Dockerfiles and immutable versioned images.

- The Next.js frontend uses standalone output and serves through a production Node.js runtime.
- The Express backend runs as one foreground Node.js process, listens on `0.0.0.0`, writes logs to standard output, and handles termination signals gracefully.
- Images run as non-root users and contain no environment files, credentials, uploaded files, logs, database data, or development dependencies.
- `.dockerignore` excludes environment files, dependency directories, logs, build caches, test output, and unrelated local artifacts.
- Runtime configuration is injected during deployment. Browser-visible Next.js configuration contains no secrets, and the frontend uses a same-origin `/api` path where practical so one image can move between environments.

## Middleware Modes

### Verification Environment

Only application services are created. PostgreSQL, Redis, and MinIO connection details are provided at runtime.

If middleware runs directly on the same Linux host, containers reach it through a deliberate host gateway or private host address. Containers must not use `localhost` for host services. Middleware listeners and firewall rules expose only the minimum address range needed by the Docker bridge.

### Docker-Managed Production Middleware

The middleware overlay creates PostgreSQL, Redis, and MinIO on an internal network. Database and object-storage ports are not published publicly. Persistent data uses explicit named volumes that are independent of container recreation.

Redis persistence is enabled when Redis contains sessions, queues, or other state that cannot be safely discarded. PostgreSQL and MinIO always have tested backup and restore procedures.

## Database Lifecycle

Database creation and database upgrades remain separate operator actions:

- A new empty database runs `npm run db:bootstrap` once, with the existing production confirmation and initial-admin-password safeguards.
- An existing database and every later release run `npm run db:deploy` only.
- `npm run db:status` is available for pre-deployment inspection.

The migration service uses the same backend image and database configuration as the application. It waits for a healthy database when Docker manages PostgreSQL, runs to successful completion, and exits. The backend starts only after the migration job succeeds. A migration failure prevents the new backend release from starting.

## Configuration and Secrets

The repository contains only documented examples such as `.env.example`. Local, verification, and production values remain untracked.

- Non-sensitive settings may be supplied by the host environment or a deployment-specific environment file.
- Database passwords, JWT keys, MinIO credentials, and third-party credentials use Docker secrets or an external secret manager in production.
- Secret values are never copied into image layers or passed through browser-visible `NEXT_PUBLIC_*` variables.
- Configuration is validated at process startup, with a clear error for every missing or invalid required value.

## Release Flow

1. CI checks the source and builds frontend and backend images from a commit or version tag.
2. Images receive immutable semantic-version and Git-commit tags and are pushed to a registry.
3. The target server pulls the exact image versions; it does not install dependencies or build source code.
4. The deployment backs up persistent data when a database change is included.
5. The one-shot migration service runs `db:deploy`.
6. Frontend and backend containers are recreated and must pass health checks before the release is considered available.
7. Application rollback selects the previous immutable image. Database changes are designed to be forward-compatible rather than relying on automatic destructive rollback.

## Operations and Failure Handling

- A reverse proxy is the only public entry point and terminates HTTPS, forwards the real client IP, and enforces upload and timeout limits.
- Health checks distinguish process liveness from dependency readiness.
- Containers have restart policies, CPU and memory limits, and bounded log rotation.
- PostgreSQL and MinIO backups are stored outside the same application data volumes and are periodically restored in a verification exercise.
- Removing or recreating application containers must never remove middleware volumes.
- Infrastructure endpoints can later move to managed or independent services by changing runtime configuration only.

## Verification Strategy

- Build both images from a clean context to prove no local dependency or environment file is required.
- Render each Compose combination and validate required configuration before starting services.
- Verify the application-only mode against existing middleware.
- Verify the full-stack mode from empty volumes, including the guarded one-time bootstrap path.
- Recreate application containers and confirm database and object data persist.
- Force a failed migration and confirm the backend does not start.
- Exercise graceful shutdown, health checks, backup, restore, and image rollback on the verification server before production use.

## Constraints

- Do not change business behavior, public routes, permissions, or API response contracts as part of containerization.
- Do not bundle middleware into application images.
- Do not automatically run database bootstrap during ordinary application startup.
- Do not require different application source branches or application images for external-middleware and Docker-managed-middleware modes.
- The first target is a single Linux cloud server; the separation must still allow middleware to move off-host later without application changes.
