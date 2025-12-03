# ⚠️ Environment Sourcing and LAN Access

For containerized deployments, environment variables are typically sourced from docker-compose files. The backend prestart script now only warns if .env is missing, so you can rely on docker-compose environment variables. For LAN access, rebuild the frontend with VITE_API_URL set to your host IP, or use a reverse proxy to serve both frontend and backend on the same origin.
# Docker Port Access Issues

**Container fails to start with "Cannot find module"**:
- **Cause**: Using docker-compose.dev.yml with production Dockerfile that excludes devDependencies
- **Solution**: Ensure `docker-compose.dev.yml` references `Dockerfile.dev` in the build configuration
- **Verify**: Check that `backend/Dockerfile.dev` and `frontend/Dockerfile.dev` exist
- **Rebuild**: Run `docker-compose -f docker-compose.dev.yml build --no-cache`

**Container exits immediately with ".env file not found"**:
- **Cause**: `.dockerignore` excludes `.env` files, but `backend/package.json` prestart script requires it
- **Solution 1**: Uncomment or remove line 8 in `.dockerignore` (the `.env` exclusion)
- **Solution 2**: Remove the prestart script from `backend/package.json` and rely on docker-compose environment variables
- **Verify**: Run `docker logs pmo-backend` to see the exact error

**Health checks failing**:
- **Cause**: Alpine Linux images don't include `wget` by default, but Dockerfiles use it for health checks
- **Solution**: Add `RUN apk add --no-cache wget` after the FROM line in both Dockerfiles
- **Verify**: Run `docker exec pmo-backend wget --version` to confirm wget is installed
- **Check health**: Run `docker inspect pmo-backend | grep Health` to see health status

**Ports not accessible from browser**:
- **Verify containers are running**: `docker ps` should show both containers with status "Up" and ports mapped
- **Check port bindings**: Look for `0.0.0.0:3001->3001/tcp` in the PORTS column
- **Test from inside container**: `docker exec pmo-backend wget -O- http://localhost:3001/api/health`
- **Test from host**: `curl http://localhost:3001/api/health`
- **If host test fails**: Check firewall rules and ensure no other process is using the ports

**CORS errors when accessing from network IP**:
- **Cause**: Backend CORS configuration in `docker-compose.yml` doesn't include your network IP
- **Solution**: Update the CORS_ORIGIN environment variable in `docker-compose.yml` line 16
- **Add your IP**: `CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://192.168.1.x:5173`
- **Restart backend**: `docker-compose restart backend`
- **Verify**: Check backend logs with `docker logs pmo-backend` to see "CORS allowed origins" message

**Frontend loads but can't connect to backend**:
- **Cause**: VITE_API_URL in docker-compose.yml points to localhost, but you're accessing from a different device
- **Understanding**: Vite environment variables are embedded at build time, and "localhost" in the browser means the client's machine, not the Docker host
- **Solution for same-machine access**: Keep VITE_API_URL as `http://localhost:3001/api` and access frontend via `http://localhost:5173`
- **Solution for network access**: Set up a reverse proxy (nginx) that serves both frontend and backend on the same origin, eliminating CORS issues
- **Quick workaround**: Rebuild frontend with VITE_API_URL set to your host machine's IP, but this is not portable

**Permission denied errors in frontend container**:
- **Cause**: Frontend Dockerfile switches to USER node before ensuring proper ownership
- **Solution**: Add `RUN chown -R node:node /app` before the USER node line in `frontend/Dockerfile`
- **Verify**: Run `docker exec pmo-frontend ls -la /app` to check file ownership

**Development hot-reload not working**:
- **Cause**: Using production Dockerfile instead of Dockerfile.dev, or volumes not mounted correctly
- **Solution**: Ensure `docker-compose.dev.yml` mounts source code as volumes (lines 19-21 for backend, 41-42 for frontend)
- **Verify**: Make a change to a source file and check if it reflects in the container
- **Check Vite**: Frontend requires `--host` flag in the dev command to work in Docker

**Reference files**:
- `.dockerignore` controls what files are copied into Docker images
- `backend/package.json` line 13 contains the prestart script that checks for .env
- `backend/server.js` lines 30-46 contain CORS configuration that reads from CORS_ORIGIN environment variable
- `docker-compose.yml` and `docker-compose.dev.yml` define environment variables and port mappings
# PMO MVP Deployment Guide

## Prerequisites
- Docker & Docker Compose installed
- 2GB+ RAM, 1GB+ disk recommended
- Open ports 3001 (backend), 5173 (frontend)

## Local Development
- Run: `docker-compose -f docker-compose.dev.yml up`
- Hot-reload enabled, source code mounted
- DB initialized in `backend/data/`
- Troubleshoot: check container logs, port conflicts, permissions

## Production Deployment
### Option A: Docker on VPS/Cloud
- Copy `.env.example` to `.env` and set secrets
- Run: `docker-compose up -d`
- Open firewall/security group for 3001, 5173
- DB backed up from `backend/data/database.db`

### Option B: Docker + Reverse Proxy
- Use `nginx.conf.example` for SSL, proxy, security
- Place built frontend in `/var/www/frontend` or proxy to frontend container
- Set CORS_ORIGIN in backend `.env` to your domain

### Option C: Kubernetes (Advanced)
- Write Deployment/Service YAMLs for backend/frontend
- Use PersistentVolume for DB
- Ingress for routing/SSL

## Network Configuration
- Port forwarding on router for remote access
- Dynamic DNS or Cloudflare Tunnel for home servers

## Security Checklist
- Change JWT_SECRET
- Enable HTTPS
- Set CORS_ORIGIN
- Backup DB
- Update regularly
- Rate limiting enabled in backend

## Monitoring & Maintenance
- Logs: `docker-compose logs`
- Health: `/api/health`
- DB backup: copy `backend/data/database.db`
- Update: pull, rebuild, restart containers

## Troubleshooting
- UI not accessible: check containers, ports, firewall
- API fails: check CORS, backend logs
- DB locked: check volume permissions
- Port in use: change in docker-compose

See backend/middleware/rateLimiter.js and auth.js for security features.
