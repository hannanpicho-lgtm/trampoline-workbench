import { useState, useEffect, useCallback } from 'react';
import { backendClient } from '@/api/backendClient';

export const usePermissions = (userId) => {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadUserPermissions = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Get user roles
      const userRoles = await backendClient.entities.UserRole.filter({ userId });
      const roleIds = userRoles.map(ur => ur.roleId);
      setRoles(userRoles);

      // Get all role details
      const allRoles = await backendClient.entities.Role.list();
      const userRoleDetails = allRoles.filter(r => roleIds.includes(r.id));

      // Collect all permissions
      const allPermissions = new Set();
      userRoleDetails.forEach(role => {
        role.permissions?.forEach(perm => allPermissions.add(perm));
      });

      setPermissions(Array.from(allPermissions));
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserPermissions();
  }, [loadUserPermissions]);

  const hasPermission = useCallback((permission) => {
    return permissions.includes(permission);
  }, [permissions]);

  const hasAnyPermission = useCallback((permissionsArray) => {
    return permissionsArray.some(p => permissions.includes(p));
  }, [permissions]);

  const hasAllPermissions = useCallback((permissionsArray) => {
    return permissionsArray.every(p => permissions.includes(p));
  }, [permissions]);

  return {
    permissions,
    roles,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    reload: loadUserPermissions
  };
};