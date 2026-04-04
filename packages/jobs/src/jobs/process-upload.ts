import { storage } from '@lerno/storage';
import { ai, buildOCRExtractionPrompt } from '@lerno/ai';
import { db } from '@lerno/db';
import { courseMaterials, topicMastery } from '@lerno/db/schema';
import { eq } from '@lerno/db/drizzle';
import PgBoss from 'pg-boss';

export async function processUploadJob(job: { data: { materialId: string; boss: PgBoss } }) {
  const material = await db.query.courseMaterials.findFirst({
    where: eq(courseMaterials.id, job.data.materialId),
    with: { course: true },
  });
  if (!material) return;

  // 1. Download from R2
  const buffer = await storage.download(material.storageKey!);
  const base64 = buffer.toString('base64');

  // 2. OCR with Gemini Vision
  const extracted = await ai.generateWithVision({
    prompt: buildOCRExtractionPrompt({
      courseCode: material.course.code,
      courseTitle: material.course.title,
      extractedText: '',
    }),
    imageBase64: base64,
    mimeType: 'application/pdf',
  });

  const parsed = JSON.parse(extracted);

  // 3. Store extracted text
  await db.update(courseMaterials).set({
    ocrText: parsed.cleanedText,
    processed: true,
  }).where(eq(courseMaterials.id, material.id));

  // 4. Seed initial topic mastery entries for new topics
  for (const topic of parsed.topics) {
    await db.insert(topicMastery).values({
      userId: material.userId,
      courseId: material.courseId,
      topic,
      score: 50,
    }).onConflictDoNothing();
  }

  // 5. Queue content generation
  await job.data.boss.send('generate-content', { userId: material.userId, materialId: material.id });
}
