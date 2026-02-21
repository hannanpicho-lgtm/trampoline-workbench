import { useState, useEffect } from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function UserRoleAssignment({ userId, userEmail }) {
  const [userRoles, setUserRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [roles, assignments] = await Promise.all([
        base44.entities.Role.list(),
        base44.entities.UserRole.filter({ userId })
      ]);

      setAvailableRoles(roles);
      setUserRoles(assignments);
    } catch (error) {
      toast.error('Failed to load role data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRoleId) {
      toast.error('Please select a role');
      return;
    }

    try {
      await base44.entities.UserRole.create({
        userId,
        roleId: selectedRoleId,
        assignedBy: await base44.auth.me().then(u => u.email)
      });

      toast.success('Role assigned successfully');
      setSelectedRoleId('');
      loadData();
    } catch (error) {
      toast.error('Failed to assign role');
    }
  };

  const handleRemoveRole = async (userRoleId) => {
    try {
      await base44.entities.UserRole.delete(userRoleId);
      toast.success('Role removed');
      loadData();
    } catch (error) {
      toast.error('Failed to remove role');
    }
  };

  const getRoleDetails = (roleId) => {
    return availableRoles.find(r => r.id === roleId);
  };

  if (loading) {
    return <div className="text-gray-500">Loading roles...</div>;
  }

  const assignedRoleIds = userRoles.map(ur => ur.roleId);
  const unassignedRoles = availableRoles.filter(r => !assignedRoleIds.includes(r.id));

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
        <Users className="w-4 h-4" />
        User Roles
      </h4>

      {/* Current Roles */}
      <div className="space-y-2">
        {userRoles.length === 0 ? (
          <p className="text-sm text-gray-500">No roles assigned</p>
        ) : (
          userRoles.map((ur) => {
            const role = getRoleDetails(ur.roleId);
            return (
              <div key={ur.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">{role?.roleName}</p>
                  <p className="text-xs text-blue-700">
                    Assigned {new Date(ur.assignedAt || ur.created_date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRole(ur.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Assign New Role */}
      {unassignedRoles.length > 0 && (
        <div className="flex gap-2 pt-2 border-t border-gray-200">
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select role to assign...</option>
            {unassignedRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.roleName}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAssignRole}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Assign
          </button>
        </div>
      )}
    </div>
  );
}