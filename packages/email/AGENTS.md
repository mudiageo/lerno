# 📧 Email Package (@lerno/email)

This package handles all email notifications for Lerno, supporting [Resend](https://resend.com/) and [Nodemailer](https://nodemailer.com/).

## 🚀 Usage

Use the exported `email` singleton and the `templates` helper for all outgoing communications.

### Sending an Email
```typescript
import { email, templates } from '@lerno/email';

const tpl = templates.verifyEmail({ name: 'User', url: '...' });
await email.send({
    to: 'user@example.com',
    subject: tpl.subject,
    html: tpl.html
});
```

### Providers
Switching is automatic based on environment variables:
1. **Resend**: Used if `RESEND_API_KEY` is present.
2. **Nodemailer**: Default fallback (requires `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).

## 🏗️ Templates

Templates are defined in [src/index.ts](./src/index.ts) using the `templates` object:
- `verifyEmail`: Welcome and verification link.
- `resetPassword`: Password reset instructions.
- `examReminder`: Personalized study reminders for scheduled exams.

## 🛠️ Development Rules for Agents

- **Provider-Agnostic**: Code against the `EmailProvider` interface. Never reference `ResendProvider` or `NodemailerProvider` directly.
- **Templates**: Always add new templates to the `templates` object instead of hardcoding HTML strings in application logic.
- **Styling**: Use inline CSS for templates for maximum email client compatibility. Favor high-accessibility colors (e.g., `#2563eb` for primary actions).
- **Hooks**: For long-running operations or high volume, always queue emails via `@lerno/jobs` (pg-boss) instead of sending them synchronously.
