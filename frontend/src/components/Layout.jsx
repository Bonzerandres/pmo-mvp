import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, FolderKanban, UserCircle, TrendingUp, BarChart3, PieChart, Users } from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDashboard = location.pathname === '/';
  const isProjects = location.pathname.startsWith('/projects');
  const isWeeklyTrends = location.pathname === '/weekly-trends';
  const isProgressTracker = location.pathname === '/progress-tracker';
  const isBI = location.pathname.startsWith('/bi');

  const canAccessDashboard = ['CEO', 'CTO', 'Admin'].includes(user?.role);
  const canAccessProjects = user?.role === 'PM' || user?.role === 'Admin';

  const roleColors = {
    CEO: 'bg-purple-100 text-purple-800',
    CTO: 'bg-info-50 text-info-700',
    Admin: 'bg-success-50 text-success-700',
    PM: 'bg-warning-50 text-warning-700'
  };

  return (
    <div className="min-h-screen">
      <aside className="fixed left-0 top-0 h-screen w-sidebar bg-neutral-50 border-r border-neutral-200 flex flex-col">
        <div className="px-6 py-6 border-b border-neutral-200 flex items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-500 text-white rounded-md p-2">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">PMO System</h2>
              <p className="text-xs text-neutral-600">Gestión de Proyectos</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Main navigation">
          <ul className="space-y-1">
            {canAccessDashboard && (
              <>
                <li>
                  <Link
                    to="/"
                    className={`sidebar-nav-item ${isDashboard ? 'bg-brand-50 border-l-4 border-brand-600 text-neutral-900' : 'text-neutral-700'}`}
                    aria-current={isDashboard ? 'page' : undefined}
                    aria-label="Dashboard"
                  >
                    <LayoutDashboard className="w-5 h-5 mr-3 text-brand-600" />
                    <div className="flex flex-col">
                      <span>Dashboard</span>
                      <span className="nav-link-subtitle">Resumen ejecutivo</span>
                    </div>
                  </Link>
                </li>
                  {/* BI Dashboards Section */}
                  <li className="nav-section-divider" role="separator" aria-hidden="true">
                    <PieChart className="w-4 h-4 mr-2 text-indigo-400" />
                    Dashboards & BI
                  </li>
                  <li>
                    <Link
                      to="/bi/weekly-trends"
                      className={`sidebar-nav-item-analytics border-l-2 border-indigo-300 pl-3 ${isBI ? 'bg-indigo-50 border-l-4 border-indigo-600 text-neutral-900' : 'text-neutral-700'}`}
                      aria-current={isBI ? 'page' : undefined}
                      aria-label="Dashboards y BI"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <TrendingUp className="w-5 h-5 mr-3 text-indigo-600" />
                          Tendencias Semanales
                          <span className="nav-badge-analytics ml-2"><TrendingUp className="w-3 h-3 mr-1" />BI</span>
                        </div>
                        <span className="nav-link-subtitle">Dashboards y Analítica</span>
                      </div>
                    </Link>
                  </li>
              </>
            )}

            {canAccessProjects && (
              <>
                <li>
                  <Link
                    to="/projects"
                    className={`sidebar-nav-item ${isProjects ? 'bg-brand-50 border-l-4 border-brand-600 text-neutral-900' : 'text-neutral-700'}`}
                    aria-current={isProjects ? 'page' : undefined}
                    aria-label="Mis Proyectos"
                  >
                    <FolderKanban className="w-5 h-5 mr-3 text-brand-600" />
                    Mis Proyectos
                  </Link>
                </li>
                  {/* Analytics Section Divider */}
                <li>
                  <Link
                    to="/progress-tracker"
                    className={`sidebar-nav-item ${isProgressTracker ? 'bg-brand-50 border-l-4 border-brand-600 text-neutral-900' : 'text-neutral-700'}`}
                    aria-current={isProgressTracker ? 'page' : undefined}
                    aria-label="Avance de Tareas"
                  >
                    <BarChart3 className="w-5 h-5 mr-3 text-brand-600" />
                    Avance de Tareas
                  </Link>
                </li>
              </>
            )}

            {user?.role === 'Admin' && (
              <li>
                <Link
                  to="/admin/users"
                  className={`sidebar-nav-item ${location.pathname === '/admin/users' ? 'bg-red-50 border-l-4 border-red-600 text-neutral-900' : 'text-neutral-700'}`}
                  aria-current={location.pathname === '/admin/users' ? 'page' : undefined}
                  aria-label="Gestión de Usuarios"
                >
                  <Users className="w-5 h-5 mr-3 text-red-600" />
                  Gestión de Usuarios
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="px-4 py-4 border-t border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-neutral-200">
              <UserCircle className="w-6 h-6 text-neutral-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-neutral-800">{user?.username}</div>
              <div className="text-xs text-neutral-600 inline-flex items-center mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[user?.role] || 'bg-neutral-100 text-neutral-700'}`}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-4 w-full sidebar-nav-item text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-3 text-red-600" />
            Salir
          </button>
        </div>
      </aside>

      <main className="ml-sidebar min-h-screen">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

