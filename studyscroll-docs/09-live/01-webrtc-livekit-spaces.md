# Live Streaming — WebRTC from Scratch + LiveKit Fallback

## Strategy

Build a custom WebRTC implementation using **mediasoup** as the SFU (Selective Forwarding Unit). This runs on a Render worker. If the custom SFU has issues in production, swap to **LiveKit** by changing a single environment variable — the client code uses an abstracted `LiveProvider` interface.

```
HOST BROWSER          RENDER (mediasoup SFU)        VIEWER BROWSERS
    │                         │                           │
    │── HTTPS offer ─────────▶│                           │
    │◀─ answer ───────────────│                           │
    │── ICE candidates ───────▶│                          │
    │   [WebRTC connected]    │                           │
    │── RTP video/audio ──────▶│                          │
    │                         │── forward RTP ────────────▶│
    │                         │   (no transcoding)         │
    │                         │── forward RTP ────────────▶│
    │                         │                           │
SvelteKit API:  POST /api/live/room  →  creates mediasoup Room
                GET  /api/live/room/:id/token  →  returns SFU params
```

---

## Custom WebRTC SFU (mediasoup)

### Server — mediasoup Worker

```typescript
// packages/jobs/src/live/sfu.ts
import mediasoup from 'mediasoup';
import type { Worker, Router, Transport, Producer, Consumer } from 'mediasoup/node/lib/types';

const workers: Worker[] = [];
let workerIndex = 0;

export async function initMediasoup() {
  // Create CPU-count workers
  const cpus = require('os').cpus().length;
  for (let i = 0; i < cpus; i++) {
    const worker = await mediasoup.createWorker({
      logLevel: 'warn',
      rtcMinPort: 20000,
      rtcMaxPort: 29999,
    });
    worker.on('died', () => {
      console.error('mediasoup worker died, respawning...');
      setTimeout(() => initMediasoup(), 2000);
    });
    workers.push(worker);
  }
  console.log(`[SFU] ${cpus} mediasoup workers started`);
}

function getWorker(): Worker {
  const worker = workers[workerIndex % workers.length];
  workerIndex++;
  return worker;
}

// Room = one live stream or Space
const rooms = new Map<string, {
  router: Router;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer[]>;
  transports: Map<string, Transport>;
}>();

export const MEDIA_CODECS: mediasoup.types.RtpCodecCapability[] = [
  { kind: 'audio', mimeType: 'audio/opus',   clockRate: 48000, channels: 2 },
  { kind: 'video', mimeType: 'video/VP8',    clockRate: 90000 },
  { kind: 'video', mimeType: 'video/H264',   clockRate: 90000,
    parameters: { 'packetization-mode': 1, 'profile-level-id': '42e01f' } },
];

export async function createRoom(roomId: string) {
  const router = await getWorker().createRouter({ mediaCodecs: MEDIA_CODECS });
  rooms.set(roomId, { router, producers: new Map(), consumers: new Map(), transports: new Map() });
  return { rtpCapabilities: router.rtpCapabilities };
}

export async function createWebRtcTransport(roomId: string, transportId: string) {
  const room = rooms.get(roomId);
  if (!room) throw new Error('Room not found');

  const transport = await room.router.createWebRtcTransport({
    listenIps: [{ ip: '0.0.0.0', announcedIp: process.env.SFU_ANNOUNCED_IP! }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 1_000_000,
  });

  room.transports.set(transportId, transport);

  return {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  };
}

export async function connectTransport(roomId: string, transportId: string, dtlsParameters: any) {
  const room = rooms.get(roomId);
  const transport = room?.transports.get(transportId);
  if (!transport) throw new Error('Transport not found');
  await transport.connect({ dtlsParameters });
}

export async function produce(roomId: string, transportId: string, kind: any, rtpParameters: any) {
  const room = rooms.get(roomId);
  const transport = room?.transports.get(transportId);
  if (!transport || !room) throw new Error('Transport not found');

  const producer = await transport.produce({ kind, rtpParameters });
  room.producers.set(producer.id, producer);

  // Update viewer count in DB
  await updateStreamViewerCount(roomId);

  return { id: producer.id };
}

export async function consume(roomId: string, transportId: string, producerId: string, rtpCapabilities: any) {
  const room = rooms.get(roomId);
  const transport = room?.transports.get(transportId);
  if (!transport || !room) throw new Error('Transport not found');

  if (!room.router.canConsume({ producerId, rtpCapabilities })) {
    throw new Error('Cannot consume');
  }

  const consumer = await transport.consume({
    producerId, rtpCapabilities, paused: true,
  });

  const consumers = room.consumers.get(transportId) ?? [];
  consumers.push(consumer);
  room.consumers.set(transportId, consumers);

  return {
    id: consumer.id,
    producerId,
    kind: consumer.kind,
    rtpParameters: consumer.rtpParameters,
  };
}

export function closeRoom(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.router.close();
  rooms.delete(roomId);
}
```

