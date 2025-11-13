import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import Login from './components/Login';

import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import ProjectDetail from './components/ProjectDetail';
import WeeklyTrends from './components/WeeklyTrends';
import ProjectImplementationTracker from './components/ProjectImplementationTracker';
import AdminUsers from './components/AdminUsers';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();
  const canAccessDashboard = ['CEO', 'CTO', 'Admin'].includes(user?.role);
  const canAccessProjects = user?.role === 'PM' || user?.role === 'Admin';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              {canAccessDashboard ? <Dashboard /> : <Navigate to="/projects" />}
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/bi/weekly-trends"
        element={
          <PrivateRoute>
            <Layout>
              {canAccessDashboard ? <WeeklyTrends /> : <Navigate to="/projects" />}
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/progress-tracker"
        element={
          <PrivateRoute>
            <Layout>
              <ProjectImplementationTracker />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <PrivateRoute>
            <Layout>
              {canAccessProjects ? <Projects /> : <Navigate to="/" />}
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <PrivateRoute>
            <Layout>
              <ProjectDetail />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/projects/:id/avance"
        element={
          <PrivateRoute>
            <Layout>
              <ProjectImplementationTracker />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <PrivateRoute>
            <Layout>
              {user?.role === 'Admin' ? <AdminUsers /> : <Navigate to="/" />}
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;

