# Post Types — Complete Specification

## Overview

StudyScroll supports 11 post types. All share a common base with a polymorphic `content` JSONB field that varies by type.

---

## Base Post Fields

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `authorId` | uuid? | null = AI-generated |
| `courseId` | uuid? | null = community/general |
| `parentId` | uuid? | Set for replies |
| `repostOfId` | uuid? | Set for reposts |
| `quoteOfId` | uuid? | Set for quote posts |
| `postType` | enum | One of 11 types |
| `content` | jsonb | Type-specific payload |
| `topicTags` | text[] | 1–5 topic tags |
| `aiGenerated` | bool | AI-created flag |
| `isVisible` | bool | Moderation gate |
| `isFlagged` | bool | Pending review |
| `isPremium` | bool | Premium-only |
| `likeCount` | int | Denormalized |
| `replyCount` | int | Denormalized |
| `repostCount` | int | Denormalized |
| `viewCount` | int | Denormalized |
| `engagementScore` | int | Computed by job |

---

## All 11 Types

### `text` — Simple Post
```typescript
interface TextContent {
  body: string;             // max 500 chars
  images?: { url: string; alt: string; width: number; height: number; blurHash?: string }[];
}
```
Rendering: Text + optional 2×2 image grid. Links auto-detected → OG card.

### `image` — Image-First Post
```typescript
interface ImageContent {
  images: PostImage[];      // 1–4, required
  body?: string;            // caption, max 200 chars
}
```

### `video` — Own-Platform Video
```typescript
interface VideoContent {
  title: string;
  description?: string;
  cloudflareStreamId: string;
  playbackUrl: string;       // HLS .m3u8
  thumbnailUrl: string;
  durationSecs: number;
}
```
Rendering: Thumbnail → click opens `/watch/:id` with `VideoPlayer` (hls.js).

### `short` — Short-Form Video (≤60s)
```typescript
interface ShortContent {
  caption?: string;
  cloudflareStreamId?: string;   // own platform
  playbackUrl?: string;
  youtubeId?: string;            // OR YouTube embed
  youtubeStartSeconds?: number;
  thumbnailUrl: string;
  durationSecs: number;          // max 60
}
```
Rendering: Card in Scroll mode → full Shorts swipe player on tap.

### `quiz` — Multiple Choice Question
```typescript
interface QuizContent {
  question: string;
  options: string[];         // exactly 4
  correctIndex: number;      // 0–3
  explanation: string;       // revealed after answer
  difficulty: 'easy' | 'medium' | 'hard';
  pastExamStyle?: boolean;
  marks?: number;
  source?: string;           // e.g. "WAEC 2019 Q3"
}
```
Rendering: 4 option buttons → tap → reveal correct/wrong → explanation → XP float → mastery update.

### `flashcard` — Spaced Repetition Card
```typescript
interface FlashcardContent {
  front: string;             // max 80 chars
  back: string;              // max 120 chars
  hint?: string;             // shown after 5s pause, max 40 chars
  cardType?: 'definition' | 'qa' | 'formula' | 'process';
}
```
Rendering: 3D flip card → "Got it / Didn't know" → FSRS schedule updated.

### `poll` — Community Poll
```typescript
interface PollContent {
  question: string;           // max 120 chars
  options: string[];          // 2–4 options
  endsAt: string;             // ISO 8601
  isKnowledgeTest?: boolean;
  correctIndex?: number;
  resultsVisible: 'after_vote' | 'after_end' | 'always';
}
```
Rendering: Vote buttons → animated results bar on vote.

### `thread` — Multi-Post Thread
```typescript
interface ThreadContent {
  body: string;              // first post, max 280 chars
  totalPosts: number;
  threadIds: string[];       // ordered reply IDs
}
```
Rendering: First post with "Show thread (N)" → expands inline.

### `link` — Shared Link / OG Card
```typescript
interface LinkContent {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  domain: string;
  body?: string;             // commentary, max 280 chars
}
```

### `past_exam_q` — Past Exam Question
```typescript
interface PastExamQContent {
  question: string;
  options?: string[];
  correctIndex?: number;
  markingScheme?: string;
  sampleAnswer?: string;
  year?: number;
  examBody?: string;         // "WAEC", "JAMB", "UNILAG 2023"
  marks?: number;
}
```
Rendering: Styled like exam paper with "Show Answer" toggle.

### `mock_exam` — Full AI Exam Paper
```typescript
interface MockExamContent {
  title: string;
  instructions: string;
  timeLimitMins: number;
  totalMarks: number;
  sections: Array<{
    title: string;
    instructions: string;
    questions: Array<{
      number: number;
      type: 'mcq' | 'short_answer' | 'essay' | 'calculation';
      question: string;
      options?: string[];
      correctIndex?: number;
      explanation?: string;
      markingScheme?: string;
      marks: number;
      difficulty: 'easy' | 'medium' | 'hard';
      topic: string;
    }>;
  }>;
}
```
Rendering: Full exam UI at `/study/mock-exam/:id` with timer, navigation, and auto-marking for MCQ sections. `isVisible = false` by default (private to creator).

---

## Valibot Content Schemas

```typescript
// packages/db/src/schema/content-validators.ts
import * as v from 'valibot';

export const QuizContentSchema = v.object({
  question: v.pipe(v.string(), v.minLength(10)),
  options: v.pipe(v.array(v.string()), v.length(4)),
  correctIndex: v.pipe(v.number(), v.minValue(0), v.maxValue(3)),
  explanation: v.pipe(v.string(), v.minLength(20)),
  difficulty: v.picklist(['easy', 'medium', 'hard']),
});

export const FlashcardContentSchema = v.object({
  front: v.pipe(v.string(), v.maxLength(80)),
  back: v.pipe(v.string(), v.maxLength(120)),
  hint: v.optional(v.pipe(v.string(), v.maxLength(40))),
});

export const PollContentSchema = v.object({
  question: v.pipe(v.string(), v.maxLength(120)),
  options: v.pipe(v.array(v.string()), v.minLength(2), v.maxLength(4)),
  endsAt: v.string(),
});

export const CONTENT_SCHEMAS = {
  text:      v.object({ body: v.pipe(v.string(), v.maxLength(500)) }),
  quiz:      QuizContentSchema,
  flashcard: FlashcardContentSchema,
  poll:      PollContentSchema,
} as const;

export function validatePostContent(postType: string, content: unknown) {
  const schema = CONTENT_SCHEMAS[postType as keyof typeof CONTENT_SCHEMAS];
  if (!schema) throw new Error(`Unknown post type: ${postType}`);
  return v.parse(schema, content);
}
```
