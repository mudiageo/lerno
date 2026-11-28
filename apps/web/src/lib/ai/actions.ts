/**
 * High-level hybrid actions used by Lerno's judged features.
 *
 * Every generation call goes through `generateWithFirebaseAI`. The old prompt
 * builders in `@lerno/ai/prompts` are reused verbatim; only the transport is
 * new.
 */

import {
  CONTENT_GENERATION_SYSTEM_PROMPT,
  buildFlashcardPrompt,
  buildTutorUserPrompt,
  TUTOR_SYSTEM_PROMPT,
} from '@lerno/ai/prompts';
import { SchemaType, type SchemaRequest } from 'firebase/ai';
import { browser } from '$app/env';
import {
  cacheStudyNote,
  getCachedStudyNote,
  recordInference,
  saveRevisionPack,
  type DataSavedStats,
  type RevisionCard,
  type RevisionPack,
} from './cache';
import { generateWithFirebaseAI, isOnDeviceSource, type HybridImage } from './firebase';
import { maskObviousIdentifiers, runPrivatePass, type PrivatePassResult } from './privacy';

const REVISION_PACK_SCHEMA: SchemaRequest = {
  type: SchemaType.OBJECT,
  properties: {
    cards: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          front: { type: SchemaType.STRING },
          back: { type: SchemaType.STRING },
          hint: { type: SchemaType.STRING },
          topicTags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ['front', 'back'],
      },
    },
  },
  required: ['cards'],
};

const MARK_SCHEMA: SchemaRequest = {
  type: SchemaType.OBJECT,
  properties: {
    extractedQuestion: { type: SchemaType.STRING },
    extractedAnswer: { type: SchemaType.STRING },
    verdict: { type: SchemaType.STRING },
    score: { type: SchemaType.INTEGER },
    feedback: { type: SchemaType.STRING },
    needsCloudReview: { type: SchemaType.BOOLEAN },
  },
  required: ['extractedQuestion', 'extractedAnswer', 'verdict', 'feedback'],
};

export interface GenerateRevisionPackInput {
  courseCode: string;
  topic: string;
  notes: string;
  cardCount?: number;
}

export interface InstantEnhancedAnswer {
  text: string;
  source: RevisionPack['inferenceSource'];
}

export interface InstantEnhancedResult {
  instant: InstantEnhancedAnswer;
  enhanced: InstantEnhancedAnswer;
  privatePass: PrivatePassResult;
}

export interface MarkResult {
  extractedQuestion: string;
  extractedAnswer: string;
  verdict: string;
  score?: number;
  feedback: string;
  firstSource: RevisionPack['inferenceSource'];
  escalatedToCloud: boolean;
}

function isOffline(): boolean {
  return browser && !navigator.onLine;
}

function asCards(value: unknown): RevisionCard[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      front: String(item.front ?? '').trim(),
      back: String(item.back ?? '').trim(),
      hint: typeof item.hint === 'string' ? item.hint.trim() : undefined,
      topicTags: Array.isArray(item.topicTags)
        ? item.topicTags.filter((tag): tag is string => typeof tag === 'string')
        : [],
    }))
    .filter((card) => card.front && card.back);
}

/** Regex first; on-device redaction when available; never leaks originals. */
async function prepareForCloud(text: string): Promise<PrivatePassResult> {
  try {
    const pass = await runPrivatePass(text);
    recordInference(pass.inferenceSource, 1_200);
    return pass;
  } catch {
    const masked = maskObviousIdentifiers(text);
    return {
      safeText: masked.masked,
      keptLocal: masked.total,
      regexCounts: masked.counts,
      contextualRedactions: 0,
      inferenceSource: 'unknown',
      fallback: true,
    };
  }
}

/**
 * Offline Revision Pack. With the page already loaded, turning off the network
 * switches this to ONLY_ON_DEVICE and caches the pack locally for later sync.
 */
