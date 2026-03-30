import { query, getRequestEvent, command } from '$app/server';
import { db } from '@lerno/db';
import { posts, users, userCourses, interactions, xpEvents, topicMastery } from '@lerno/db/schema';
import { desc, eq, inArray, and, sql, lt } from 'drizzle-orm';
import * as v from 'valibot';

// ─── Feed ─────────────────────────────────────────────────────────────────────

const FeedInput = v.object({
  cursor: v.optional(v.string()),      // last post createdAt ISO string
  limit: v.optional(v.number()),
});

export const getFeed = query(FeedInput, async (input) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  const limit = input.limit ?? 20;

  // Build cursor condition for pagination
  const cursorCondition = input.cursor
    ? lt(posts.createdAt, new Date(input.cursor))
    : undefined;

  const feedPosts = await db
    .select({
      id: posts.id,
      postType: posts.postType,
      content: posts.content,
      courseCode: sql<string>`${userCourses.code}`.as('courseCode'),
      topicTags: posts.topicTags,
      likeCount: posts.likeCount,
      replyCount: posts.replyCount,
      repostCount: posts.repostCount,
      aiGenerated: posts.aiGenerated,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
      authorName: users.displayName,
      authorUsername: users.username,
      authorImage: users.avatarUrl,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(userCourses, eq(posts.courseId, userCourses.id))
    .where(
      and(
        eq(posts.isVisible, true),
        cursorCondition,
      )
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1); // fetch one extra to detect hasMore

  const hasMore = feedPosts.length > limit;
  const items = hasMore ? feedPosts.slice(0, limit) : feedPosts;

  // If logged in, fetch user's like/bookmark state for these posts
  let userInteractions: Record<string, { liked: boolean; bookmarked: boolean }> = {};
  if (userId && items.length > 0) {
    const postIds = items.map(p => p.id);
    const myInteractions = await db
      .select({ postId: interactions.postId, type: interactions.type })
      .from(interactions)
      .where(
        and(
          eq(interactions.userId, userId),
          inArray(interactions.type, ['like', 'bookmark']),
          sql`${interactions.postId} = ANY(${sql.raw(`ARRAY[${postIds.map(id => `'${id}'`).join(',')}]::uuid[]`)})`
        )
      );
    for (const i of myInteractions) {
      if (!i.postId) continue;
      if (!userInteractions[i.postId]) userInteractions[i.postId] = { liked: false, bookmarked: false };
      if (i.type === 'like') userInteractions[i.postId].liked = true;
      if (i.type === 'bookmark') userInteractions[i.postId].bookmarked = true;
    }
  }

  return {
    posts: items.map(p => ({
      ...p,
      author: { name: p.authorName, username: p.authorUsername, image: p.authorImage },
      liked: userInteractions[p.id]?.liked ?? false,
      bookmarked: userInteractions[p.id]?.bookmarked ?? false,
      createdAt: p.createdAt?.toISOString() ?? new Date().toISOString(),
    })),
    nextCursor: hasMore ? items[items.length - 1].createdAt?.toISOString() : null,
  };
});

// ─── Interactions ──────────────────────────────────────────────────────────────

const PostIdInput = v.object({ postId: v.string() });

export const likePost = command(PostIdInput, async ({ postId }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // Check if already liked
  const existing = await db
    .select({ id: interactions.id })
    .from(interactions)
    .where(and(eq(interactions.userId, userId), eq(interactions.postId, postId), eq(interactions.type, 'like')))
    .limit(1);

  if (existing.length > 0) {
    // Unlike
    await db.delete(interactions).where(and(eq(interactions.userId, userId), eq(interactions.postId, postId), eq(interactions.type, 'like')));
    await db.update(posts).set({ likeCount: sql`${posts.likeCount} - 1` }).where(eq(posts.id, postId));
    return { liked: false };
  } else {
    // Like
    await db.insert(interactions).values({ userId, postId, type: 'like' });
    await db.update(posts).set({ likeCount: sql`${posts.likeCount} + 1` }).where(eq(posts.id, postId));
    return { liked: true };
  }
});

export const bookmarkPost = command(PostIdInput, async ({ postId }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const existing = await db
    .select({ id: interactions.id })
    .from(interactions)
    .where(and(eq(interactions.userId, userId), eq(interactions.postId, postId), eq(interactions.type, 'bookmark')))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(interactions).where(and(eq(interactions.userId, userId), eq(interactions.postId, postId), eq(interactions.type, 'bookmark')));
    return { bookmarked: false };
  } else {
    await db.insert(interactions).values({ userId, postId, type: 'bookmark' });
    return { bookmarked: true };
  }
});

