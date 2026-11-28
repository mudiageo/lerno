/**
 * Curriculum Bootstrap — PDF/Drive input, local privacy pass, structured
 * Firebase AI Logic extraction, editable preview, then an explicit confirm.
 */

import { browser } from '$app/env';
import { COURSE_EXTRACTION_SCHEMA, generateWithFirebaseAI, type HybridImage } from './firebase';
import { maskObviousIdentifiers, runPrivatePass, type PrivatePassResult } from './privacy';
import { recordInference } from './cache';

export interface ExtractedCourse {
  code: string;
  title: string;
  units?: number;
  outline?: string;
  topics: string[];
}

export interface CurriculumResult {
  courses: ExtractedCourse[];
  privatePass: PrivatePassResult;
  source: 'on_device' | 'in_cloud' | 'unknown';
  pageCount: number;
  usedPageImages: number;
}

export interface PdfExtraction {
  text: string;
  images: HybridImage[];
  pageCount: number;
}

/** Accepts only pasted public Google Drive links; no OAuth or API key. */
export function parseGoogleDriveFileId(input: string): string | null {
  const value = input.trim();
  if (!/^https?:\/\/(drive|docs)\.google\.com\//i.test(value)) return null;

  const patterns = [/\/file\/d\/([^/?#]+)/i, /\/d\/([^/?#]+)/i, /[?&]id=([^&?#]+)/i];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  return null;
}

/** Browser-side PDF text extraction. Scanned pages become on-device images. */
export async function extractPdf(file: File): Promise<PdfExtraction> {
  if (!browser) throw new Error('PDFs are read in the browser only.');
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Choose a PDF prospectus or curriculum.');
  }

  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const texts: string[] = [];
  const images: HybridImage[] = [];
  const pageCount = Math.min(document.numPages, 12);

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    texts.push(pageText);

    // Scanned prospectuses have little text layer. Keep only a few pages so
    // the on-device multimodal call stays small.
    if (pageText.length < 80 && images.length < 3) {
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const context = canvas.getContext('2d');
      if (context) {
        await page.render({ canvasContext: context, canvas, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        images.push({
          mimeType: 'image/jpeg',
          data: dataUrl.slice(dataUrl.indexOf(',') + 1),
        });
      }
    }
  }

  await document.destroy();
  return { text: texts.join('\n\n').slice(0, 40_000), images, pageCount: document.numPages };
}

export async function fetchGoogleDriveText(link: string): Promise<PdfExtraction> {
  const id = parseGoogleDriveFileId(link);
  if (!id) {
    throw new Error(
      'Paste a public Google Drive file link, e.g. drive.google.com/file/d/<id>/view'
    );
  }

  const response = await fetch(
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}&confirm=t`
  );
  if (!response.ok) {
    throw new Error(
      'Could not download that file. Check that it is shared with anyone with the link.'
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('pdf')) {
    const blob = await response.blob();
    return extractPdf(new File([blob], 'drive-curriculum.pdf', { type: 'application/pdf' }));
  }

  return { text: (await response.text()).slice(0, 40_000), images: [], pageCount: 0 };
}

function normaliseCourses(value: unknown): ExtractedCourse[] {
  const raw = (value as { courses?: unknown } | undefined)?.courses;
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => {
      const topics = Array.isArray(item.topics)
        ? item.topics.filter((topic): topic is string => typeof topic === 'string')
        : [];
      const outline = typeof item.outline === 'string' ? item.outline.trim() : '';
      return {
        code: String(item.code ?? '')
          .trim()
          .toUpperCase()
          .slice(0, 20),
        title: String(item.title ?? '').trim(),
        units: typeof item.units === 'number' ? Math.round(item.units) : undefined,
        outline,
        topics:
          topics.length > 0
            ? topics
            : outline
                .split(/[,;]/)
                .map((t) => t.trim())
                .filter(Boolean),
      };
    })
    .filter((course) => course.code && course.title)
    .slice(0, 16);
}

export async function extractCurriculum(input: {
  text: string;
  images?: HybridImage[];
  pageCount?: number;
}): Promise<CurriculumResult> {
  let workingText = input.text.trim();
  const images = input.images ?? [];
  let usedPageImages = 0;

  // Scanned pages are transcribed on device and the original page images are
  // discarded before any cloud extraction. This keeps Private Pass honest:
  // only sanitised text is ever eligible to leave the browser.
  if (images.length > 0) {
    try {
      const transcription = await generateWithFirebaseAI({
        mode: 'private',
        systemInstruction:
          'You transcribe scanned course documents. Keep course codes and topic names exact.',
        prompt: 'Transcribe every course code, title and topic you can read in these pages.',
        images,
      });
      workingText = `${workingText}\n${transcription.text}`.trim();
      usedPageImages = images.length;
      recordInference(transcription.inferenceSource, 180_000 * images.length);
    } catch (error) {
      if (!workingText) {
        throw new Error(
          'Scanned pages need the on-device model to transcribe privately. Prepare the model or paste the curriculum text.'
        );
      }
      console.info('Skipping scanned pages because on-device transcription is unavailable.', error);
    }
  }

  if (!workingText) {
    throw new Error('No readable text found. Paste the curriculum text or add a page image.');
  }

  let privatePass: PrivatePassResult;
  try {
    privatePass = await runPrivatePass(workingText);
    recordInference(privatePass.inferenceSource, 1_200);
  } catch {
    const masked = maskObviousIdentifiers(workingText);
    privatePass = {
      safeText: masked.masked,
      keptLocal: masked.total,
      regexCounts: masked.counts,
      contextualRedactions: 0,
      inferenceSource: 'unknown',
      fallback: true,
    };
  }

  const result = await generateWithFirebaseAI({
    mode: 'balanced',
    systemInstruction:
      'You extract university course structures from prospectuses. Use only information in the provided text. Never invent course codes.',
    prompt: `Extract every course from this curriculum text. For each, return code, title, units, outline and topics.\n\n${privatePass.safeText.slice(0, 20_000)}`,
    responseJsonSchema: COURSE_EXTRACTION_SCHEMA,
  });

  const courses = normaliseCourses(result.json);
  if (courses.length === 0) {
    throw new Error('No courses were found. Add more of the prospectus text and try again.');
  }

  recordInference(result.inferenceSource, 3_200 * courses.length);

  return {
    courses,
    privatePass,
    source: result.inferenceSource,
    pageCount: input.pageCount ?? 0,
    usedPageImages,
  };
}
