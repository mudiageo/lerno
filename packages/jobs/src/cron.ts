import type PgBoss from 'pg-boss';

export async function registerCronJobs(boss: PgBoss) {
  await boss.schedule('generate-ai-content',     '0 2 * * *',    {});  // 2am daily
  await boss.schedule('send-exam-reminders',     '0 8 * * *',    {});  // 8am daily
  await boss.schedule('update-engagement-scores','*/10 * * * *', {});  // every 10min
  await boss.schedule('refresh-post-scores',     '*/5 * * * *',  {});  // every 5min
  await boss.schedule('update-leaderboards',     '*/30 * * * *', {});  // every 30min
  await boss.schedule('clean-yt-cache',          '0 3 * * *',    {});  // 3am daily (clear >24h entries)
  await boss.schedule('send-streak-at-risk',     '0 20 * * *',   {});  // 8pm — warn users whose streak is at risk
  await boss.schedule('downgrade-expired-subs',  '*/30 * * * *', {});  // every 30min
}
