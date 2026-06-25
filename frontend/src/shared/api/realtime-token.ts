import { api } from '@/shared/api/http';

type RealtimeTokenResponse = { token: string };

export async function fetchRealtimeAuthToken(): Promise<string> {
  const { data } = await api.get<RealtimeTokenResponse>('/token/ws');
  return data.token;
}
