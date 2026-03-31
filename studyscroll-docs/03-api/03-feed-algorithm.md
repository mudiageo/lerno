# Feed Algorithm — Scoring Engine & Adaptive Loop

## Architecture

The feed algorithm runs entirely server-side in a SvelteKit Remote Function. It is a **weighted scoring function** — no ML model required for v1. Scores are computed per-user per-request in PostgreSQL using a single optimized query.

---

## Scoring Formula

```
finalScore = 
  (courseRelevance   × 0.35) +
  (urgencyBoost      × 0.20) +
  (weakTopicBoost    × 0.20) +
  (engagementScore   × 0.12) +
  (recencyScore      × 0.08) +
  (varietyPenalty    × 0.05)
  
  × aiGate            (binary: 0 if aiEnabled=false and aiGenerated=true)
  × premiumGate       (binary: 0 if isPremium=true and user.plan='free')
```

---

## Factor Definitions

### 1. Course Relevance (35%)
```
courseRelevance = 1.0  if post.courseId IN user.activeCourseIds
               = 0.5  if post.courseId IS NULL (general content)  
               = 0.0  if post.courseId NOT IN user.activeCourseIds
```

### 2. Urgency Boost (20%)
Scales 0 → 1 as the next exam/assignment approaches.
```
daysUntilNextEvent = min(days until any event in user's course_schedule)

urgencyBoost = 
  if daysUntilNextEvent <= 1:   1.0
  if daysUntilNextEvent <= 3:   0.85
  if daysUntilNextEvent <= 7:   0.65
  if daysUntilNextEvent <= 14:  0.40
  otherwise:                    0.10

# Additionally, posts tagged with topics from the upcoming event get +0.2 bonus
```

### 3. Weak Topic Boost (20%)
```
for each topic in post.topicTags:
  mastery = topicMastery.score WHERE userId=user.id AND topic=topic
  if mastery < 30:  topicBoost = 1.0
  if mastery < 50:  topicBoost = 0.7
  if mastery < 70:  topicBoost = 0.4
  else:             topicBoost = 0.1

weakTopicBoost = max(topicBoost for all topics in post)
```

### 4. Engagement Score (12%)
```
rawEngagement = (likeCount × 1) + (replyCount × 2) + (repostCount × 3) + (viewCount × 0.1)
engagementScore = log10(rawEngagement + 1) / log10(maxEngagement + 1)  # normalized 0-1
```

### 5. Recency Score (8%)
```
ageHours = (now - post.createdAt) in hours
recencyScore = exp(-ageHours / 24)  # half-life of 24 hours
```

### 6. Variety Penalty (5%)
```
# Penalise same postType appearing > 3 times consecutively in the returned list
varietyPenalty = 1.0  (no penalty)
# Applied post-ranking during result assembly, not during SQL scoring
```

---

## Remote Function Implementation

