import type PgBoss from 'pg-boss';

export async function registerCronJobs(boss: PgBoss) {
  // AI and Content
  await boss.schedule('generate-content', '0 2 * * *', {});  // 2am daily
  await boss.schedule('generate-videos', '0 2 * * *', {});  // 2am daily
  await boss.schedule('fetch-youtube-videos', '0 3 * * *', {});  // 3am daily

  // Reminders and Subs
  await boss.schedule('send-exam-reminders', '0 8 * * *', {});  // 8am daily
  await boss.schedule('downgrade-expired-subs', '*/30 * * * *', {});  // every 30min

  // These require future implementation of handlers
  // await boss.schedule('update-engagement-scores','*/10 * * * *', {});
  // await boss.schedule('refresh-post-scores',     '*/5 * * * *',  {});
  // await boss.schedule('update-leaderboards',     '*/30 * * * *', {});
  // await boss.schedule('send-streak-at-risk',     '0 20 * * *',   {});
}
