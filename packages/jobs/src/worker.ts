import PgBoss from 'pg-boss';
import { generateContentJob } from './jobs/generate-content';
import { sendEmailJob } from './jobs/send-email';
import { sendPushJob } from './jobs/send-push';
import { processUploadJob } from './jobs/process-upload';
import { sendExamReminders } from './jobs/exam-reminders';
import { registerCronJobs } from './cron';

async function start() {
  const boss = new PgBoss(process.env.DATABASE_URL!);

  boss.on('error', console.error);

  await boss.start();

  // Register handlers
  await boss.work('generate-content', { teamSize: 2 }, generateContentJob as any);
  await boss.work('send-email', { teamSize: 5 }, sendEmailJob as any);
  await boss.work('send-push', { teamSize: 5 }, sendPushJob as any);
  await boss.work('process-upload', { teamSize: 2 }, processUploadJob as any);
  await boss.work('send-exam-reminders', sendExamReminders as any);
  
  await registerCronJobs(boss);

  console.log('pg-boss worker started');
}

start();
