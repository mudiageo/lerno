-- Materialized view for pre-scored posts (refreshed every 5 minutes by pg-boss)
CREATE MATERIALIZED VIEW IF NOT EXISTS post_scores AS
SELECT
  p.id,
  p.course_id,
  p.post_type,
  p.ai_generated,
  p.topic_tags,
  p.created_at,
  -- Engagement score (normalized)
  LOG(GREATEST(p.like_count + p.reply_count * 2 + p.repost_count * 3, 1)) / 10.0 AS engagement_score,
  -- Recency (exponential decay, half-life 24h)
  EXP(-EXTRACT(EPOCH FROM (now() - p.created_at)) / 86400.0) AS recency_score
FROM posts p
WHERE p.is_visible = true AND p.parent_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_scores_id ON post_scores(id);
CREATE INDEX IF NOT EXISTS idx_post_scores_course ON post_scores(course_id, recency_score DESC);
