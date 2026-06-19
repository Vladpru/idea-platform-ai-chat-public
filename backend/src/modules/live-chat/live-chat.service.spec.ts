import { RealtimePublisherService } from '../../realtime/realtime-publisher.service';
import { REALTIME_NAMESPACES } from '../../realtime/realtime.types';
import { SendLiveChatMessagePayloadDto } from './dto/send-live-chat-message.dto';
import { liveChatRoomName } from './live-chat.constants';
import { LiveChatService } from './live-chat.service';
import type { LiveChatMessageDto } from './types/live-chat.types';

describe('LiveChatService.processInboundMessage', () => {
  const roomId = '11111111-1111-1111-1111-111111111111';
  const userId = 'user-1';
  const clientMessageId = '22222222-2222-2222-2222-222222222222';

  const buildPayload = (): SendLiveChatMessagePayloadDto =>
    ({
      roomId,
      clientMessageId,
      content: 'hello',
    }) as SendLiveChatMessagePayloadDto;

  const buildMessage = (): LiveChatMessageDto => ({
    id: 'server-id-1',
    roomId,
    clientMessageId,
    content: 'hello',
    attachmentUrl: null,
    attachmentName: null,
    attachmentMimeType: null,
    author: { id: userId, firstName: 'A', lastName: 'B', avatarUrl: null },
    createdAt: new Date().toISOString(),
  });

  function buildService(): { service: LiveChatService; publish: jest.Mock } {
    const publish = jest.fn();
    const publisher = {
      publish,
    } as unknown as RealtimePublisherService;
    const service = new LiveChatService(
      undefined as never, // liveChatRepository
      undefined as never, // videoCallRepository
      undefined as never, // entityVisibility
      undefined as never, // rateLimit
      undefined as never, // eventEmitter
      undefined as never, // cloudinary
      publisher,
    );
    return { service, publish };
  }

  const expectedTarget = {
    namespace: REALTIME_NAMESPACES.LIVE_CHAT,
    room: liveChatRoomName(roomId),
  };

  it('broadcasts a newly persisted message to the room', async () => {
    const { service, publish } = buildService();
    const message = buildMessage();
    jest
      .spyOn(service, 'sendMessage')
      .mockResolvedValue({ message, isDuplicate: false });

    await service.processInboundMessage(userId, buildPayload());

    expect(publish).toHaveBeenCalledWith(expectedTarget, 'message', message);
  });

  it('still broadcasts a deduped (re-sent) message so the client can reconcile', async () => {
    const { service, publish } = buildService();
    const message = buildMessage();
    jest
      .spyOn(service, 'sendMessage')
      .mockResolvedValue({ message, isDuplicate: true });

    await service.processInboundMessage(userId, buildPayload());

    expect(publish).toHaveBeenCalledWith(expectedTarget, 'message', message);
  });
});
