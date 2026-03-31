# SaaS Roles, Permissions & RBAC

## Role Hierarchy

```
superadmin              ← Owner / CTO — god mode, everything
    └── staff_admin     ← Head of departments — manages staff accounts
          ├── moderator        ← Content team — review flagged content
          ├── support          ← Customer service — tickets + user help
          ├── analyst          ← Data team — read-only analytics
          ├── finance          ← Finance team — payments, revenue, invoices
          └── content_editor   ← Content team — manage AI content, courses

institution_admin       ← School/university admin — manages their institution
    └── lecturer        ← Teacher — manages their courses, sees students

tutor                   ← Power user — can host streams, create premium content
student                 ← Default user role
```

---

## Permission Matrix

### Internal Staff Permissions

| Permission | superadmin | staff_admin | moderator | support | analyst | finance | content_editor |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Users** | | | | | | | |
| View all users | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit user profile | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Suspend / ban user | ✅ | ✅ | ✅ | ⚠️¹ | ❌ | ❌ | ❌ |
| Delete user account | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View user PII | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| Impersonate user | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Content** | | | | | | | |
| View all posts | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Delete any post | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Approve flagged content | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Create/edit AI content | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage course catalog | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Support** | | | | | | | |
| View tickets | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Respond to tickets | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Process refunds | ✅ | ✅ | ❌ | ⚠️² | ❌ | ✅ | ❌ |
| **Payments** | | | | | | | |
| View revenue data | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Manage subscriptions | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Issue manual refunds | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Manage institutions | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Analytics** | | | | | | | |
| Platform analytics | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| User-level analytics | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Export reports | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Staff Management** | | | | | | | |
| Invite staff members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Change staff roles | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Manage system config | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

⚠️¹ Support can flag for suspension, requires moderator/admin approval  
⚠️² Support can initiate refund requests, requires finance approval

### Institution Permissions

| Permission | institution_admin | lecturer |
|---|:---:|:---:|
| View all students in institution | ✅ | ❌ |
| View students in their courses | ✅ | ✅ |
| View cohort analytics | ✅ | ❌ |
| View course analytics | ✅ | ✅ |
| Create/edit courses | ✅ | ✅ (own courses) |
| Upload course materials | ✅ | ✅ |
| Create quiz/flashcard content | ✅ | ✅ |
| Set exam schedules | ✅ | ✅ |
| View billing / seat usage | ✅ | ❌ |
| Manage institution profile | ✅ | ❌ |
| Invite lecturers | ✅ | ❌ |
| At-risk student alerts | ✅ | ✅ |

---

## RBAC Implementation

```typescript
// packages/auth/src/rbac.ts

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
  return async ({ locals, redirect }: any) => {
    if (!locals.user || !locals.staffMember) {
      throw redirect(302, '/admin/login');
    }
    if (!hasPermission(locals.staffMember.role, requiredPermission)) {
      throw redirect(302, '/admin/unauthorized');
    }
  };
}
```

### Admin App Route Guards

```typescript
// apps/admin/src/routes/(admin)/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import { db } from '@studyscroll/db';
import { staffMembers } from '@studyscroll/db/schema';

export async function load({ locals }) {
  if (!locals.user) throw redirect(302, '/admin/login');

  const staff = await db.query.staffMembers.findFirst({
    where: and(
      eq(staffMembers.userId, locals.user.id),
      eq(staffMembers.active, true),
    ),
  });

  if (!staff) throw redirect(302, '/admin/unauthorized');

  return { user: locals.user, staff };
}
```

---

## Audit Logging

Every write action in the admin panel is recorded to `audit_log`.

```typescript
// packages/auth/src/audit.ts
export async function logAuditEvent(params: {
  actorId: string;
  action: string;           // e.g. 'user.suspend', 'post.delete', 'refund.issue'
  targetType?: string;
  targetId?: string;
  metadata?: object;
  request?: Request;
}) {
  await db.insert(auditLog).values({
    actorId:    params.actorId,
    action:     params.action,
    targetType: params.targetType,
    targetId:   params.targetId,
    metadata:   params.metadata,
    ipAddress:  params.request?.headers.get('cf-connecting-ip')
              ?? params.request?.headers.get('x-forwarded-for'),
    userAgent:  params.request?.headers.get('user-agent'),
  });
}

// Usage in admin remote function:
export const suspendUser = command(async ({ staffId, targetUserId, reason, request }) => {
  requirePermission(staff.role, 'users:write');

  await db.update(users).set({ suspended: true, suspendedReason: reason })
    .where(eq(users.id, targetUserId));

  await logAuditEvent({
    actorId: staffId,
    action: 'user.suspend',
    targetType: 'user',
    targetId: targetUserId,
    metadata: { reason },
    request,
  });
});
```
