import { db } from './db';
import { posts, users, userCourses } from './schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Fetching a user to author the videos...');
  const [user] = await db.select({ id: users.id }).from(users).limit(1);
  if (!user) {
    console.error('No users found in database. Please create a user first.');
    process.exit(1);
  }

  const [course] = await db.select({ id: userCourses.id }).from(userCourses).limit(1);
  
  console.log(`Using user ${user.id} as author.`);
  const courseId = course?.id ?? null;

  const videoData = [
    {
      postType: 'video' as const,
      authorId: user.id,
      courseId,
      content: {
        title: 'Introduction to Modern Physics',
        body: 'A comprehensive overview of quantum mechanics and relativity.',
        videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
        duration: 596
      },
      topicTags: ['physics', 'science'],
    },
    {
      postType: 'video' as const,
      authorId: user.id,
      courseId,
      content: {
        title: 'Advanced Mathematics: Calculus',
        body: 'Deep dive into integrals and derivatives with real-world examples.',
        videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80',
        duration: 653
      },
      topicTags: ['math', 'calculus'],
    },
    {
      postType: 'short' as const,
      authorId: user.id,
      courseId,
      content: {
        title: 'Quick Tip: Focus techniques',
        body: 'How to use the Pomodoro technique effectively.',
        videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: 15
      },
      topicTags: ['study', 'tips'],
    },
    {
      postType: 'short' as const,
      authorId: user.id,
      courseId,
      content: {
        title: 'Exam Prep in 60 seconds',
        body: 'Top 3 things to remember before your finals.',
        videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        duration: 60
      },
      topicTags: ['exams', 'prep'],
    },
    {
      postType: 'short' as const,
      authorId: user.id,
      courseId,
      content: {
        title: 'Daily Motivation',
        body: 'Keep pushing forward, you got this!',
        videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        duration: 30
      },
      topicTags: ['motivation'],
    }
  ];

  console.log('Inserting videos and shorts...');
  await db.insert(posts).values(videoData as any);
  console.log('Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
