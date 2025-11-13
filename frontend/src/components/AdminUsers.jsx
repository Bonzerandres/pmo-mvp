import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Users, Plus, Edit, Trash2, Save, X } from 'lucide-react';

export default function AdminUsers() {
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ username: '', name: '', role: 'PM' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Assuming there's an API for users, but since not implemented, mock
      // For now, since backend doesn't have user CRUD, this is placeholder
      setUsers([
        { id: 1, username: 'admin', name: 'Admin User', role: 'Admin' },
        { id: 2, username: 'pm1', name: 'Project Manager 1', role: 'PM' },
        { id: 3, username: 'ceo', name: 'CEO', role: 'CEO' }
      ]);
    } catch (error) {
      toast.showError('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    // Placeholder
    toast.showSuccess('User created (placeholder)');
    setNewUser({ username: '', name: '', role: 'PM' });
  };

  const handleUpdate = async (id) => {
    // Placeholder
    toast.showSuccess('User updated (placeholder)');
    setEditingUser(null);
  };

  const handleDelete = async (id) => {
    // Placeholder
    toast.showSuccess('User deleted (placeholder)');
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <button
          onClick={() => setNewUser({ username: '', name: '', role: 'PM' })}
          className="px-4 py-2 bg-green-600 text-white rounded-md"
        >
          <Plus className="w-4 h-4 mr-2 inline" />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4">{u.username}</td>
                <td className="px-6 py-4">{u.name}</td>
                <td className="px-6 py-4">{u.role}</td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => setEditingUser(u)} className="text-blue-600 mr-2"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New User Modal Placeholder */}
      {newUser.username !== '' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl mb-4">Nuevo Usuario</h2>
            <input
              type="text"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className="border p-2 w-full mb-2"
            />
            <input
              type="text"
              placeholder="Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="border p-2 w-full mb-2"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="border p-2 w-full mb-4"
            >
              <option value="PM">PM</option>
              <option value="Admin">Admin</option>
              <option value="CEO">CEO</option>
            </select>
            <div className="flex justify-end">
              <button onClick={() => setNewUser({ username: '', name: '', role: 'PM' })} className="mr-2 px-4 py-2 bg-gray-500 text-white rounded">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-green-600 text-white rounded">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal Placeholder */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl mb-4">Editar Usuario</h2>
            <input
              type="text"
              placeholder="Username"
              value={editingUser.username}
              onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
              className="border p-2 w-full mb-2"
            />
            <input
              type="text"
              placeholder="Name"
              value={editingUser.name}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              className="border p-2 w-full mb-2"
            />
            <select
              value={editingUser.role}
              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
              className="border p-2 w-full mb-4"
            >
              <option value="PM">PM</option>
              <option value="Admin">Admin</option>
              <option value="CEO">CEO</option>
            </select>
            <div className="flex justify-end">
              <button onClick={() => setEditingUser(null)} className="mr-2 px-4 py-2 bg-gray-500 text-white rounded">Cancel</button>
              <button onClick={() => handleUpdate(editingUser.id)} className="px-4 py-2 bg-blue-600 text-white rounded">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}