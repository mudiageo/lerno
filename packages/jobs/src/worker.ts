import PgBoss from 'pg-boss';
import { generateContentJob } from './jobs/generate-content';
import { sendEmailJob } from './jobs/send-email';
import { sendPushJob } from './jobs/send-push';
import { processUploadJob } from './jobs/process-upload';
import { sendExamReminders } from './jobs/exam-reminders';
import { fetchYouTubeVideosJob } from './jobs/youtube';
import { registerCronJobs } from './cron';

async function start() {
  const boss = new PgBoss(process.env.DATABASE_URL!);

  boss.on('error', console.error);

  await boss.start();

  // Register handlers
  await boss.work('generate-content', generateContentJob as any);
  await boss.work('send-email', sendEmailJob as any);
  await boss.work('send-push', sendPushJob as any);
  await boss.work('process-upload', processUploadJob as any);
  await boss.work('send-exam-reminders', sendExamReminders as any);
  await boss.work('fetch-youtube-videos', fetchYouTubeVideosJob as any);
  
  await registerCronJobs(boss);

  console.log('pg-boss worker started');
}

start();