```typescript
// apps/web/src/lib/server/remote/feed.ts
import { query } from '$app/server';
import { db } from '$db/client';
import { posts, userCourses, topicMastery, courseSchedule, interactions } from '$db/schema';
import { and, eq, inArray, notInArray, desc, sql, isNull, or } from 'drizzle-orm';
import type { User } from '$db/schema/users';

export const getFeed = query(async ({
  userId,
  cursor,
  limit = 20,
  mode = 'scroll',  // 'scroll' | 'watch' | 'study'
}: {
  userId: string;
  cursor?: string;
  limit?: number;
  mode?: 'scroll' | 'watch' | 'study';
}) => {
  // 1. Get user context
  const [user, activeCourses, upcomingEvents, masteryScores] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db.select().from(userCourses).where(and(eq(userCourses.userId, userId), eq(userCourses.active, true))),
    db.select().from(courseSchedule)
      .where(and(eq(courseSchedule.userId, userId), sql`scheduled_at > now()`))
      .orderBy(courseSchedule.scheduledAt)
      .limit(5),
    db.select().from(topicMastery).where(eq(topicMastery.userId, userId)),
  ]);

  const courseIds = activeCourses.map(c => c.id);
  const daysUntilNext = upcomingEvents.length > 0
    ? (new Date(upcomingEvents[0].scheduledAt).getTime() - Date.now()) / 86400000
    : 30;

  // 2. Build mastery lookup map
  const masteryMap = Object.fromEntries(
    masteryScores.map(m => [`${m.courseId}:${m.topic}`, m.score])
  );

  // 3. Get already-seen post IDs (last 200) to avoid re-showing
  const seenIds = await db.select({ postId: interactions.postId })
    .from(interactions)
    .where(and(
      eq(interactions.userId, userId),
      eq(interactions.type, 'view'),
      sql`created_at > now() - interval '7 days'`,
    ))
    .limit(200);

  // 4. Post type filter by mode
  const typeFilter = mode === 'watch'
    ? inArray(posts.postType, ['video', 'short'])
    : mode === 'study'
    ? inArray(posts.postType, ['quiz', 'flashcard', 'past_exam_q', 'mock_exam'])
    : notInArray(posts.postType, ['video', 'short', 'mock_exam']); // scroll mode

  // 5. Fetch candidate posts
  const candidates = await db.select().from(posts)
    .where(and(
      eq(posts.isVisible, true),
      eq(posts.isFlagged, false),
      typeFilter,
      isNull(posts.parentId),  // no replies in main feed
      or(
        inArray(posts.courseId, courseIds),
        isNull(posts.courseId),
      ),
      user?.aiEnabled === false ? eq(posts.aiGenerated, false) : undefined,
      cursor ? sql`created_at < ${cursor}` : undefined,
    ))
    .orderBy(desc(posts.createdAt))
    .limit(limit * 3);  // fetch 3x, score, return top N

  // 6. Score each candidate
  const scored = candidates.map(post => {
    const courseRelevance = courseIds.includes(post.courseId ?? '')
      ? 1.0 : post.courseId ? 0.0 : 0.5;

    const urgencyBoost = daysUntilNext <= 1 ? 1.0
      : daysUntilNext <= 3 ? 0.85
      : daysUntilNext <= 7 ? 0.65
      : daysUntilNext <= 14 ? 0.40 : 0.10;

    const weakTopicBoost = Math.max(
      ...(post.topicTags ?? []).map(topic => {
        const score = masteryMap[`${post.courseId}:${topic}`] ?? 50;
        return score < 30 ? 1.0 : score < 50 ? 0.7 : score < 70 ? 0.4 : 0.1;
      }),
      0.1,
    );

    const rawEng = (post.likeCount ?? 0) + (post.replyCount ?? 0) * 2 + (post.repostCount ?? 0) * 3;
    const engScore = Math.log10(rawEng + 1) / 5;  // rough normalize

    const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / 3600000;
    const recency = Math.exp(-ageHours / 24);

    const finalScore =
      courseRelevance * 0.35 +
      urgencyBoost    * 0.20 +
      weakTopicBoost  * 0.20 +
      engScore        * 0.12 +
      recency         * 0.08;

    return { post, score: finalScore };
  });

  // 7. Sort and apply variety enforcement
  scored.sort((a, b) => b.score - a.score);
  const result = applyVarietyEnforcement(scored.map(s => s.post), limit);

  // 8. Inject surprise question at positions 8, 21, 34
  return injectSurpriseQuestions(result, userId, courseIds);
});

function applyVarietyEnforcement(posts: Post[], limit: number): Post[] {
  const result: Post[] = [];
  const typeCount: Record<string, number> = {};
  
  for (const post of posts) {
    if (result.length >= limit) break;
    const recent = result.slice(-3).map(p => p.postType);
    const consecutiveType = recent.filter(t => t === post.postType).length;
    if (consecutiveType >= 3) continue;  // skip, try next
    typeCount[post.postType] = (typeCount[post.postType] ?? 0) + 1;
    result.push(post);
  }
  
  return result;
}
```

