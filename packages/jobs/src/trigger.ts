import PgBoss from 'pg-boss';
import 'dotenv/config';

async function trigger() {
  const queue = process.argv[2];
  if (!queue) {
    console.error('Usage: vp run trigger <queue-name>');
    console.log('Common queues: generate-content, generate-videos, fetch-youtube-videos');
    process.exit(1);
  }

  console.log(`Connecting to pg-boss to trigger [${queue}]...`);
  const boss = new PgBoss(process.env.DATABASE_URL!);
  
  try {
    await boss.start();
    const jobId = await boss.send(queue, {});
    console.log(`🚀 Job [${queue}] injected successfully!`);
    console.log(`👉 Job ID: ${jobId}`);
  } catch (err) {
    console.error('❌ Failed to trigger job:', err);
  } finally {
    await boss.stop();
  }
}

trigger();
