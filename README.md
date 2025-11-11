## Troubleshooting - Changes Not Appearing

**Problem:** You've made code changes but the browser still shows the old version.

**Solution Steps:**

**1. Clear Vite Cache:**
```powershell
cd frontend
Remove-Item -Recurse -Force .\node_modules\.vite
# Or use: npx vite --force
```

**2. Clear Browser Cache:**
- **Chrome/Edge:** Press Ctrl+Shift+Delete, select "Cached images and files", click Clear
- **Firefox:** Press Ctrl+Shift+Delete, select "Cache", click Clear Now
- **Or:** Hard refresh with Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

**3. Restart Dev Server:**
```powershell
# Stop the server (Ctrl+C)
cd frontend
npm run dev
```

**4. Open in Incognito/Private Window:**
- Chrome: Ctrl+Shift+N
- Firefox: Ctrl+Shift+P
- This bypasses all cache and extensions

**5. Verify Correct URL:**
- Dev server: http://localhost:5173
- NOT: http://localhost:3001 (that's the backend)
- Check the terminal output for the correct URL

**6. Check Dev Server Is Running:**
```powershell
# In frontend directory, you should see:
npm run dev
# Output: VITE v5.x.x ready in XXX ms
# ➜ Local: http://localhost:5173/
```

**7. Disable Browser Extensions:**
- Some extensions (ad blockers, privacy tools) can cache aggressively
- Test in incognito mode to rule this out

**8. Check for Multiple Tabs:**
- Close all browser tabs with the app open
- Open a fresh tab and navigate to http://localhost:5173

**9. Verify File Changes Were Saved:**
- Check the file modification timestamp in your editor
- Look for unsaved indicators (dot/asterisk in tab title)
- Save all files: Ctrl+K S (VS Code) or Ctrl+S (most editors)

**10. Check Terminal for Errors:**
- Look for compilation errors in the terminal running `npm run dev`
- Vite will show errors if components fail to compile
- Fix any errors before expecting changes to appear

**Prevention:**
- Always use `npm run dev` for development (not `npm run build`)
- Keep dev server running while making changes (Vite hot-reloads automatically)
- Use browser DevTools Network tab to verify files are being fetched (not cached)
- Add `?v=timestamp` to URL to force cache bypass: http://localhost:5173/?v=123456

**Still Not Working?**
- Delete `node_modules/` and reinstall: `rm -rf node_modules && npm install`
- Check if you're editing the correct file (search for unique text to confirm)
- Verify you're in the correct project directory
- Check if another instance of the dev server is running on a different port
## PMO MVP: Executive Dashboard & Analytics Architecture

### 🏛️ Executive Dashboard (`/`)
- **Purpose:** At-a-glance portfolio health for executives (CEO, CTO, Admin)
- **Content:**
  - 6 KPI cards (Total Projects, Completed, Delayed, Average Progress, Delay Days, High Priority)
  - Alerts center with severity filtering
  - **Pie chart** showing task status distribution (Completado, En Curso, Retrasado, Crítico)
  - Portfolio summary table with project-level metrics and deviation calculations
- **What it does NOT contain:** No bar charts, no weekly trends, no time-series or S1-S4 week tracking
- **Update Frequency:** Auto-refreshes every 30 seconds
- **Interaction:** Read-only, no editing capabilities
- **File:** `frontend/src/components/Dashboard.jsx`

### 📈 Weekly Trends (`/weekly-trends`)
- **Purpose:** Analytical tool for tracking progress trends over time (for analysts, PMs)
- **Content:**
  - **Line chart** showing "Avance Programado" and "Avance Real" trends over multiple weeks
  - Current week summary cards (S1-S4) with project-level details
  - Weekly deviation tracking and status indicators
- **Update Frequency:** Auto-refreshes every 30 seconds
- **Interaction:** Editable/configurable ("Editable" badge in navigation)
- **File:** `frontend/src/components/WeeklyTrends.jsx`

### 🔑 Key Differences
| Aspect      | Dashboard (/)         | Weekly Trends (/weekly-trends) |
|-------------|-----------------------|-------------------------------|
| View Type   | Snapshot (current)    | Time-series (historical)      |
| Chart Type  | Pie chart             | Line chart                    |
| Time Scope  | Current moment        | Multiple weeks (S1-S4)        |
| Purpose     | Executive summary     | Detailed analysis             |
| Editing     | No                    | Yes (configurable)            |
| Navigation  | Main section          | "Análisis" section           |

