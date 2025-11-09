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
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

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
- Visualizaciones (gráficos de barras y pie)
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

