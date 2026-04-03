# 🕒 Background Jobs Package (@lerno/jobs)

This package handles all asynchronous background processing and scheduled tasks using [pg-boss](https://github.com/jeremys/pg-boss).

## 🚀 Usage

Jobs are queued using the `boss` instance and processed by a separate worker.

### Queuing a Job
```typescript
import boss from '@lerno/jobs';

const jobId = await boss.send('generate-content', { prompt: '...' });
```

### Workers and Handlers
Worker entry point is [src/worker.ts](./src/worker.ts).
Handlers are located in `src/jobs/`:
- `generate-content`: AI-related processing and video generation.
- `send-email`: Notification processing via `@lerno/email`.
- `process-upload`: Asset optimization and storage management.
- `youtube`: Auto-fetching content updates.

## 🕒 Scheduled Tasks

Cron jobs are registered in [src/cron.ts](./src/cron.ts).
Example: Daily leaderboard refreshes or weekly email summaries.

## 🏗️ Structure

Components are organized in [src/lib/components/](./src/lib/components/):
- `ui/`: Fundamental atoms (Button, Card, Input).
- `layout/`: Shell components (Sidebar, TopNav, BottomNav).

## 🛠️ Development Rules for Agents

- **Idempotency**: All job handlers MUST be idempotent. If a job fails and retries, it should not cause duplicate side effects (e.g., sending two emails).
- **Graceful Failure**: Always wrap handler logic in try-catch blocks and log errors properly. pg-boss will handle retries based on configured policy.
- **Asynchronous Design**: Never block a handler with long-running synchronous code. Use `await` for all I/O bound operations.
- **Payload Validation**: Always validate the job payload at the start of the handler (e.g., using Valibot).