---

## Adaptive Quiz Failure Loop

When a user answers 3 consecutive quiz questions incorrectly on a topic, the next feed refresh inserts a "boost set" of 5 foundational posts for that topic before normal ranking resumes.

```typescript
// apps/web/src/lib/server/remote/quiz.ts
export const submitQuizAnswer = command(async ({
  userId, postId, selectedIndex, courseId, topic,
}) => {
  // Get post to check correct answer
  const post = await db.query.posts.findFirst({ where: eq(posts.id, postId) });
  const correct = post?.content?.correctIndex === selectedIndex;
  
  // Record interaction
  await db.insert(interactions).values({
    userId, postId, type: 'quiz_answer',
    payload: { selectedIndex, correct, timeMs: Date.now() },
  });
  
  // Update mastery using Bayesian update
  const current = await db.query.topicMastery.findFirst({
    where: and(
      eq(topicMastery.userId, userId),
      eq(topicMastery.courseId, courseId),
      eq(topicMastery.topic, topic),
    ),
  });
  
  const prevScore = current?.score ?? 50;
  const prevAttempts = current?.attempts ?? 0;
  // Simple Bayesian update: weighted average with learning rate
  const learningRate = 0.3;
  const newScore = prevScore + learningRate * ((correct ? 100 : 0) - prevScore);
  
  await db.insert(topicMastery).values({
    userId, courseId, topic,
    score: Math.round(newScore),
    attempts: prevAttempts + 1,
    correct: (current?.correct ?? 0) + (correct ? 1 : 0),
  }).onConflictDoUpdate({
    target: [topicMastery.userId, topicMastery.courseId, topicMastery.topic],
    set: { score: Math.round(newScore), attempts: prevAttempts + 1, correct: (current?.correct ?? 0) + (correct ? 1 : 0) },
  });
  
  // Award XP
  await db.insert(xpEvents).values({
    userId,
    eventType: correct ? 'quiz_correct' : 'quiz_incorrect',
    xpAwarded: correct ? 10 : 2,
    metadata: { postId, topic, courseId },
  });
  
  // Check consecutive failure threshold
  const recentAnswers = await db.select()
    .from(interactions)
    .where(and(
      eq(interactions.userId, userId),
      eq(interactions.type, 'quiz_answer'),
      sql`payload->>'topic' = ${topic}`,
      sql`created_at > now() - interval '1 hour'`,
    ))
    .orderBy(desc(interactions.createdAt))
    .limit(3);
  
  const consecutiveFails = recentAnswers.every(a => a.payload?.correct === false);
  
  return { correct, newMastery: Math.round(newScore), triggerBoost: consecutiveFails && recentAnswers.length === 3 };
});
```

---

## Surprise Question Injection

Surprise questions appear at feed positions 8, 21, 34, 55... (Fibonacci sequence). They test a topic the student just viewed in the preceding 5 posts.

```typescript
async function injectSurpriseQuestions(feedPosts: Post[], userId: string, courseIds: string[]) {
  const positions = [7, 20, 33, 54]; // 0-indexed
  const recentTopics = feedPosts.slice(0, 8).flatMap(p => p.topicTags ?? []);
  
  if (recentTopics.length === 0) return feedPosts;
  
  // Find a quiz post for one of the recent topics
  const surpriseQuestion = await db.select().from(posts)
    .where(and(
      eq(posts.postType, 'quiz'),
      eq(posts.isVisible, true),
      inArray(posts.courseId, courseIds),
      // Not one already in feed
      notInArray(posts.id, feedPosts.map(p => p.id)),
    ))
    .limit(1);
  
  if (!surpriseQuestion.length) return feedPosts;
  
  const result = [...feedPosts];
  // Mark as surprise so UI can show special treatment
  const tagged = { ...surpriseQuestion[0], isSurprise: true };
  
  for (const pos of positions) {
    if (pos < result.length) result.splice(pos, 0, tagged as any);
  }
  
  return result;
}
```
