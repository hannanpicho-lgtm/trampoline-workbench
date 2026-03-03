import { useState, useEffect } from 'react';
import { backendClient } from '@/api/backendClient';

export function useAdminPermissions() {
  const [permissions, setPermissions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const user = await backendClient.auth.me();
      
      // Super admin has all permissions
      if (user.role === 'admin') {
        setIsSuperAdmin(true);
        setPermissions(new Set(['*']));
        setLoading(false);
        return;
      }

      // Load user roles and permissions
      const userRoles = await backendClient.entities.UserRole.filter({ userId: user.id });
      
      if (userRoles.length === 0) {
        setPermissions(new Set());
        setLoading(false);
        return;
      }

      const roles = await Promise.all(
        userRoles.map(ur => backendClient.entities.Role.filter({ id: ur.roleId }))
      );

      const perms = new Set();
      roles.flat().forEach(role => {
        if (role.isActive) {
          role.permissions?.forEach(p => perms.add(p));
        }
      });

      setPermissions(perms);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      setPermissions(new Set());
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    if (isSuperAdmin) return true;
    return permissions.has(permission) || permissions.has('*');
  };

  const hasAnyPermission = (permissionsArray) => {
    if (isSuperAdmin) return true;
    return permissionsArray.some(p => permissions.has(p) || permissions.has('*'));
  };

  return { permissions, hasPermission, hasAnyPermission, loading, isSuperAdmin };
}