import { email, templates } from '@lerno/email';

export async function sendEmailJob(job: { data: { to: string; template: keyof typeof templates; data: any } }) {
  const { to, template, data } = job.data;
  const { subject, html } = (templates[template] as any)(data);
  await email.send({ to, subject, html });
}
