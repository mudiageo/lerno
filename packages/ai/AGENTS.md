# 🧠 AI Provider Package (@lerno/ai)

This package handles all AI integrations for Lerno, including text, image, audio, and video generation.

## 🚀 Native Video Pipeline (Banana)

The "Banana" orchestrator automates educational video creation by stitching multiple AI services.

### Core Orchestrator
- [BananaOrchestrator](file:///c%3A/Users/Admin/lerno/packages/ai/src/orchestrator/banana.ts): Coordinates LLM planning, asset generation, and assembly.
  - `SinglePromptStrategy`: Faster, uses 3.1 Flash for one-shot JSON planning.
  - `StepByStepStrategy`: More detailed, plans in stages (Script -> Storyboard -> BGM).

### Provider Interfaces
1. [LlmProvider](file:///c%3A/Users/Admin/lerno/packages/ai/src/interfaces/llm.ts): Text & JSON generation (Native Gemini 3.1).
2. [ImageProvider](file:///c%3A/Users/Admin/lerno/packages/ai/src/interfaces/image.ts): Visual generation (Nano Banana).
3. [TtsProvider](file:///c%3A/Users/Admin/lerno/packages/ai/src/interfaces/tts.ts): Narration (Gemini TTS).
4. [AudioProvider](file:///c%3A/Users/Admin/lerno/packages/ai/src/interfaces/audio.ts): Background Music (Lyria).
5. [VideoGenerator](file:///c%3A/Users/Admin/lerno/packages/ai/src/interfaces/video.ts): Final assembly (FFmpeg).

### Environment Configuration
Switch between `google` and `simulated` using environment variables handled by the [ProviderFactory](file:///c%3A/Users/Admin/lerno/packages/ai/src/factory.ts):
- `AI_LLM_PROVIDER`
- `AI_IMAGE_PROVIDER`
- `AI_TTS_PROVIDER`
- `AI_AUDIO_PROVIDER`
- `AI_VIDEO_GENERATOR`

## 🛠️ Development Rules for Agents

- **Valibot ONLY**: Do NOT use `zod`. This package uses [Valibot](file:///c%3A/Users/Admin/lerno/package.json#L35) for schema validation.
- **Provider-Agnostic**: Always code against interfaces. Never reference `GeminiLlmProvider` directly outside the factory.
- **Storage**: Asset persistence MUST use `@lerno/storage`.
- **Engagement**: AI prompts MUST prioritize "viral-style" hooks (3s) and storytelling analogies.
- **UUIDs**: Use `crypto.randomUUID()` from `node:crypto`.
