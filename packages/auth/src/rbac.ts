import { redirect } from "@sveltejs/kit";

export type StaffRole =
  | 'superadmin' | 'staff_admin' | 'moderator'
  | 'support' | 'analyst' | 'finance' | 'content_editor';

export type InstitutionRole = 'institution_admin' | 'lecturer';

export type Permission =
  | 'users:read' | 'users:write' | 'users:delete' | 'users:impersonate' | 'users:pii'
  | 'content:read' | 'content:write' | 'content:delete' | 'content:moderate'
  | 'support:read' | 'support:write' | 'support:refund'
  | 'payments:read' | 'payments:write' | 'payments:refund'
  | 'analytics:platform' | 'analytics:user' | 'analytics:export'
  | 'staff:read' | 'staff:write'
  | 'system:config';

const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  superadmin: [
    'users:read', 'users:write', 'users:delete', 'users:impersonate', 'users:pii',
    'content:read', 'content:write', 'content:delete', 'content:moderate',
    'support:read', 'support:write', 'support:refund',
    'payments:read', 'payments:write', 'payments:refund',
    'analytics:platform', 'analytics:user', 'analytics:export',
    'staff:read', 'staff:write',
    'system:config',
  ],
  staff_admin: [
    'users:read', 'users:write', 'users:delete', 'users:pii',
    'content:read', 'content:write', 'content:delete', 'content:moderate',
    'support:read', 'support:write', 'support:refund',
    'payments:read', 'payments:write', 'payments:refund',
    'analytics:platform', 'analytics:user', 'analytics:export',
    'staff:read', 'staff:write',
  ],
  moderator: [
    'users:read', 'users:write',
    'content:read', 'content:delete', 'content:moderate',
    'support:read',
    'analytics:platform',
    'staff:read',
  ],
  support: [
    'users:read', 'users:write', 'users:pii',
    'content:read',
    'support:read', 'support:write',
    'payments:read',
    'analytics:platform',
  ],
  analyst: [
    'users:read',
    'content:read',
    'support:read',
    'payments:read',
    'analytics:platform', 'analytics:user', 'analytics:export',
    'staff:read',
  ],
  finance: [
    'users:pii',
    'support:read', 'support:refund',
    'payments:read', 'payments:write', 'payments:refund',
    'analytics:platform', 'analytics:export',
  ],
  content_editor: [
    'content:read', 'content:write', 'content:delete', 'content:moderate',
    'analytics:platform',
  ],
};

export function hasPermission(role: StaffRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(role: StaffRole, permission: Permission) {
  if (!hasPermission(role, permission)) {
    throw new Error(`Forbidden: ${role} cannot perform ${permission}`);
  }
}

// SvelteKit admin route guard
export function createAdminGuard(requiredPermission: Permission) {
  return async ({ locals }: any) => {
    if (!locals.user || !locals.staffMember) {
      redirect(302, '/admin/login');
    }
    if (!hasPermission(locals.staffMember.role, requiredPermission)) {
      redirect(302, '/admin/unauthorized');
    }
  };
}