### SFU API Route

```typescript
// src/routes/api/live/[action]/+server.ts
import { json } from '@sveltejs/kit';
import { createRoom, createWebRtcTransport, connectTransport, produce, consume } from '$jobs/live/sfu';

export async function POST({ params, request, locals }) {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  switch (params.action) {
    case 'create-room':
      return json(await createRoom(body.roomId));
    case 'create-transport':
      return json(await createWebRtcTransport(body.roomId, body.transportId));
    case 'connect-transport':
      await connectTransport(body.roomId, body.transportId, body.dtlsParameters);
      return json({ ok: true });
    case 'produce':
      return json(await produce(body.roomId, body.transportId, body.kind, body.rtpParameters));
    case 'consume':
      return json(await consume(body.roomId, body.transportId, body.producerId, body.rtpCapabilities));
    default:
      return json({ error: 'Unknown action' }, { status: 400 });
  }
}
```

---

## LiveKit Fallback

```typescript
// packages/jobs/src/live/livekit.ts
import { AccessToken } from 'livekit-server-sdk';

export async function createLiveKitRoom(roomId: string) {
  const res = await fetch(`${process.env.LIVEKIT_URL}/twirp/livekit.RoomService/CreateRoom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${generateAdminToken()}`,
    },
    body: JSON.stringify({
      name: roomId,
      emptyTimeout: 300,     // close after 5 min empty
      maxParticipants: 1000,
    }),
  });
  return res.json();
}

export function generateLiveKitToken(roomId: string, userId: string, isHost: boolean) {
  const at = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, {
    identity: userId,
    ttl: '2h',
  });
  at.addGrant({
    roomJoin: true,
    room: roomId,
    canPublish: isHost,
    canSubscribe: true,
    canPublishData: true,
  });
  return at.toJwt();
}
```

### Switching Between SFU and LiveKit

```typescript
// src/lib/server/remote/live.ts
export const getRoomToken = query(async ({ streamId, userId }) => {
  const stream = await db.query.streams.findFirst({ where: eq(streams.id, streamId) });
  const isHost = stream?.hostId === userId;

  // Switch based on env var — change LIVE_PROVIDER=livekit to use LiveKit
  if (process.env.LIVE_PROVIDER === 'livekit') {
    const token = generateLiveKitToken(stream!.roomId!, userId, isHost);
    return {
      provider: 'livekit' as const,
      token,
      url: process.env.LIVEKIT_URL!,
    };
  }

  // Default: custom mediasoup
  return {
    provider: 'custom' as const,
    sfuUrl: process.env.SFU_URL ?? '/api/live',
    roomId: stream!.roomId!,
    isHost,
  };
});

export const startStream = command(async ({ userId, courseId, title, description, isAudioOnly }) => {
  const roomId = `room_${crypto.randomUUID()}`;

  // Create room on SFU
  if (process.env.LIVE_PROVIDER !== 'livekit') {
    await createRoom(roomId);
  } else {
    await createLiveKitRoom(roomId);
  }

  const [stream] = await db.insert(streams).values({
    hostId: userId,
    courseId,
    title,
    description,
    status: 'live',
    provider: process.env.LIVE_PROVIDER === 'livekit' ? 'livekit' : 'custom_webrtc',
    roomId,
    isAudioOnly,
    startedAt: new Date(),
  }).returning();

  return { stream };
});
```

---

## Stream Host UI