**Note:** Weekly trends and line charts are never shown on the Dashboard. The Dashboard is a clean executive summary only.

### 🧭 Navigation & Access
- Dashboard: Click "Dashboard" in sidebar or go to http://localhost:5173/
- Weekly Trends: Click "Tendencias Semanales" in sidebar (under "Análisis") or go to http://localhost:5173/weekly-trends

### 💡 Design Philosophy
- Keep Dashboard uncluttered and focused on key metrics
- Move analytics and trends to dedicated, visually separated sections
- Prevent information overload for executives
- Follow best practices for dashboard design (summary vs detail)

---
# ⚠️ VITE_API_URL and LAN Access

By default, VITE_API_URL is set to http://localhost:3001/api. This works for same-machine access. For LAN access, rebuild the frontend with VITE_API_URL set to your host IP (e.g., http://192.168.1.160:3001/api), or use a reverse proxy to serve both frontend and backend on the same origin. See DEPLOYMENT.md for details.
# Sistema de Gestión de Portafolio de Proyectos (PMO)

Sistema completo de gestión de portafolio de proyectos que reemplaza la gestión manual mediante archivos Excel con una solución web centralizada en tiempo real.

## 🚀 Características

- **Autenticación Multi-rol**: CEO, CTO, PM (Project Manager), Admin
- **Actualización en Tiempo Real**: Los PMs pueden actualizar proyectos asignados
- **Dashboard Ejecutivo**: Observabilidad completa para CEO/CTO con KPIs y alertas
- **Alertas Automáticas**: Sistema inteligente de alertas basado en métricas
- **Permisos Granulares**: Control de acceso por usuario y proyecto
- **Trazabilidad**: Registro completo de cambios y actividades

## 📋 Requisitos

- Node.js 18+ 
- npm o yarn

## 🛠️ Instalación

1. **Instalar dependencias de todos los módulos:**
```bash
npm run install:all
```

2. **Inicializar la base de datos:**
```bash
cd backend
npm run init-db
```

3. **Configurar variables de entorno (opcional):**
Copiar el ejemplo y editar las variables sensibles antes de ejecutar en producción:
```bash
cp backend/.env.example backend/.env
# Editar backend/.env
```
Para el frontend de desarrollo, use `frontend/.env.development` y para producción `frontend/.env.production`.

## 🚀 Ejecución

### Desarrollo (Backend + Frontend simultáneamente)
```bash
npm run dev
```

### Solo Backend
```bash
npm run dev:backend
```

### Solo Frontend
```bash
npm run dev:frontend
```



El sistema estará disponible en:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🐳 Docker Deployment

### Quick Start with Docker Compose

1. Prerequisites: Docker and Docker Compose installed
2. Run: `docker-compose up -d`
3. Access URLs:
  - Frontend: http://localhost:5173
  - Backend API: http://localhost:3001
4. Stop: `docker-compose down`
5. Logs: `docker-compose logs -f`

### Development with Docker

- Run: `docker-compose -f docker-compose.dev.yml up`
- Hot-reload enabled, source code mounted as volumes
- Rebuild after dependency changes: `docker-compose -f docker-compose.dev.yml up --build`

### Production Deployment

1. Copy `.env.example` files and set production values (especially `JWT_SECRET`)
2. Update `CORS_ORIGIN` in `backend/.env` to include your production domain
3. Update `VITE_API_URL` in `frontend/.env.production` before building
4. Database persistence: see `backend/data/` volume mount
5. SSL/TLS: use a reverse proxy (nginx, Caddy, Traefik) for HTTPS

### Accessing from Other Devices

**Local Network Access**:
1. Find your machine's IP address:
  - Windows: `ipconfig` (look for IPv4 Address)
  - Linux/Mac: `ip addr` or `ifconfig`
2. Access from other devices on the same network:
  - Frontend: `http://<your-ip>:5173`
  - Backend API: `http://<your-ip>:3001/api`
3. **Firewall**: Ensure ports 3001 and 5173 are allowed in your firewall
  - Windows: `netsh advfirewall firewall add rule name="PMO Backend" dir=in action=allow protocol=TCP localport=3001`
  - Windows: `netsh advfirewall firewall add rule name="PMO Frontend" dir=in action=allow protocol=TCP localport=5173`

