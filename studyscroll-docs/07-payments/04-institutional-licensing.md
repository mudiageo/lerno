# Institutional Licensing — Sales, Onboarding & Billing

## Institutional Plan Tiers

| Tier | Seats | Monthly/seat (NGN) | Monthly/seat (USD) | Features |
|---|---|---|---|---|
| Starter | 50–200 | ₦2,500 | $2.50 | Core features + lecturer dashboard |
| Growth | 201–1,000 | ₦2,000 | $2.00 | + Custom branding + API access |
| Enterprise | 1,000+ | ₦1,500 | $1.50 | + SSO + SLA + dedicated support |
| Custom | Any | Negotiated | Negotiated | + White-label domain + deep LMS integration |

All institutional plans billed annually. Monthly billing available at +20% premium.

---

## Institutional Features (vs Student Premium)

| Feature | Student Premium | Institution |
|---|---|---|
| All student premium features | ✅ | ✅ for all seats |
| Lecturer dashboard | ❌ | ✅ |
| Cohort analytics | ❌ | ✅ |
| At-risk student alerts | ❌ | ✅ |
| Bulk student import | ❌ | ✅ |
| Course material uploads (bulk) | ❌ | ✅ |
| Custom branding (logo, colors) | ❌ | Growth+ |
| API access | ❌ | Growth+ |
| SSO (SAML/OAuth) | ❌ | Enterprise |
| White-label subdomain | ❌ | Custom |
| LMS integration (Moodle/Canvas) | ❌ | Enterprise+ |
| SLA guarantee | ❌ | Enterprise+ |
| Dedicated support contact | ❌ | Enterprise+ |

---

## Sales Process

```
1. Lead inbound (website form or email to schools@studyscroll.dev)
2. Sales call / demo (screen share of institution dashboard + student app)
3. Trial: 30-day free trial for up to 50 students
4. Proposal: custom quote based on seat count + required features
5. Contract signed: finance team creates institution in admin panel
6. Onboarding: dedicated setup session with tech lead + head lecturer
7. Go live: students invited, first content generated
8. Check-in: 2 weeks, 1 month, 3 months
9. Renewal: 60 days before annual renewal, outreach for upsell/renewal
```

---

## Creating an Institution (Admin Panel)

```typescript
// apps/admin/src/lib/server/remote/admin-institutions.ts

export const createInstitution = command(async ({
  name, domain, seatLimit, plan, billingCycle, currency,
  contactName, contactEmail, staffId,
}) => {
  requirePermission(staff.role, 'payments:write');

  // 1. Create institution record
  const [institution] = await db.insert(institutions).values({
    name, domain, seatLimit,
  }).returning();

  // 2. Create subscription record
  const [sub] = await db.insert(subscriptions).values({
    userId: null, // institution-level, no single user
    provider: currency === 'NGN' ? 'paystack' : 'stripe',
    providerSubId: `inst_${institution.id}`,
    plan: `institutional_${plan}`,
    status: 'active',
    billingPeriod: billingCycle,
    amount: calculateInstitutionPrice(seatLimit, plan, currency),
    currency,
    currentPeriodEnd: addMonths(new Date(), billingCycle === 'yearly' ? 12 : 1),
  }).returning();

  // 3. Update institution with subscription
  await db.update(institutions).set({ subscriptionId: sub.id }).where(eq(institutions.id, institution.id));

  // 4. Create institution admin user
  const tempPassword = generateSecurePassword();
  const [adminUser] = await db.insert(users).values({
    email: contactEmail,
    displayName: contactName,
    institutionId: institution.id,
    plan: 'institutional',
    emailVerified: true,
  }).returning();

  await db.insert(staffMembers).values({
    userId: adminUser.id,
    role: 'institution_admin',
    createdBy: staffId,
  });

  // 5. Send welcome email with login instructions
  await pgBoss.send('send-email', {
    to: contactEmail,
    template: 'institutionWelcome',
    data: {
      institutionName: name,
      contactName,
      loginUrl: `${process.env.INSTITUTION_APP_URL}/login`,
      tempPassword,
      seatLimit,
      setupGuideUrl: `${process.env.DOCS_URL}/institutions/getting-started`,
    },
  });

  await logAuditEvent({
    actorId: staffId,
    action: 'institution.create',
    targetType: 'institution',
    targetId: institution.id,
    metadata: { name, seatLimit, plan, currency },
  });

  return { institution, adminUser };
});

function calculateInstitutionPrice(seats: number, plan: string, currency: string): number {
  const pricesNGN = { starter: 2500, growth: 2000, enterprise: 1500 };
  const pricesUSD = { starter: 250, growth: 200, enterprise: 150 };  // in cents
  const prices = currency === 'NGN' ? pricesNGN : pricesUSD;
  return seats * (prices[plan as keyof typeof pricesNGN] ?? 2500);
}
```

