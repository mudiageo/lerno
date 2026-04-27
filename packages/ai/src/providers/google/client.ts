import { GoogleGenAI } from '@google/genai';

/**
 * Shared client for Google GenAI services.
 * Reads GOOGLE_GENAI_API_KEY first, then falls back to GEMINI_API_KEY so both
 * the new providers and the legacy GeminiProvider can share the same env var.
 */
export class GoogleClient {
  private static instance: GoogleGenAI;

  static getInstance(): GoogleGenAI {
    if (!this.instance) {
      const apiKey = process.env.GOOGLE_GENAI_API_KEY ?? process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Neither GOOGLE_GENAI_API_KEY nor GEMINI_API_KEY is defined');
      }
      this.instance = new GoogleGenAI({ apiKey });
    }
    return this.instance;
  }
}
