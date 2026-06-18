/**
 * Realtime transport contracts shared by the publisher and the gateway bridges.
 *
 * Phase 0 of the WebSocket strangler: NestJS still owns the Socket.IO servers,
 * but every outbound broadcast now flows through {@link RealtimePublisherService}
 * instead of touching `server.emit()` directly. The transport is selected at
 * runtime via the REALTIME_TRANSPORT env variable (default: `direct`).
 */

export enum RealtimeTransport {
  /** Re-emit in-process via EventEmitter2; the gateways perform the socket emit. */
  Direct = 'direct',
  /** Publish to the `edge:downstream` Redis stream for the future Python edge. */
  Redis = 'redis',
}

/**
 * Socket.IO namespace identifiers. `live-chat` is the namespaced gateway;
 * `root` is the default namespace used by the notification gateway.
 */
export const REALTIME_NAMESPACES = {
  LIVE_CHAT: 'live-chat',
  ROOT: 'root',
} as const;

export type RealtimeNamespace =
  (typeof REALTIME_NAMESPACES)[keyof typeof REALTIME_NAMESPACES];

/** A broadcast destination: a room within a specific Socket.IO namespace. */
export interface RealtimeTarget {
  namespace: RealtimeNamespace;
  room: string;
}

/**
 * Internal EventEmitter2 event name used by the `direct` transport to hand a
 * broadcast back to the gateway that owns the matching namespace server.
 */
export const realtimeOutboundEventName = (
  namespace: RealtimeNamespace,
): string => `realtime.outbound.${namespace}`;

/** Payload carried on the in-process bridge in `direct` mode. */
export interface RealtimeOutboundEvent {
  room: string;
  event: string;
  payload: unknown;
}

/** Redis stream consumed by the future FastAPI edge. */
export const EDGE_DOWNSTREAM_STREAM = 'edge:downstream';
export const EDGE_DOWNSTREAM_MAXLEN = 100_000;

/**
 * Envelope written to {@link EDGE_DOWNSTREAM_STREAM} in `redis` mode. The
 * `payload` is the domain DTO, forwarded verbatim to Socket.IO clients by the
 * edge. The edge never inspects it.
 */
export interface DownstreamEnvelope {
  v: 1;
  namespace: RealtimeNamespace;
  target: { type: 'room'; room: string };
  event: string;
  payload: unknown;
  meta: { id: string; ts: string; source: 'monolith' };
}
