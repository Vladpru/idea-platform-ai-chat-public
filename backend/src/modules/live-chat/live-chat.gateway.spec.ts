import type { WsAuthService } from '../../ws-auth/ws-auth.service';
import { liveChatRoomName } from './live-chat.constants';
import { LiveChatGateway } from './live-chat.gateway';
import type { AuthenticatedLiveChatSocket } from './live-chat.gateway';
import type { LiveChatService } from './live-chat.service';

describe('LiveChatGateway.handleJoinRoom', () => {
  const roomId = '11111111-1111-1111-1111-111111111111';

  function build(assertRoomAccess: jest.Mock, userId?: string) {
    const liveChat = { assertRoomAccess } as unknown as LiveChatService;
    const wsAuth = {} as unknown as WsAuthService;
    const gateway = new LiveChatGateway(wsAuth, liveChat);
    const join = jest.fn().mockResolvedValue(undefined);
    const emit = jest.fn();
    const client = {
      data: { userId },
      join,
      emit,
    } as unknown as AuthenticatedLiveChatSocket;
    return { gateway, client, join, emit };
  }

  it('joins the room and emits room:join_approved when access is granted', async () => {
    const { gateway, client, join, emit } = build(
      jest.fn().mockResolvedValue(undefined),
      'user-1',
    );

    await gateway.handleJoinRoom(client, { roomId });

    expect(join).toHaveBeenCalledWith(liveChatRoomName(roomId));
    expect(emit).toHaveBeenCalledWith('room:join_approved', { roomId });
  });

  it('emits room:join_denied and does not join when access is refused', async () => {
    const { gateway, client, join, emit } = build(
      jest.fn().mockRejectedValue(new Error('forbidden')),
      'user-1',
    );

    await gateway.handleJoinRoom(client, { roomId });

    expect(join).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith('room:join_denied', {
      roomId,
      reason: 'Access denied',
    });
  });

  it('emits room:join_denied when the socket is unauthenticated', async () => {
    const assertRoomAccess = jest.fn();
    const { gateway, client, emit } = build(assertRoomAccess);

    await gateway.handleJoinRoom(client, { roomId });

    expect(assertRoomAccess).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith('room:join_denied', {
      roomId,
      reason: 'Unauthorized',
    });
  });
});
