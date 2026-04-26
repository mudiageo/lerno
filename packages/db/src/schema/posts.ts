import { pgTable, uuid, text, boolean, timestamp, integer, jsonb, pgEnum, index, customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { userCourses, courseMaterials } from './courses';
import { communities } from './communities';

export const postTypeEnum = pgEnum('post_type', [
  'text', 'image', 'video', 'quiz', 'flashcard', 'poll',
  'thread', 'short', 'link', 'past_exam_q', 'mock_exam',
]);

const customTsVector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  }
});

export const posts = pgTable('posts', {
  id:               uuid('id').primaryKey().defaultRandom(),
  authorId:         uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
  courseId:         uuid('course_id').references(() => userCourses.id, { onDelete: 'set null' }),
  communityId:      uuid('community_id').references(() => communities.id, { onDelete: 'set null' }),
  sourceMaterialId: uuid('source_material_id').references(() => courseMaterials.id, { onDelete: 'set null' }),
  parentId:         uuid('parent_id'),
  repostOfId:       uuid('repost_of_id'),
  quoteOfId:        uuid('quote_of_id'),
  postType:         postTypeEnum('post_type').notNull(),
  content:          jsonb('content').notNull(),
  topicTags:        text('topic_tags').array().default(sql`'{}'`),
  aiGenerated:      boolean('ai_generated').default(false),
  isVisible:        boolean('is_visible').default(true),
  isFlagged:        boolean('is_flagged').default(false),
  isPremium:        boolean('is_premium').default(false),
  likeCount:        integer('like_count').default(0),
  replyCount:       integer('reply_count').default(0),
  repostCount:      integer('repost_count').default(0),
  viewCount:        integer('view_count').default(0),
  engagementScore:  integer('engagement_score').default(0),
  searchVector:     customTsVector('search_vector').generatedAlwaysAs(sql`to_tsvector('english'::regconfig, coalesce(content->>'body', ''))`),
  createdAt:        timestamp('created_at').defaultNow(),
  updatedAt:        timestamp('updated_at').defaultNow(),
}, (t) => ({
  idx_posts_course_created: index('idx_posts_course_created').on(t.courseId, sql`${t.createdAt} DESC`),
  idx_posts_community: index('idx_posts_community').on(t.communityId, sql`${t.createdAt} DESC`),
  idx_posts_engagement: index('idx_posts_engagement').on(sql`${t.engagementScore} DESC`, sql`${t.createdAt} DESC`),
  idx_posts_author: index('idx_posts_author').on(t.authorId, sql`${t.createdAt} DESC`),
  idx_posts_visible: index('idx_posts_visible').on(t.isVisible).where(sql`${t.isVisible} = true`),
  idx_posts_type: index('idx_posts_type').on(t.postType),
  idx_posts_ai: index('idx_posts_ai').on(t.aiGenerated),
  idx_posts_tags: index('idx_posts_tags').using('gin', t.topicTags),
  idx_posts_search: index('idx_posts_search').using('gin', t.searchVector),
  idx_posts_trgm: index('idx_posts_trgm').using('gin', sql`(${t.content}->>'body') gin_trgm_ops`),
}));
