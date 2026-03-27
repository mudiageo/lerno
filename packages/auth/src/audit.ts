import { db } from '@lerno/db';
import { auditLog } from '@lerno/db/schema';

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
              ?? params.request?.headers.get('x-forwarded-for') ?? 'unknown',
    userAgent:  params.request?.headers.get('user-agent'),
  });
}
