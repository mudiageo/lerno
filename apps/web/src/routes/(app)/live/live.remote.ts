import { query, getRequestEvent, command } from '$app/server';
import { db } from '@lerno/db';
import { streams, users, userCourses } from '@lerno/db/schema';
import { desc, eq, and } from '@lerno/db/drizzle';
import * as v from 'valibot';
import { env } from '$env/dynamic/private';

// In a real app these come from env config
// We mock connection details unless overridden
const LIVEKIT_API_KEY = env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = env.LIVEKIT_API_SECRET || 'secret';
const LIVEKIT_URL = env.LIVEKIT_URL || 'wss://localhost:7880';

// We dynamically import livekit to prevent breaking dev builds if it isn't fully installed yet
let AccessToken: any;
try {
  const lk = await import('livekit-server-sdk');
  AccessToken = lk.AccessToken;
} catch (e) {
  console.warn("LiveKit Server SDK not fully loaded. Falling back to mock.");
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getLiveStreams = query(v.object({}), async () => {
  const activeStreams = await db
    .select({
      id: streams.id,
      title: streams.title,
      description: streams.description,
      thumbnailUrl: streams.thumbnailUrl,
      status: streams.status,
      viewerCount: streams.viewerCount,
      hostName: users.displayName,
      hostUsername: users.username,
      hostImage: users.avatarUrl,
      courseCode: userCourses.code,
    })
    .from(streams)
    .leftJoin(users, eq(streams.hostId, users.id))
    .leftJoin(userCourses, eq(streams.courseId, userCourses.id))
    .where(eq(streams.status, 'live'))
    .orderBy(desc(streams.viewerCount));

  return { activeStreams };
});

export const getStreamDetails = query(v.object({ streamId: v.string() }), async ({ streamId }) => {
  const [stream] = await db
    .select({
      id: streams.id,
      title: streams.title,
      description: streams.description,
      status: streams.status,
      roomId: streams.roomId,
      hostId: streams.hostId,
    })
    .from(streams)
    .where(eq(streams.id, streamId))
    .limit(1);

  if (!stream) throw new Error('Stream not found');
  return stream;
});

// ─── Commands ─────────────────────────────────────────────────────────────────

const StartStreamInput = v.object({
  title: v.string(),
  description: v.optional(v.string()),
  courseId: v.optional(v.string()),
});

export const startLiveStream = command(StartStreamInput, async (input) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  const username = event.locals?.user?.email?.split('@')[0] ?? 'Host';
  if (!userId) throw new Error('Not authenticated');

  const roomId = crypto.randomUUID();

  // Update or insert stream in DB
  const [stream] = await db.insert(streams).values({
    hostId: userId,
    title: input.title,
    description: input.description,
    courseId: input.courseId,
    roomId,
    status: 'live',
    provider: 'livekit',
    startedAt: new Date(),
  }).returning({ id: streams.id });

  // Generate LiveKit Host token
  let token = 'mock_host_token';
  if (AccessToken) {
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId,
      name: username,
    });
    at.addGrant({ roomJoin: true, room: roomId, canPublish: true, canSubscribe: true });
    token = await at.toJwt();
  }

  return { streamId: stream.id, roomId, token, url: LIVEKIT_URL };
});

const JoinStreamInput = v.object({ streamId: v.string() });

export const joinLiveStream = command(JoinStreamInput, async ({ streamId }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  const username = event.locals?.user?.email?.split('@')[0] ?? 'Viewer';
  if (!userId) throw new Error('Not authenticated');

  const [stream] = await db.select({ roomId: streams.roomId }).from(streams).where(eq(streams.id, streamId)).limit(1);
  if (!stream) throw new Error('Stream not found');

  let token = 'mock_viewer_token';
  if (AccessToken) {
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId,
      name: username,
    });
    at.addGrant({ roomJoin: true, room: stream.roomId, canPublish: false, canSubscribe: true });
    token = await at.toJwt();
  }

  return { token, url: LIVEKIT_URL, roomId: stream.roomId };
});

export const endLiveStream = command(v.object({ streamId: v.string() }), async ({ streamId }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // Verify host
  const [stream] = await db.select({ hostId: streams.hostId }).from(streams).where(eq(streams.id, streamId)).limit(1);
  if (stream?.hostId !== userId) throw new Error('Not authorized');

  await db.update(streams).set({ status: 'ended', endedAt: new Date() }).where(eq(streams.id, streamId));

  return { success: true };
});