```svelte
<!-- src/lib/components/live/StreamHost.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getRoomToken, endStream } from '$lib/server/remote/live';

  let { stream, user } = $props();
  let localStream: MediaStream | null = $state(null);
  let isLive = $state(false);
  let viewerCount = $state(0);

  let device: any;
  let sendTransport: any;
  let videoProducer: any;
  let audioProducer: any;

  onMount(async () => {
    const { Device } = await import('mediasoup-client');
    const tokenData = await getRoomToken({ streamId: stream.id, userId: user.id });

    // Get camera/mic
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, frameRate: 30 },
      audio: true,
    });

    if (tokenData.provider === 'livekit') {
      await connectLiveKit(tokenData);
    } else {
      await connectCustomSFU(tokenData, localStream!, Device);
    }

    isLive = true;

    // Poll viewer count
    const pollInterval = setInterval(async () => {
      const s = await db.query.streams.findFirst({ where: eq(streams.id, stream.id) });
      viewerCount = s?.viewerCount ?? 0;
    }, 10_000);

    return () => clearInterval(pollInterval);
  });

  async function connectCustomSFU(tokenData: any, mediaStream: MediaStream, Device: any) {
    // Load mediasoup device capabilities
    const { rtpCapabilities } = await fetch('/api/live/create-room', {
      method: 'POST', body: JSON.stringify({ roomId: tokenData.roomId }),
    }).then(r => r.json());

    device = new Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });

    // Create send transport
    const transportData = await fetch('/api/live/create-transport', {
      method: 'POST',
      body: JSON.stringify({ roomId: tokenData.roomId, transportId: crypto.randomUUID() }),
    }).then(r => r.json());

    sendTransport = device.createSendTransport(transportData);
    sendTransport.on('connect', async ({ dtlsParameters }: any, callback: any) => {
      await fetch('/api/live/connect-transport', {
        method: 'POST',
        body: JSON.stringify({ roomId: tokenData.roomId, transportId: sendTransport.id, dtlsParameters }),
      });
      callback();
    });
    sendTransport.on('produce', async ({ kind, rtpParameters }: any, callback: any) => {
      const { id } = await fetch('/api/live/produce', {
        method: 'POST',
        body: JSON.stringify({ roomId: tokenData.roomId, transportId: sendTransport.id, kind, rtpParameters }),
      }).then(r => r.json());
      callback({ id });
    });

    // Produce tracks
    const videoTrack = mediaStream.getVideoTracks()[0];
    const audioTrack = mediaStream.getAudioTracks()[0];
    if (videoTrack) videoProducer = await sendTransport.produce({ track: videoTrack });
    if (audioTrack) audioProducer = await sendTransport.produce({ track: audioTrack });
  }

  async function stop() {
    videoProducer?.close();
    audioProducer?.close();
    localStream?.getTracks().forEach(t => t.stop());
    await endStream({ streamId: stream.id, userId: user.id });
    isLive = false;
  }
</script>

<div class="relative h-screen bg-black flex flex-col">
  <!-- Local preview -->
  <video
    srcobject={localStream}
    autoplay muted playsinline
    class="flex-1 object-cover"
  />

  <!-- HUD -->
  <div class="absolute top-4 left-4 right-4 flex items-center justify-between">
    {#if isLive}
      <span class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-sm font-bold">
        <span class="size-2 rounded-full bg-white animate-pulse" />
        LIVE · {viewerCount}
      </span>
    {/if}
    <button onclick={stop}
            class="px-4 py-1.5 rounded-full bg-white/20 text-white text-sm hover:bg-white/30 transition-colors">
      End Stream
    </button>
  </div>
</div>
```

---

## Spaces (Audio-Only Rooms)

```svelte
<!-- src/lib/components/live/SpaceRoom.svelte -->
<script lang="ts">
  let { space, user } = $props();
  let participants = $state<Participant[]>([]);
  let speaking = $state<Set<string>>(new Set());
  let handRaised = $state(false);
  let muted = $state(true);

  // Same WebRTC connection as streams, but isAudioOnly=true
  // Audio-activity detection using AudioContext for "speaking" indicator

  async function toggleHand() {
    handRaised = !handRaised;
    // Signal via data channel / server
    await fetch('/api/live/raise-hand', {
      method: 'POST',
      body: JSON.stringify({ spaceId: space.id, userId: user.id, raised: handRaised }),
    });
  }
</script>

<div class="p-6 min-h-screen bg-[--color-bg]">
  <div class="max-w-md mx-auto space-y-6">
    <h1 class="text-xl font-bold">{space.title}</h1>

    <!-- Participant grid -->
    <div class="grid grid-cols-4 gap-3">
      {#each participants as p}
        <div class="flex flex-col items-center gap-1">
          <div class="relative">
            <img src={p.avatarUrl} alt={p.displayName}
                 class="size-14 rounded-full object-cover
                         {speaking.has(p.id) ? 'ring-3 ring-brand-500 ring-offset-2' : ''}" />
            {#if p.muted}<span class="absolute -bottom-1 -right-1 text-xs">🔇</span>{/if}
          </div>
          <span class="text-xs text-[--color-text-muted] truncate max-w-[56px]">{p.displayName}</span>
        </div>
      {/each}
    </div>

    <!-- Controls -->
    <div class="flex items-center justify-center gap-4 pt-4">
      <button onclick={() => muted = !muted}
              class="size-14 rounded-full flex items-center justify-center text-xl
                     {muted ? 'bg-[--color-bg-overlay]' : 'bg-brand-500'}">
        {muted ? '🔇' : '🎤'}
      </button>
      <button onclick={toggleHand}
              class="size-14 rounded-full flex items-center justify-center text-xl
                     {handRaised ? 'bg-yellow-500' : 'bg-[--color-bg-overlay]'}">
        ✋
      </button>
      <button class="size-14 rounded-full bg-red-500 flex items-center justify-center text-white text-xl">
        📵
      </button>
    </div>
  </div>
</div>
```