---

## Seat Allocation

```typescript
// When a student joins via institution invite link:
export const joinInstitution = command(async ({ userId, institutionCode }) => {
  const institution = await db.query.institutions.findFirst({
    where: eq(institutions.inviteCode, institutionCode),
  });

  if (!institution) throw new Error('Invalid institution code');
  if (institution.seatsUsed >= institution.seatLimit) {
    throw new Error('This institution has reached its seat limit. Contact your administrator.');
  }

  // Assign user to institution + upgrade plan
  await db.update(users).set({
    institutionId: institution.id,
    plan: 'institutional',
  }).where(eq(users.id, userId));

  // Increment seat usage
  await db.update(institutions)
    .set({ seatsUsed: sql`seats_used + 1` })
    .where(eq(institutions.id, institution.id));

  // Alert institution admin if nearing seat limit
  if ((institution.seatsUsed + 1) / institution.seatLimit > 0.9) {
    await pgBoss.send('send-email', {
      to: institutionAdminEmail,
      template: 'seatLimitWarning',
      data: { seatsUsed: institution.seatsUsed + 1, seatLimit: institution.seatLimit },
    });
  }
});
```

---

## SSO (Enterprise — SAML)

```typescript
// Enterprise clients can authenticate students via their institution's SSO
// (e.g. university Microsoft 365 / Google Workspace)

// apps/web/src/routes/api/auth/sso/[institutionId]/+server.ts
import { auth } from '@studyscroll/auth';

export async function GET({ params, url }) {
  const institution = await db.query.institutions.findFirst({
    where: eq(institutions.id, params.institutionId),
  });

  if (!institution?.ssoConfig) {
    return Response.redirect('/login?error=sso_not_configured');
  }

  // Redirect to institution IdP
  const ssoUrl = buildSAMLRequest(institution.ssoConfig, url.origin);
  return Response.redirect(ssoUrl);
}

// SSO response handler (POST from IdP)
export async function POST({ params, request }) {
  const formData = await request.formData();
  const samlResponse = formData.get('SAMLResponse') as string;

  const { email, name } = parseSAMLResponse(samlResponse);

  // Find or create user
  let user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) {
    [user] = await db.insert(users).values({
      email, displayName: name,
      institutionId: params.institutionId,
      plan: 'institutional',
      emailVerified: true,
    }).returning();
  }

  // Create session
  return auth.api.createSession({ userId: user.id });
}
```

---

## Annual Renewal Process

```typescript
// packages/jobs/src/jobs/institutional-renewals.ts

export async function processInstitutionalRenewals() {
  // Find institutions renewing in next 7 days
  const upcoming = await db.select()
    .from(institutions)
    .innerJoin(subscriptions, eq(subscriptions.id, institutions.subscriptionId))
    .where(sql`subscriptions.current_period_end BETWEEN now() AND now() + interval '7 days'`);

  for (const { institutions: inst, subscriptions: sub } of upcoming) {
    const daysLeft = Math.ceil(
      (new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86400000
    );

    if (daysLeft === 7 || daysLeft === 3 || daysLeft === 1) {
      await pgBoss.send('send-email', {
        to: institutionAdminEmail,
        template: 'institutionalRenewalReminder',
        data: {
          institutionName: inst.name,
          renewalDate: formatDate(sub.currentPeriodEnd),
          amount: sub.amount,
          currency: sub.currency,
          daysLeft,
          billingUrl: `${process.env.INSTITUTION_APP_URL}/billing`,
        },
      });
    }
  }
}
```
