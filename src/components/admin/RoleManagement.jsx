import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Edit2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const AVAILABLE_PERMISSIONS = [
  { key: 'view_analytics', label: 'View Analytics', section: 'Analytics' },
  { key: 'view_vip_analytics', label: 'View VIP Analytics', section: 'Analytics' },
  { key: 'manage_users', label: 'Manage Users', section: 'Users' },
  { key: 'reset_user_tasks', label: 'Reset User Tasks', section: 'Users' },
  { key: 'approve_tasks', label: 'Approve Tasks', section: 'Tasks' },
  { key: 'reject_tasks', label: 'Reject Tasks', section: 'Tasks' },
  { key: 'approve_payouts', label: 'Approve Payouts', section: 'Finance' },
  { key: 'reject_payouts', label: 'Reject Payouts', section: 'Finance' },
  { key: 'view_commissions', label: 'View Commissions', section: 'Finance' },
  { key: 'manage_products', label: 'Manage Products', section: 'Products' },
  { key: 'manage_roles', label: 'Manage Roles', section: 'System' },
  { key: 'view_login_history', label: 'View Login History', section: 'Security' },
  { key: 'manage_support_tickets', label: 'Manage Support', section: 'Support' },
  { key: 'manage_automated_assignment', label: 'Manage Auto-Assignment', section: 'System' }
];

const SECTION_PERMISSIONS = {
  'users': ['manage_users', 'reset_user_tasks'],
  'tasks': ['approve_tasks', 'reject_tasks'],
  'withdrawals': ['approve_payouts', 'reject_payouts'],
  'payouts': ['approve_payouts', 'view_commissions'],
  'products': ['manage_products'],
  'analytics': ['view_analytics', 'view_vip_analytics'],
  'roles': ['manage_roles'],
  'logins': ['view_login_history'],
  'automatedAssignment': ['manage_automated_assignment']
};

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    roleName: '',
    description: '',
    permissions: [],
    level: 1,
    isActive: true
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Role.list();
      setRoles(data);
    } catch (error) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.roleName || formData.permissions.length === 0) {
      toast.error('Role name and at least one permission required');
      return;
    }

    try {
      if (editingRole) {
        await base44.entities.Role.update(editingRole.id, formData);
        toast.success('Role updated successfully');
      } else {
        await base44.entities.Role.create(formData);
        toast.success('Role created successfully');
      }
      loadRoles();
      setShowForm(false);
      setEditingRole(null);
      setFormData({
        roleName: '',
        description: '',
        permissions: [],
        level: 1,
        isActive: true
      });
    } catch (error) {
      toast.error('Failed to save role');
    }
  };

  const handleDelete = async (roleId) => {
    if (!confirm('Are you sure? This will not affect existing role assignments.')) return;
    try {
      await base44.entities.Role.delete(roleId);
      toast.success('Role deleted');
      loadRoles();
    } catch (error) {
      toast.error('Failed to delete role');
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      roleName: role.roleName,
      description: role.description,
      permissions: role.permissions,
      level: role.level,
      isActive: role.isActive
    });
    setShowForm(true);
  };

  const togglePermission = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  if (loading) {
    return <div className="text-center py-12">Loading roles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Role
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  placeholder="e.g., Support Agent"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Role description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {Object.entries(
                    AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
                      if (!acc[perm.section]) acc[perm.section] = [];
                      acc[perm.section].push(perm);
                      return acc;
                    }, {})
                  ).map(([section, perms]) => (
                    <div key={section}>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">{section}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {perms.map((permission) => (
                          <label key={permission.key} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.key)}
                              onChange={() => togglePermission(permission.key)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{permission.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Level</label>
                  <input
                    type="number"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingRole(null);
                  setFormData({
                    roleName: '',
                    description: '',
                    permissions: [],
                    level: 1,
                    isActive: true
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingRole ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">{role.roleName}</h3>
              </div>
              {!role.isActive && (
                <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">Inactive</span>
              )}
            </div>

            {role.description && (
              <p className="text-sm text-gray-600 mb-3">{role.description}</p>
            )}

            <div className="mb-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Permissions ({role.permissions?.length || 0})</p>
              <div className="flex flex-wrap gap-1">
                {role.permissions?.slice(0, 3).map((perm) => {
                  const permObj = AVAILABLE_PERMISSIONS.find(p => p.key === perm);
                  return (
                    <span key={perm} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {permObj ? permObj.label : perm.replace(/_/g, ' ')}
                    </span>
                  );
                })}
                {(role.permissions?.length || 0) > 3 && (
                  <span className="text-xs text-gray-500">+{role.permissions.length - 3} more</span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleEdit(role)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(role.id)}
                className="flex items-center justify-center gap-1 px-3 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}