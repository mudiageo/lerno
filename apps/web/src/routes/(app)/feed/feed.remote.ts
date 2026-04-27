import { query, getRequestEvent, command } from '$app/server';
import { db } from '@lerno/db';
import {
  posts,
  users,
  userCourses,
  interactions,
  xpEvents,
  topicMastery,
  mutes,
  mutedPosts,
  blocks,
  reports,
  notInterested,
} from '@lerno/db/schema';
import { desc, eq, inArray, and, sql, lt, not, isNull } from '@lerno/db/drizzle';
import * as v from 'valibot';

// ─── Feed ─────────────────────────────────────────────────────────────────────

const FeedInput = v.object({
  cursor: v.optional(v.string()), // last post createdAt ISO string
  limit: v.optional(v.number()),
  communityId: v.optional(v.string()), // filter by community
  postType: v.optional(v.string()), // 'short', 'quiz', 'video', etc.
  courseCode: v.optional(v.string()), // filter by course code
});

export const getPostById = query(v.object({ postId: v.string() }), async ({ postId }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;

  const [post] = await db
    .select({
      id: posts.id,
      postType: posts.postType,
      content: posts.content,
      courseCode: sql<string>`${userCourses.code}`.as('courseCode'),
      topicTags: posts.topicTags,
      likeCount: posts.likeCount,
      replyCount: posts.replyCount,
      repostCount: posts.repostCount,
      viewCount: posts.viewCount,
      aiGenerated: posts.aiGenerated,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
      authorName: users.displayName,
      authorUsername: users.username,
      authorImage: users.avatarUrl,
      parentId: posts.parentId,
      repostOfId: posts.repostOfId,
      quoteOfId: posts.quoteOfId,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(userCourses, eq(posts.courseId, userCourses.id))
    .where(and(eq(posts.id, postId), eq(posts.isVisible, true)))
    .limit(1);

  if (!post) throw new Error('Post not found');

  let liked = false;
  let bookmarked = false;

  if (userId) {
    const myInteractions = await db
      .select({ type: interactions.type })
      .from(interactions)
      .where(
        and(
          eq(interactions.userId, userId),
          eq(interactions.postId, postId),
          inArray(interactions.type, ['like', 'bookmark'])
        )
      );
    myInteractions.forEach((i) => {
      if (i.type === 'like') liked = true;
      if (i.type === 'bookmark') bookmarked = true;
    });
  }

  return {
    ...post,
    author: { name: post.authorName, username: post.authorUsername, image: post.authorImage },
    liked,
    bookmarked,
    createdAt: post.createdAt?.toISOString() ?? new Date().toISOString(),
  };
});

export const getFeed = query(FeedInput, async (input) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  const limit = input.limit ?? 20;

  // Build cursor condition for pagination
  const cursorCondition = input.cursor ? lt(posts.createdAt, new Date(input.cursor)) : undefined;

  // Collect IDs to exclude for logged-in users (muted users, blocked users, muted posts)
  let excludeUserIds: string[] = [];
  let excludePostIds: string[] = [];

  if (userId) {
    const [mutedUsers, blockedUsers, mutedPostRows, notInterestedRows] = await Promise.all([
      db.select({ mutedId: mutes.mutedId }).from(mutes).where(eq(mutes.muterId, userId)),
      db.select({ blockedId: blocks.blockedId }).from(blocks).where(eq(blocks.blockerId, userId)),
      db
        .select({ postId: mutedPosts.postId })
        .from(mutedPosts)
        .where(eq(mutedPosts.userId, userId)),
      db
        .select({ postId: notInterested.postId })
        .from(notInterested)
        .where(eq(notInterested.userId, userId)),
    ]);
    excludeUserIds = [...mutedUsers.map((m) => m.mutedId), ...blockedUsers.map((b) => b.blockedId)];
    excludePostIds = [
      ...(mutedPostRows.map((m) => m.postId).filter(Boolean) as string[]),
      ...(notInterestedRows.map((n) => n.postId).filter(Boolean) as string[]),
    ];
  }

  const whereConditions = and(
    eq(posts.isVisible, true),
    cursorCondition,
    input.communityId ? eq(posts.communityId, input.communityId) : undefined,
    input.postType ? eq(posts.postType, input.postType as any) : undefined,
    input.courseCode ? eq(userCourses.code, input.courseCode) : undefined,
    excludeUserIds.length > 0 ? not(inArray(posts.authorId, excludeUserIds)) : undefined,
    excludePostIds.length > 0 ? not(inArray(posts.id, excludePostIds)) : undefined
  );

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
      viewCount: posts.viewCount,
      aiGenerated: posts.aiGenerated,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
      authorName: users.displayName,
      authorUsername: users.username,
      authorImage: users.avatarUrl,
      parentId: posts.parentId,
      repostOfId: posts.repostOfId,
      quoteOfId: posts.quoteOfId,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(userCourses, eq(posts.courseId, userCourses.id))
    .where(whereConditions)
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1); // fetch one extra to detect hasMore

  const hasMore = feedPosts.length > limit;
  const items = hasMore ? feedPosts.slice(0, limit) : feedPosts;

  // Fetch per-post interaction state for logged-in user
  let userInteractions: Record<string, { liked: boolean; bookmarked: boolean }> = {};
  if (userId && items.length > 0) {
    const postIds = items.map((p) => p.id);
    const myInteractions = await db
      .select({ postId: interactions.postId, type: interactions.type })
      .from(interactions)
      .where(
        and(
          eq(interactions.userId, userId),
          inArray(interactions.type, ['like', 'bookmark']),
          inArray(interactions.postId, postIds)
        )
      );
    for (const i of myInteractions) {
      if (!i.postId) continue;
      if (!userInteractions[i.postId])
        userInteractions[i.postId] = { liked: false, bookmarked: false };
      if (i.type === 'like') userInteractions[i.postId].liked = true;
      if (i.type === 'bookmark') userInteractions[i.postId].bookmarked = true;
    }
  }

  return {
    posts: items.map((p) => ({
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
    .where(
      and(
        eq(interactions.userId, userId),
        eq(interactions.postId, postId),
        eq(interactions.type, 'like')
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Unlike
    await db
      .delete(interactions)
      .where(
        and(
          eq(interactions.userId, userId),
          eq(interactions.postId, postId),
          eq(interactions.type, 'like')
        )
      );
    await db
      .update(posts)
      .set({ likeCount: sql`${posts.likeCount} - 1` })
      .where(eq(posts.id, postId));
    return { liked: false };
  } else {
    // Like
    await db.insert(interactions).values({ userId, postId, type: 'like' });
    await db
      .update(posts)
      .set({ likeCount: sql`${posts.likeCount} + 1` })
      .where(eq(posts.id, postId));
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
    .where(
      and(
        eq(interactions.userId, userId),
        eq(interactions.postId, postId),
        eq(interactions.type, 'bookmark')
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(interactions)
      .where(
        and(
          eq(interactions.userId, userId),
          eq(interactions.postId, postId),
          eq(interactions.type, 'bookmark')
        )
      );
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

  // Check if already reposted
  const existingRepost = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.authorId, userId), eq(posts.repostOfId, postId)))
    .limit(1);

  if (existingRepost.length > 0) {
    // Undo repost
    await db.delete(posts).where(eq(posts.id, existingRepost[0].id));
    await db
      .update(posts)
      .set({ repostCount: sql`${posts.repostCount} - 1` })
      .where(eq(posts.id, postId));
    return { reposted: false };
  }

  const [original] = await db
    .select({
      postType: posts.postType,
      content: posts.content,
      courseId: posts.courseId,
      topicTags: posts.topicTags,
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  if (!original) throw new Error('Post not found');

  await db.insert(posts).values({
    authorId: userId,
    postType: original.postType,
    content: original.content,
    courseId: original.courseId,
    topicTags: original.topicTags ?? [],
    repostOfId: postId,
    isVisible: true,
  });
  await db
    .update(posts)
    .set({ repostCount: sql`${posts.repostCount} + 1` })
    .where(eq(posts.id, postId));
  return { reposted: true };
});

const QuotePostInput = v.object({ postId: v.string(), body: v.string() });

export const quotePost = command(QuotePostInput, async ({ postId, body }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const [newPost] = await db
    .insert(posts)
    .values({
      authorId: userId,
      postType: 'text',
      content: { body },
      quoteOfId: postId,
      isVisible: true,
    })
    .returning({ id: posts.id });

  await db
    .update(posts)
    .set({ repostCount: sql`${posts.repostCount} + 1` })
    .where(eq(posts.id, postId));
  await db.insert(xpEvents).values({ userId, eventType: 'post_created', xpAwarded: 5 });
  await db
    .update(users)
    .set({ xp: sql`${users.xp} + 5` })
    .where(eq(users.id, userId));

  return { postId: newPost.id };
});

// ─── Impressions ───────────────────────────────────────────────────────────────

export const recordImpression = command(PostIdInput, async ({ postId }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;

  await db
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(eq(posts.id, postId));

  if (userId) {
    await db.insert(interactions).values({ userId, postId, type: 'view' }).onConflictDoNothing();
  }

  return { ok: true };
});

// ─── Comments ─────────────────────────────────────────────────────────────────

const CreateCommentInput = v.object({ postId: v.string(), body: v.string() });

export const createComment = command(CreateCommentInput, async ({ postId, body }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  if (!body.trim() || body.length > 500) throw new Error('Invalid comment');

  const [comment] = await db
    .insert(posts)
    .values({
      authorId: userId,
      postType: 'text',
      content: { body },
      parentId: postId,
      isVisible: true,
    })
    .returning({ id: posts.id });

  await db
    .update(posts)
    .set({ replyCount: sql`${posts.replyCount} + 1` })
    .where(eq(posts.id, postId));
  await db.insert(xpEvents).values({ userId, eventType: 'post_created', xpAwarded: 2 });
  await db
    .update(users)
    .set({ xp: sql`${users.xp} + 2` })
    .where(eq(users.id, userId));

  return { commentId: comment.id };
});

const GetCommentsInput = v.object({
  postId: v.string(),
  cursor: v.optional(v.string()),
  limit: v.optional(v.number()),
});

export const getComments = query(GetCommentsInput, async ({ postId, cursor, limit = 20 }) => {
  const cursorCondition = cursor ? lt(posts.createdAt, new Date(cursor)) : undefined;

  const comments = await db
    .select({
      id: posts.id,
      content: posts.content,
      likeCount: posts.likeCount,
      replyCount: posts.replyCount,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
      authorName: users.displayName,
      authorUsername: users.username,
      authorImage: users.avatarUrl,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.parentId, postId), eq(posts.isVisible, true), cursorCondition))
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1);

  const hasMore = comments.length > limit;
  const items = hasMore ? comments.slice(0, limit) : comments;

  return {
    comments: items.map((c) => ({
      ...c,
      author: { name: c.authorName, username: c.authorUsername, image: c.authorImage },
      createdAt: c.createdAt?.toISOString() ?? new Date().toISOString(),
    })),
    nextCursor: hasMore ? items[items.length - 1].createdAt?.toISOString() : null,
  };
});

// ─── Moderation ────────────────────────────────────────────────────────────────

const ReportPostInput = v.object({
  postId: v.string(),
  reason: v.picklist([
    'spam',
    'harassment',
    'misinformation',
    'inappropriate',
    'plagiarism',
    'other',
  ]),
  details: v.optional(v.string()),
});

export const reportPost = command(ReportPostInput, async ({ postId, reason, details }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  await db.insert(reports).values({ reporterId: userId, postId, reason, details });
  // Flag the post for moderation review
  await db.update(posts).set({ isFlagged: true }).where(eq(posts.id, postId));

  return { ok: true };
});

export const mutePost = command(PostIdInput, async ({ postId }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  await db.insert(mutedPosts).values({ userId, postId }).onConflictDoNothing();
  return { muted: true };
});

export const muteUser = command(
  v.object({ targetUserId: v.string() }),
  async ({ targetUserId }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    await db.insert(mutes).values({ muterId: userId, mutedId: targetUserId }).onConflictDoNothing();
    return { muted: true };
  }
);

export const unmuteUser = command(
  v.object({ targetUserId: v.string() }),
  async ({ targetUserId }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    await db.delete(mutes).where(and(eq(mutes.muterId, userId), eq(mutes.mutedId, targetUserId)));
    return { muted: false };
  }
);

export const blockUser = command(
  v.object({ targetUserId: v.string() }),
  async ({ targetUserId }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    await db
      .insert(blocks)
      .values({ blockerId: userId, blockedId: targetUserId })
      .onConflictDoNothing();
    return { blocked: true };
  }
);

export const markNotInterested = command(PostIdInput, async ({ postId }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  await db.insert(notInterested).values({ userId, postId }).onConflictDoNothing();
  return { ok: true };
});

// ─── Create Post ───────────────────────────────────────────────────────────────

const CreatePostInput = v.object({
  postType: v.picklist(['text', 'image', 'video', 'short', 'quiz', 'flashcard', 'poll', 'link']),
  content: v.record(v.string(), v.unknown()),
  courseId: v.optional(v.string()),
  topicTags: v.optional(v.array(v.string())),
});

export const createPost = command(CreatePostInput, async (input) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const [post] = await db
    .insert(posts)
    .values({
      authorId: userId,
      postType: input.postType as any,
      content: input.content,
      courseId: input.courseId,
      topicTags: input.topicTags ?? [],
      isVisible: true,
    })
    .returning({ id: posts.id });

  // Award XP for posting
  await db.insert(xpEvents).values({ userId, eventType: 'post_created', xpAwarded: 5 });
  await db
    .update(users)
    .set({ xp: sql`${users.xp} + 5` })
    .where(eq(users.id, userId));

  return { postId: post.id };
});

// ─── Delete Post ───────────────────────────────────────────────────────────────

export const deletePost = command(v.object({ postId: v.string() }), async ({ postId }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const [post] = await db
    .select({ id: posts.id, authorId: posts.authorId })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!post) throw new Error('Post not found');
  if (post.authorId !== userId) throw new Error('You can only delete your own posts');

  await db.update(posts).set({ isVisible: false }).where(eq(posts.id, postId));

  await getFeed({}).refresh();
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
  const [post] = await db
    .select({ content: posts.content, courseId: posts.courseId })
    .from(posts)
    .where(eq(posts.id, input.postId))
    .limit(1);
  if (!post) throw new Error('Post not found');

  const content = post.content as any;
  const isCorrect = content.correctOptionId === input.optionId;
  const xpAwarded = isCorrect ? 10 : 2;

  // Record interaction with answer payload
  await db
    .insert(interactions)
    .values({
      userId,
      postId: input.postId,
      type: 'quiz_answer',
      payload: { optionId: input.optionId, isCorrect },
    })
    .onConflictDoNothing();

  // Award XP
  await db
    .insert(xpEvents)
    .values({ userId, eventType: isCorrect ? 'quiz_correct' : 'quiz_attempt', xpAwarded });
  await db
    .update(users)
    .set({ xp: sql`${users.xp} + ${xpAwarded}` })
    .where(eq(users.id, userId));

  // Update mastery if topic + course provided
  if (input.topic && (input.courseId ?? post.courseId)) {
    const cId = input.courseId ?? post.courseId!;
    await db
      .insert(topicMastery)
      .values({
        userId,
        courseId: cId,
        topic: input.topic,
        score: isCorrect ? 60 : 40,
        attempts: 1,
        correct: isCorrect ? 1 : 0,
      })
      .onConflictDoUpdate({
        target: [topicMastery.userId, topicMastery.courseId, topicMastery.topic],
        set: {
          score: isCorrect
            ? sql`LEAST(${topicMastery.score} + 5, 100)`
            : sql`GREATEST(${topicMastery.score} - 3, 0)`,
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

  await db
    .insert(interactions)
    .values({
      userId,
      postId: input.postId,
      type: 'flashcard_flip',
      payload: { known: input.known },
    })
    .onConflictDoNothing();

  await db.insert(xpEvents).values({ userId, eventType: 'flashcard_reviewed', xpAwarded });
  await db
    .update(users)
    .set({ xp: sql`${users.xp} + ${xpAwarded}` })
    .where(eq(users.id, userId));

  return { xpAwarded };
});

const PollVoteInput = v.object({ postId: v.string(), optionId: v.string() });

export const submitPollVote = command(PollVoteInput, async (input) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  await db
    .insert(interactions)
    .values({
      userId,
      postId: input.postId,
      type: 'poll_vote',
      payload: { optionId: input.optionId },
    })
    .onConflictDoNothing();

  return { success: true };
});
