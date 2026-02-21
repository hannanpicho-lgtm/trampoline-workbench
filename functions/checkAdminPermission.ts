import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        hasAccess: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Super admin always has full access
    if (user.role === 'admin') {
      return Response.json({ 
        hasAccess: true, 
        isSuperAdmin: true,
        permissions: ['*']
      });
    }

    const { permission } = await req.json();

    // Get user roles
    const userRoles = await base44.entities.UserRole.filter({ 
      userId: user.id 
    });

    if (userRoles.length === 0) {
      return Response.json({ 
        hasAccess: false, 
        error: 'No roles assigned' 
      });
    }

    // Get role details
    const roles = await Promise.all(
      userRoles.map(ur => base44.entities.Role.filter({ id: ur.roleId }))
    );

    const permissions = new Set();
    roles.flat().forEach(role => {
      if (role.isActive) {
        role.permissions?.forEach(p => permissions.add(p));
      }
    });

    const hasAccess = permissions.has(permission) || permissions.has('*');

    return Response.json({ 
      hasAccess,
      permissions: Array.from(permissions)
    });

  } catch (error) {
    return Response.json({ 
      hasAccess: false, 
      error: error.message 
    }, { status: 500 });
  }
});