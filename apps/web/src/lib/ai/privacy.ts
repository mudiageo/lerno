/**
 * Private Pass — local first, then on-device AI. No original text is sent to
 * the cloud. If Gemini Nano is unavailable, the feature fails closed and the
 * UI can offer regex-only masking with no cloud augmentation.
 */

import { SchemaType, type SchemaRequest } from 'firebase/ai';
import { generateWithFirebaseAI } from './firebase';

export interface MaskCounts {
  email: number;
  phone: number;
  studentId: number;
  url: number;
}

export interface MaskResult {
  masked: string;
  counts: MaskCounts;
  total: number;
}

export interface PrivatePassResult {
  safeText: string;
  keptLocal: number;
  regexCounts: MaskCounts;
  contextualRedactions: number;
  inferenceSource: 'on_device' | 'in_cloud' | 'unknown';
  fallback: boolean;
}

const PATTERNS: Record<keyof MaskCounts, { regex: RegExp; token: string }> = {
  email: {
    regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    token: '[EMAIL]',
  },
  phone: {
    regex: /\b(?:\+\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)\d{3}[\s-]?\d{4}\b/g,
    token: '[PHONE]',
  },
  studentId: {
    regex: /\b(?:STU|REG|MAT|MATRIC|STUDENT)[-\s]?\d{4,}\b|\b\d{2,4}[/-]\d{4,}\b/gi,
    token: '[STUDENT_ID]',
  },
  url: {
    regex: /\b(?:https?:\/\/|www\.)[^\s]+/gi,
    token: '[LINK]',
  },
};

export const REDACTION_SCHEMA: SchemaRequest = {
  type: SchemaType.OBJECT,
  properties: {
    safeText: { type: SchemaType.STRING },
    redacted: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ['safeText', 'redacted'],
};

/** Deterministic local masking. Runs before any model call. */
export function maskObviousIdentifiers(input: string): MaskResult {
  let masked = input;
  const counts: MaskCounts = { email: 0, phone: 0, studentId: 0, url: 0 };

  for (const [kind, { regex, token }] of Object.entries(PATTERNS) as Array<
    [keyof MaskCounts, { regex: RegExp; token: string }]
  >) {
    masked = masked.replace(regex, () => {
      counts[kind] += 1;
      return token;
    });
  }

  return {
    masked,
    counts,
    total: counts.email + counts.phone + counts.studentId + counts.url,
  };
}

/**
 * Catches contextual names and addresses the regex cannot. Uses
 * `ONLY_ON_DEVICE`, so the original text never leaves the browser.
 */
export async function runPrivatePass(input: string): Promise<PrivatePassResult> {
  const obvious = maskObviousIdentifiers(input);
  if (!obvious.masked.trim()) {
    return {
      safeText: '',
      keptLocal: obvious.total,
      regexCounts: obvious.counts,
      contextualRedactions: 0,
      inferenceSource: 'unknown',
      fallback: false,
    };
  }

  const result = await generateWithFirebaseAI({
    mode: 'private',
    systemInstruction:
      'You are a privacy filter running entirely on this device. Replace student names, lecturer names, addresses and other identifying details with simple bracketed labels such as [NAME] or [LOCATION]. Preserve all academic meaning. Return only the schema.',
    prompt: `Redact identifying details from this study text:\n\n${obvious.masked}`,
    responseJsonSchema: REDACTION_SCHEMA,
  });

  const parsed = result.json as { safeText?: unknown; redacted?: unknown } | undefined;
  const safeText =
    typeof parsed?.safeText === 'string' && parsed.safeText.trim()
      ? parsed.safeText.trim()
      : obvious.masked;
  const redacted = Array.isArray(parsed?.redacted)
    ? parsed.redacted.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    safeText,
    keptLocal: obvious.total + redacted.length,
    regexCounts: obvious.counts,
    contextualRedactions: redacted.length,
    inferenceSource: result.inferenceSource,
    fallback: false,
  };
}