**Remote Server Deployment**:
1. Deploy Docker containers on your server
2. Configure firewall/security groups to allow ports 3001 and 5173
3. Update `CORS_ORIGIN` to include your server's IP or domain
4. Use a reverse proxy for production (see `nginx.conf.example`)
5. Set up SSL certificates (Let's Encrypt recommended)

## 🐳 Docker Deployment

### Quick Start with Docker Compose

1. Prerequisites: Docker and Docker Compose installed
2. Run: `docker-compose up -d`
3. Access URLs:
  - Frontend: http://localhost:5173
  - Backend API: http://localhost:3001
4. Stop: `docker-compose down`
5. Logs: `docker-compose logs -f`

### Development with Docker

- Run: `docker-compose -f docker-compose.dev.yml up`
- Hot-reload enabled, source code mounted as volumes
- Rebuild after dependency changes: `docker-compose -f docker-compose.dev.yml up --build`

### Production Deployment

1. Copy `.env.example` files and set production values (especially `JWT_SECRET`)
2. Update `CORS_ORIGIN` in `backend/.env` to include your production domain
3. Update `VITE_API_URL` in `frontend/.env.production` before building
4. Database persistence: see `backend/data/` volume mount
5. SSL/TLS: use a reverse proxy (nginx, Caddy, Traefik) for HTTPS

### Accessing from Other Devices

**Local Network Access**:
1. Find your machine's IP address:
  - Windows: `ipconfig` (look for IPv4 Address)
  - Linux/Mac: `ip addr` or `ifconfig`
2. Access from other devices on the same network:
  - Frontend: `http://<your-ip>:5173`
  - Backend API: `http://<your-ip>:3001/api`
3. **Firewall**: Ensure ports 3001 and 5173 are allowed in your firewall
  - Windows: `netsh advfirewall firewall add rule name="PMO Backend" dir=in action=allow protocol=TCP localport=3001`
  - Windows: `netsh advfirewall firewall add rule name="PMO Frontend" dir=in action=allow protocol=TCP localport=5173`

**Remote Server Deployment**:
1. Deploy Docker containers on your server
2. Configure firewall/security groups to allow ports 3001 and 5173
3. Update `CORS_ORIGIN` to include your server's IP or domain
4. Use a reverse proxy for production (see `nginx.conf.example`)
5. Set up SSL certificates (Let's Encrypt recommended)

## 👥 Usuarios de Prueba

El script de inicialización crea los siguientes usuarios:

| Usuario | Contraseña | Rol | Permisos |
|---------|-----------|-----|----------|
| `ceo` | `ceo123` | CEO | Vista completa, solo lectura |
| `cto` | `cto123` | CTO | Vista completa, solo lectura |
| `admin` | `admin123` | Admin | Control total (CRUD completo) |
| `pm1` | `pm123` | PM | Edita proyectos asignados (primeros 3) |
| `pm2` | `pm123` | PM | Edita proyectos asignados (últimos 3) |

## 📊 Proyectos Iniciales

El sistema viene con 6 proyectos pre-configurados:

1. **Cámaras de Vigilancia** (Infraestructura)
2. **Planta de Emergencia** (Infraestructura)
3. **Red WiFi** (Conectividad)
4. **Migración Protactic Technology** (Migración)
5. **Estandarización y Auditoría** (Auditoría)
6. **Comité de Información** (Gobernanza)

## 🎯 Funcionalidades por Rol

### CEO/CTO
- Dashboard ejecutivo con KPIs en tiempo real
- Centro de alertas automáticas
- Visualización (gráfico de pie)
- Tabla completa del portafolio
- **Solo lectura** - No pueden editar proyectos

### PM (Project Manager)
- Vista de proyectos asignados
- Actualización en tiempo real de:
  - Avance real (0-100%)
  - Días de retraso
  - Comentarios/Evidencias
- Modal de confirmación antes de guardar cambios
- Vista previa del impacto de cambios

### Admin
- Control total del sistema
- Crear, editar y eliminar proyectos
- Crear, editar y eliminar tareas
- Asignar proyectos a PMs
- Acceso completo a todas las funcionalidades

## 🔔 Sistema de Alertas

El sistema genera alertas automáticas para:

- **Desviación crítica**: Avance real ≤ Avance programado - 30%
- **Retraso significativo**: Días de retraso > 7
- **Fecha próxima a vencer**: Proyectos que vencen en ≤ 7 días
- **Proyectos vencidos**: Fecha estimada < fecha actual
- **Estado crítico**: Tareas en estado "Crítico"

## 📈 Cálculo Automático de Estado

El sistema calcula automáticamente el estado de cada tarea:

- **Completado**: Avance real = 100%
- **Crítico**: Desviación ≤ -30% O días retraso > 10
- **Retrasado**: Desviación < -10% O días retraso > 0
- **En Curso**: Cualquier otro caso

## 🗄️ Estructura de la Base de Datos

- **users**: Usuarios del sistema con roles y permisos
- **projects**: Proyectos del portafolio
- **tasks**: Tareas/etapas de cada proyecto
- **user_projects**: Asignación de proyectos a usuarios
- **activity_log**: Registro de actividades para auditoría

## 🔐 Permisos

Cada usuario tiene:
- **canEdit**: Permiso para editar proyectos (boolean)
- **canView**: 
  - `'all'`: Ve todos los proyectos
  - `'assigned'`: Solo ve proyectos asignados
- **projects**: Array de IDs de proyectos asignados (para PMs)

## 📝 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Proyectos
- `GET /api/projects` - Listar proyectos (con control de acceso)
- `GET /api/projects/:id` - Obtener proyecto específico
- `POST /api/projects` - Crear proyecto (Admin only)
- `PUT /api/projects/:id` - Actualizar proyecto (Admin only)
- `DELETE /api/projects/:id` - Eliminar proyecto (Admin only)
- `GET /api/projects/:id/metrics` - Obtener métricas del proyecto

### Tareas
- `POST /api/projects/:id/tasks` - Crear tarea (Admin only)
- `PUT /api/projects/:id/tasks/:taskId` - Actualizar tarea (PM/Admin)
- `DELETE /api/projects/:id/tasks/:taskId` - Eliminar tarea (Admin only)

### Dashboard
- `GET /api/dashboard/kpis` - Obtener KPIs (CEO/CTO/Admin)
- `GET /api/dashboard/alerts` - Obtener alertas (CEO/CTO/Admin)
- `GET /api/dashboard/portfolio-summary` - Resumen del portafolio (CEO/CTO/Admin)

## 🛠️ Tecnologías

### Backend
- Node.js + Express
- SQLite (fácil migración a PostgreSQL)
- JWT para autenticación
- bcryptjs para hash de contraseñas

### Frontend
- React 18
- React Router
- Tailwind CSS
- Recharts para visualizaciones
- Axios para peticiones HTTP
- Vite como bundler

## 📦 Estructura del Proyecto

```
PMO MVP/
├── backend/
│   ├── models/          # Modelos de datos
│   ├── routes/          # Rutas de la API
│   ├── middleware/      # Middleware (auth, logging)
│   ├── scripts/         # Scripts de utilidad
│   ├── database.js      # Configuración de BD
│   └── server.js        # Servidor Express
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── context/     # Context API
│   │   ├── services/    # Servicios API
│   │   └── App.jsx      # Componente principal
│   └── ...
└── package.json         # Configuración raíz
```

## 🔄 Actualización en Tiempo Real

El dashboard se actualiza automáticamente cada 30 segundos. Los cambios realizados por PMs se reflejan inmediatamente en el dashboard ejecutivo.

## 📱 Responsive

La interfaz es completamente responsive y funciona en dispositivos móviles, tablets y desktop.

## 🚨 Notas de Seguridad

- Las contraseñas se almacenan con hash bcrypt
- Los tokens JWT expiran en 24 horas
- Validación de permisos en cada endpoint
- Registro de actividades para auditoría

## 📄 Licencia

Este proyecto es un MVP desarrollado para reemplazar la gestión manual de proyectos mediante Excel.

## Recent changes (automated)

- UI redesign: left-sidebar layout, updated Tailwind theme and global CSS.
- Updated components: `Layout.jsx`, `Dashboard.jsx`, `Projects.jsx`, `ProjectDetail.jsx`.
- Frontend build artifacts available in `frontend/dist` (production build completed).
- Backend `Project` model already standardized to use promisified DB helpers.

How to run locally

1. Install dependencies:
```powershell
cd "c:\Users\bonze\OneDrive\Escritorio\PMO MVP"
npm ci
cd frontend
npm ci
cd ../backend
npm ci
```

2. Start backend:
```powershell
cd backend
node server.js
```

3. Start frontend dev server:
```powershell
cd frontend
npm run dev -- --port 5173
```

To push this repository to a remote, add a remote URL and push:
```powershell
cd "c:\Users\bonze\OneDrive\Escritorio\PMO MVP"
git remote add origin <your-remote-url>
git push -u origin main
```