export const repostPost = command(PostIdInput, async ({ postId }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  await db.insert(interactions).values({ userId, postId, type: 'repost' });
  await db.update(posts).set({ repostCount: sql`${posts.repostCount} + 1` }).where(eq(posts.id, postId));
  return { success: true };
});

// ─── Create Post ───────────────────────────────────────────────────────────────

const CreatePostInput = v.object({
  postType: v.picklist(['text', 'image', 'quiz', 'flashcard', 'poll', 'link']),
  content: v.record(v.string(), v.unknown()),
  courseId: v.optional(v.string()),
  topicTags: v.optional(v.array(v.string())),
});

export const createPost = command(CreatePostInput, async (input) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const [post] = await db.insert(posts).values({
    authorId: userId,
    postType: input.postType as any,
    content: input.content,
    courseId: input.courseId,
    topicTags: input.topicTags ?? [],
    isVisible: true,
  }).returning({ id: posts.id });

  // Award XP for posting
  await db.insert(xpEvents).values({ userId, eventType: 'post_created', xpAwarded: 5 });
  await db.update(users).set({ xp: sql`${users.xp} + 5` }).where(eq(users.id, userId));

  return { postId: post.id };
});

// ─── Quiz / Flashcard / Poll ───────────────────────────────────────────────────

const QuizAnswerInput = v.object({
  postId: v.string(),
  optionId: v.string(),
  topic: v.optional(v.string()),
  courseId: v.optional(v.string()),
});

export const submitQuizAnswer = command(QuizAnswerInput, async (input) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // Get post to verify correct answer
  const [post] = await db.select({ content: posts.content, courseId: posts.courseId })
    .from(posts).where(eq(posts.id, input.postId)).limit(1);
  if (!post) throw new Error('Post not found');

  const content = post.content as any;
  const isCorrect = content.correctOptionId === input.optionId;
  const xpAwarded = isCorrect ? 10 : 2;

  // Record interaction with answer payload
  await db.insert(interactions).values({
    userId,
    postId: input.postId,
    type: 'quiz_answer',
    payload: { optionId: input.optionId, isCorrect },
  }).onConflictDoNothing();

  // Award XP
  await db.insert(xpEvents).values({ userId, eventType: isCorrect ? 'quiz_correct' : 'quiz_attempt', xpAwarded });
  await db.update(users).set({ xp: sql`${users.xp} + ${xpAwarded}` }).where(eq(users.id, userId));

  // Update mastery if topic + course provided
  if (input.topic && (input.courseId ?? post.courseId)) {
    const cId = input.courseId ?? post.courseId!;
    await db
      .insert(topicMastery)
      .values({ userId, courseId: cId, topic: input.topic, score: isCorrect ? 60 : 40, attempts: 1, correct: isCorrect ? 1 : 0 })
      .onConflictDoUpdate({
        target: [topicMastery.userId, topicMastery.courseId, topicMastery.topic],
        set: {
          score: isCorrect ? sql`LEAST(${topicMastery.score} + 5, 100)` : sql`GREATEST(${topicMastery.score} - 3, 0)`,
          attempts: sql`${topicMastery.attempts} + 1`,
          correct: isCorrect ? sql`${topicMastery.correct} + 1` : topicMastery.correct,
          updatedAt: new Date(),
        },
      });
  }

  return { isCorrect, xpAwarded, explanation: content.explanation ?? null };
});

const FlashcardResultInput = v.object({
  postId: v.string(),
  known: v.boolean(),
  topic: v.optional(v.string()),
  courseId: v.optional(v.string()),
});

export const submitFlashcardResult = command(FlashcardResultInput, async (input) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const xpAwarded = input.known ? 5 : 2;

  await db.insert(interactions).values({
    userId, postId: input.postId, type: 'flashcard_flip',
    payload: { known: input.known },
  }).onConflictDoNothing();

  await db.insert(xpEvents).values({ userId, eventType: 'flashcard_reviewed', xpAwarded });
  await db.update(users).set({ xp: sql`${users.xp} + ${xpAwarded}` }).where(eq(users.id, userId));

  return { xpAwarded };
});

const PollVoteInput = v.object({ postId: v.string(), optionId: v.string() });

export const submitPollVote = command(PollVoteInput, async (input) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  await db.insert(interactions).values({
    userId, postId: input.postId, type: 'poll_vote',
    payload: { optionId: input.optionId },
  }).onConflictDoNothing();

  return { success: true };
});
