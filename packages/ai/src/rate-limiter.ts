interface RateLimits {
  tutorMessagesPerDay: number;
  mockExamPerMonth: number;
  contentGenerationPerDay: number;
}

const LIMITS: Record<string, RateLimits> = {
  free:    { tutorMessagesPerDay: 10,  mockExamPerMonth: 1,  contentGenerationPerDay: 50 },
  premium: { tutorMessagesPerDay: 100, mockExamPerMonth: 20, contentGenerationPerDay: 500 },
  institutional: { tutorMessagesPerDay: 200, mockExamPerMonth: 50, contentGenerationPerDay: 1000 },
};

// Simple in-memory Map for single-instance or basic usage; can be swapped for Redis later
const counts = new Map<string, number>();

export async function checkAIRateLimit(userId: string, type: keyof RateLimits, plan: string) {
  const limit = LIMITS[plan]?.[type] ?? LIMITS.free[type];
  const period = type === 'mockExamPerMonth' ? 'month' : 'day';
  const key = `${userId}:${type}:${getTimePeriod(period)}`;

  const current = (counts.get(key) ?? 0) + 1;
  counts.set(key, current);

  if (current > limit) {
    const message = plan === 'free'
      ? `You've reached your ${type === 'tutorMessagesPerDay' ? 'daily AI tutor' : 'monthly mock exam'} limit. Upgrade to Premium for more.`
      : `Rate limit reached. Please try again later.`;
    throw new Error(message);
  }
  return current;
}

function getTimePeriod(type: 'day' | 'month') {
  const d = new Date();
  return type === 'day'
    ? d.toISOString().split('T')[0]
    : `${d.getFullYear()}-${d.getMonth()}`;
}

export const AI_COST_CONTROLS = {
  maxTokensPerRequest: {
    quiz:      512,
    flashcard: 256,
    text:      256,
    poll:      200,
    thread:    1024,
    mock_exam: 4096,
    tutor:     512,
    ocr:       2048,
  },
  fallbackThreshold: 429,
};
