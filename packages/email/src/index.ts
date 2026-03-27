import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export interface EmailProvider {
  send(params: { to: string; subject: string; html: string; text?: string }): Promise<void>;
}

export class ResendProvider implements EmailProvider {
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send({ to, subject, html, text }: { to: string; subject: string; html: string; text?: string }) {
    console.log('Sending email to', to);
    console.log('Subject', subject);
    console.log('Text', text);
    await this.client.emails.send({
      from: process.env.EMAIL_FROM ?? 'Lerno <noreply@lerno.dev>',
      to, subject, html, text,
    });
  }
}

export class NodemailerProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }

  async send({ to, subject, html, text }: { to: string; subject: string; html: string; text?: string }) {
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM ?? 'Lerno <noreply@lerno.dev>',
      to, subject, html, text,
    });
  }
}

// Auto-select: Resend if API key present, else Nodemailer
export const email: EmailProvider = process.env.RESEND_API_KEY
  ? new ResendProvider(process.env.RESEND_API_KEY)
  : new NodemailerProvider();

// Shared Templates
export const templates = {
  examReminder: (params: { name: string; examTitle: string; courseCode: string; date: string; daysLeft: number }) => ({
    subject: `📅 ${params.daysLeft === 1 ? 'Tomorrow' : `${params.daysLeft} days`}: ${params.examTitle} (${params.courseCode})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Exam Reminder 📚</h2>
        <p>Hey ${params.name},</p>
        <p>Your <strong>${params.examTitle}</strong> for <strong>${params.courseCode}</strong> is 
           ${params.daysLeft === 1 ? '<strong>tomorrow</strong>' : `in <strong>${params.daysLeft} days</strong>`}.</p>
        <p>Jump into Lerno to review your weak topics before it's too late.</p>
        <a href="${process.env.PUBLIC_APP_URL}/study" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                  border-radius: 8px; text-decoration: none; margin-top: 16px;">
          Study Now
        </a>
      </div>
    `,
  }),

  resetPassword: (params: { name: string; url: string }) => ({
    subject: 'Reset your Lerno password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Password Reset 🔐</h2>
        <p>Hey ${params.name},</p>
        <p>We received a request to reset your password. Click the button below to choose a new one:</p>
        <a href="${params.url}" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                  border-radius: 8px; text-decoration: none; margin-top: 16px;">
          Reset Password
        </a>
        <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  }),

  verifyEmail: (params: { name: string; url: string }) => ({
    subject: 'Welcome to Lerno — Verify your email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Welcome to Lerno! 🎉</h2>
        <p>Hey ${params.name},</p>
        <p>We're excited to have you on board. Please verify your email address to get started:</p>
        <a href="${params.url}" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                  border-radius: 8px; text-decoration: none; margin-top: 16px;">
          Verify Email
        </a>
      </div>
    `,
  })
};
