import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DollarSign, Plus, Edit, Trash2, Save, X, FileText, Calendar, User, Briefcase, Download, Upload } from 'lucide-react';

export default function AdminGrants() {
  const { user } = useAuth();
  const toast = useToast();
  const [grants, setGrants] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingGrant, setEditingGrant] = useState(null);
  const [newGrant, setNewGrant] = useState({
    name: '',
    description: '',
    amount: '',
    status: 'active',
    projectId: '',
    assignedTo: '',
    startDate: '',
    endDate: ''
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [grantsResponse, projectsResponse, usersResponse] = await Promise.all([
        fetch('/api/grants', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/user', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (grantsResponse.ok) {
        const grantsData = await grantsResponse.json();
        setGrants(grantsData.grants);
        setTotalAmount(grantsData.totalAmount);
      }

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
    } catch (error) {
      toast.showError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/grants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newGrant)
      });

      if (response.ok) {
        toast.showSuccess('Grant created successfully');
        setNewGrant({
          name: '',
          description: '',
          amount: '',
          status: 'active',
          projectId: '',
          assignedTo: '',
          startDate: '',
          endDate: ''
        });
        loadData();
      } else {
        const error = await response.json();
        toast.showError(error.message || 'Error creating grant');
      }
    } catch (error) {
      toast.showError('Error creating grant');
    }
  };

  const handleUpdate = async (id) => {
    try {
      const response = await fetch(`/api/grants/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editingGrant)
      });

      if (response.ok) {
        toast.showSuccess('Grant updated successfully');
        setEditingGrant(null);
        loadData();
      } else {
        const error = await response.json();
        toast.showError(error.message || 'Error updating grant');
      }
    } catch (error) {
      toast.showError('Error updating grant');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this grant?')) return;

    try {
      const response = await fetch(`/api/grants/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        toast.showSuccess('Grant deleted successfully');
        loadData();
      } else {
        const error = await response.json();
        toast.showError(error.message || 'Error deleting grant');
      }
    } catch (error) {
      toast.showError('Error deleting grant');
    }
  };

  const handleExport = () => {
    try {
      // Create CSV content
      const headers = ['Nombre', 'Descripción', 'Monto', 'Estado', 'Proyecto', 'Asignado a', 'Fecha Inicio', 'Fecha Fin'];
      const csvContent = [
        headers.join(','),
        ...grants.map(grant => [
          `"${grant.name}"`,
          `"${grant.description || ''}"`,
          grant.amount,
          grant.status,
          projects.find(p => p.id === grant.project_id)?.name || '',
          users.find(u => u.id === grant.assigned_to)?.username || '',
          grant.start_date || '',
          grant.end_date || ''
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `subvenciones_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.showSuccess('Datos exportados exitosamente');
    } catch (error) {
      toast.showError('Error exportando datos');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        toast.showError('Archivo vacío o inválido');
        return;
      }

      // Skip header row
      const dataLines = lines.slice(1);
      let successCount = 0;
      let errorCount = 0;

      for (const line of dataLines) {
        try {
          const [name, description, amount, status, projectName, assigneeName, startDate, endDate] = line.split(',').map(cell => cell.replace(/"/g, '').trim());

          if (!name || !amount) continue;

          // Find project and user IDs
          const project = projects.find(p => p.name === projectName);
          const assignee = users.find(u => u.username === assigneeName);

          const grantData = {
            name,
            description: description || null,
            amount: parseFloat(amount),
            status: status || 'active',
            projectId: project?.id || null,
            assignedTo: assignee?.id || null,
            startDate: startDate || null,
            endDate: endDate || null
          };

          const response = await fetch('/api/grants', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(grantData)
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      toast.showSuccess(`Importación completada: ${successCount} exitosas, ${errorCount} errores`);
      loadData();
    } catch (error) {
      toast.showError('Error importando archivo');
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Subvenciones</h1>
          <p className="text-sm text-gray-600 mt-1">Total activo: {formatCurrency(totalAmount)}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setNewGrant({
              name: '',
              description: '',
              amount: '',
              status: 'active',
              projectId: '',
              assignedTo: '',
              startDate: '',
              endDate: ''
            })}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Nueva Subvención
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2 inline" />
            Exportar CSV
          </button>
          <label className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 cursor-pointer">
            <Upload className="w-4 h-4 mr-2 inline" />
            {importing ? 'Importando...' : 'Importar CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proyecto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignado a</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {grants.map((grant) => (
              <tr key={grant.id}>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{grant.name}</div>
                    {grant.description && (
                      <div className="text-sm text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-xs" title={grant.description}>
                        {grant.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                  {formatCurrency(grant.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(grant.status)}`}>
                    {grant.status === 'active' ? 'Activa' :
                     grant.status === 'inactive' ? 'Inactiva' :
                     grant.status === 'completed' ? 'Completada' : 'Cancelada'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {projects.find(p => p.id === grant.project_id)?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {users.find(u => u.id === grant.assigned_to)?.username || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <button onClick={() => setEditingGrant(grant)} className="text-blue-600 mr-2">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(grant.id)} className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Grant Modal */}
      {newGrant.name !== '' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Nueva Subvención
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={newGrant.name}
                  onChange={(e) => setNewGrant({ ...newGrant, name: e.target.value })}
                  className="border p-2 w-full rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newGrant.amount}
                  onChange={(e) => setNewGrant({ ...newGrant, amount: e.target.value })}
                  className="border p-2 w-full rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={newGrant.status}
                  onChange={(e) => setNewGrant({ ...newGrant, status: e.target.value })}
                  className="border p-2 w-full rounded"
                >
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
                <select
                  value={newGrant.projectId}
                  onChange={(e) => setNewGrant({ ...newGrant, projectId: e.target.value })}
                  className="border p-2 w-full rounded"
                >
                  <option value="">Seleccionar proyecto</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignado a</label>
                <select
                  value={newGrant.assignedTo}
                  onChange={(e) => setNewGrant({ ...newGrant, assignedTo: e.target.value })}
                  className="border p-2 w-full rounded"
                >
                  <option value="">Seleccionar usuario</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
                <input
                  type="date"
                  value={newGrant.startDate}
                  onChange={(e) => setNewGrant({ ...newGrant, startDate: e.target.value })}
                  className="border p-2 w-full rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de fin</label>
                <input
                  type="date"
                  value={newGrant.endDate}
                  onChange={(e) => setNewGrant({ ...newGrant, endDate: e.target.value })}
                  className="border p-2 w-full rounded"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={newGrant.description}
                  onChange={(e) => setNewGrant({ ...newGrant, description: e.target.value })}
                  className="border p-2 w-full rounded h-20"
                  placeholder="Descripción de la subvención..."
                />
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-2">
              <button
                onClick={() => setNewGrant({ name: '', description: '', amount: '', status: 'active', projectId: '', assignedTo: '', startDate: '', endDate: '' })}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Grant Modal */}
      {editingGrant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl mb-4 flex items-center">
              <Edit className="w-5 h-5 mr-2" />
              Editar Subvención
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={editingGrant.name}
                  onChange={(e) => setEditingGrant({ ...editingGrant, name: e.target.value })}
                  className="border p-2 w-full rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingGrant.amount}
                  onChange={(e) => setEditingGrant({ ...editingGrant, amount: e.target.value })}
                  className="border p-2 w-full rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={editingGrant.status}
                  onChange={(e) => setEditingGrant({ ...editingGrant, status: e.target.value })}
                  className="border p-2 w-full rounded"
                >
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
                <select
                  value={editingGrant.project_id || ''}
                  onChange={(e) => setEditingGrant({ ...editingGrant, project_id: e.target.value })}
                  className="border p-2 w-full rounded"
                >
                  <option value="">Seleccionar proyecto</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignado a</label>
                <select
                  value={editingGrant.assigned_to || ''}
                  onChange={(e) => setEditingGrant({ ...editingGrant, assigned_to: e.target.value })}
                  className="border p-2 w-full rounded"
                >
                  <option value="">Seleccionar usuario</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
                <input
                  type="date"
                  value={editingGrant.start_date || ''}
                  onChange={(e) => setEditingGrant({ ...editingGrant, start_date: e.target.value })}
                  className="border p-2 w-full rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de fin</label>
                <input
                  type="date"
                  value={editingGrant.end_date || ''}
                  onChange={(e) => setEditingGrant({ ...editingGrant, end_date: e.target.value })}
                  className="border p-2 w-full rounded"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={editingGrant.description || ''}
                  onChange={(e) => setEditingGrant({ ...editingGrant, description: e.target.value })}
                  className="border p-2 w-full rounded h-20"
                  placeholder="Descripción de la subvención..."
                />
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-2">
              <button
                onClick={() => setEditingGrant(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleUpdate(editingGrant.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}