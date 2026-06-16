import { registerAs } from '@nestjs/config';

function resolveHttpUrl(livekitUrl: string): string {
  if (livekitUrl.startsWith('wss://')) {
    return `https://${livekitUrl.slice('wss://'.length)}`;
  }

  if (livekitUrl.startsWith('ws://')) {
    return `http://${livekitUrl.slice('ws://'.length)}`;
  }

  return livekitUrl;
}

export default registerAs('livekit', () => {
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
  const webhookSecret = process.env.LIVEKIT_WEBHOOK_SECRET?.trim();
  const url = process.env.LIVEKIT_URL?.trim();

  if (!apiKey || !apiSecret || !webhookSecret || !url) {
    throw new Error(
      'LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_WEBHOOK_SECRET, and LIVEKIT_URL are required',
    );
  }

  return {
    apiKey,
    apiSecret,
    webhookSecret,
    url,
    httpUrl: resolveHttpUrl(url),
  };
});
