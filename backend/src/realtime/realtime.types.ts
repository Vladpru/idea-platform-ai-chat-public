
export enum RealtimeTransport {
  Direct = 'direct',
  Redis = 'redis',
}

export const REALTIME_NAMESPACES = {
  LIVE_CHAT: 'live-chat',
  ROOT: 'root',
} as const;

export type RealtimeNamespace =
  (typeof REALTIME_NAMESPACES)[keyof typeof REALTIME_NAMESPACES];

export interface RealtimeTarget {
  namespace: RealtimeNamespace;
  room: string;
}

export interface RealtimeSocketTarget {
  namespace: RealtimeNamespace;
  sid: string;
}

export const realtimeOutboundEventName = (
  namespace: RealtimeNamespace,
): string => `realtime.outbound.${namespace}`;

export interface RealtimeOutboundEvent {
  room: string;
  event: string;
  payload: unknown;
}

export const EDGE_DOWNSTREAM_STREAM = 'edge:downstream';
export const EDGE_DOWNSTREAM_MAXLEN = 100_000;

export interface DownstreamEnvelope {
  v: 1;
  namespace: RealtimeNamespace;
  target: { type: 'room'; room: string } | { type: 'sid'; sid: string };
  event: string;
  payload: unknown;
  meta: { id: string; ts: string; source: 'monolith' };
}

export const EDGE_UPSTREAM_STREAM = 'edge:upstream';
export const EDGE_UPSTREAM_DLQ_STREAM = 'edge:upstream:dlq';
export const EDGE_UPSTREAM_MAXLEN = 100_000;

export const MONOLITH_CONSUMER_GROUP = 'monolith';

export const UPSTREAM_EVENTS = {
  ROOM_REQUEST_JOIN: 'room:request_join',
  MESSAGE_SEND: 'message:send',
} as const;

export const ROOM_CONTROL_EVENTS = {
  JOIN_APPROVED: 'room:join_approved',
  JOIN_DENIED: 'room:join_denied',
} as const;

export interface UpstreamEnvelope {
  v: number;
  event: string;
  userId: string;
  sid?: string;
  clientMsgId: string;
  payload: unknown;
  meta?: { id: string; ts: string; source: string; worker?: string };
}