export async function generateRevisionPack(
  input: GenerateRevisionPackInput
): Promise<RevisionPack> {
  const courseCode = input.courseCode.trim().toUpperCase() || 'GENERAL';
  const topic = input.topic.trim() || 'Key concepts';
  const cached = await getCachedStudyNote(courseCode, topic);
  const sourceNotes = input.notes.trim() || cached?.text || '';

  if (!sourceNotes) {
    throw new Error('Paste notes first. They are cached locally for offline revision.');
  }

  await cacheStudyNote({ courseCode, topic, text: sourceNotes });

  const basePrompt = buildFlashcardPrompt({
    courseCode,
    topic,
    context: sourceNotes.slice(0, 6_000),
  });
  const offline = isOffline();
  const result = await generateWithFirebaseAI({
    mode: offline ? 'private' : 'hybrid',
    systemInstruction: CONTENT_GENERATION_SYSTEM_PROMPT,
    prompt: `${basePrompt}\n\nReturn exactly ${Math.min(Math.max(input.cardCount ?? 3, 1), 6)} distinct cards as {"cards":[...]}.`,
    responseJsonSchema: REVISION_PACK_SCHEMA,
  });

  const cards = asCards((result.json as { cards?: unknown } | undefined)?.cards);
  if (cards.length === 0) {
    throw new Error('No flashcards came back. Try a shorter note or add more context.');
  }

  const pack: RevisionPack = {
    id: crypto.randomUUID(),
    courseCode,
    topic,
    cards,
    inferenceSource: result.inferenceSource,
    createdAt: new Date().toISOString(),
    synced: false,
  };

  await saveRevisionPack(pack);
  recordInference(result.inferenceSource, cards.length * 3_200);
  return pack;
}

/** One sanitised question, answered instantly on-device/cloud then enhanced in cloud. */
export async function generateInstantEnhanced(input: {
  question: string;
  courseCode: string;
  topic: string;
  masteryScore?: number;
}): Promise<InstantEnhancedResult> {
  if (!input.question.trim()) throw new Error('Ask a question first.');

  const privatePass = await prepareForCloud(input.question);
  const courseCode = input.courseCode.trim().toUpperCase() || 'GENERAL';
  const topic = input.topic.trim() || 'Course topic';
  const tutorPrompt = buildTutorUserPrompt({
    question: privatePass.safeText,
    courseCode,
    topic,
    masteryScore: input.masteryScore ?? 50,
  });

  const [instant, enhanced] = await Promise.all([
    generateWithFirebaseAI({
      mode: 'hybrid',
      systemInstruction: TUTOR_SYSTEM_PROMPT,
      prompt: tutorPrompt,
    }),
    generateWithFirebaseAI({
      mode: 'deep',
      systemInstruction: `${TUTOR_SYSTEM_PROMPT}\n\nFor this enhanced answer, be more rigorous: give a worked example and one exam trap to avoid.`,
      prompt: tutorPrompt,
    }),
  ]);

  recordInference(instant.inferenceSource, 2_400);
  recordInference(enhanced.inferenceSource, 2_400);

  return {
    instant: { text: instant.text, source: instant.inferenceSource },
    enhanced: { text: enhanced.text, source: enhanced.inferenceSource },
    privatePass,
  };
}

/** Snap-and-Mark: on-device image understanding first, cloud only when needed. */
export async function markPastQuestion(input: {
  image: HybridImage;
  answerKey: string;
  courseCode: string;
}): Promise<MarkResult> {
  const keyPass = await prepareForCloud(input.answerKey || 'Use the course answer key.');
  const result = await generateWithFirebaseAI({
    mode: isOffline() ? 'private' : 'hybrid',
    systemInstruction:
      'You are a careful exam marker. Read the question and handwritten answer in the image. Mark against the answer key. Be concise and fair. Return only the schema.',
    prompt: `Course: ${input.courseCode.trim().toUpperCase() || 'GENERAL'}\nAnswer key: ${keyPass.safeText}\n\nExtract the question and answer, then mark it. Set needsCloudReview to true if the handwriting is ambiguous or the answer is borderline.`,
    images: [input.image],
    responseJsonSchema: MARK_SCHEMA,
  });

  const parsed = (result.json ?? {}) as Record<string, unknown>;
  const base: MarkResult = {
    extractedQuestion: String(parsed.extractedQuestion ?? ''),
    extractedAnswer: String(parsed.extractedAnswer ?? ''),
    verdict: String(parsed.verdict ?? 'Needs review'),
    score: typeof parsed.score === 'number' ? parsed.score : undefined,
    feedback: String(parsed.feedback ?? ''),
    firstSource: result.inferenceSource,
    escalatedToCloud: false,
  };

  recordInference(result.inferenceSource, 180_000);

  if (parsed.needsCloudReview === true && isOnDeviceSource(result.inferenceSource)) {
    const review = await generateWithFirebaseAI({
      mode: 'deep',
      systemInstruction:
        'You are a senior examiner. Resolve this borderline mark in one short paragraph.',
      prompt: `Question: ${base.extractedQuestion}\nStudent answer: ${base.extractedAnswer}\nAnswer key: ${keyPass.safeText}\nInitial verdict: ${base.verdict}`,
    });
    base.feedback = `${base.feedback}\n\nExam review: ${review.text}`.trim();
    base.escalatedToCloud = true;
    recordInference(review.inferenceSource, 2_400);
  }

  return base;
}

export function currentDataSaved(): DataSavedStats {
  return recordInference('unknown', 0);
}
