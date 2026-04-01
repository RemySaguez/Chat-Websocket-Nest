import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  ForbiddenException,
  NotFoundException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { ToggleReactionDto } from './dto/toggle-reaction.dto';
type JwtPayload = {
  sub: string;
  email: string;
};

const GENERAL_ROOM_KEY = 'chat:general';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly typingUsers = new Map<
    string,
    { userId: string; username: string; roomKey: string }
  >();

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        client.disconnect();
        return;
      }
      const data = client.data as Record<string, unknown>;
      data.userId = user.id;
      data.username = user.username;
      data.activeRoomId = null;
      await client.join(GENERAL_ROOM_KEY);
      client.emit('chat:history', await this.chatService.getHistory(null, user.id));
      client.emit('chat:typing', this.getTypingNames(null));
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const roomId = this.getActiveRoomId(client);
    this.typingUsers.delete(client.id);
    this.server.to(this.toRoomKey(roomId)).emit('chat:typing', this.getTypingNames(roomId));
  }

  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ) {
    const userId = this.getUserId(client);
    if (!userId) {
      client.disconnect();
      return;
    }
    try {
      const history = await this.chatService.getHistory(dto.roomId, userId);
      const previousRoomId = this.getActiveRoomId(client);
      this.clearTypingForUser(userId, previousRoomId);
      this.server
        .to(this.toRoomKey(previousRoomId))
        .emit('chat:typing', this.getTypingNames(previousRoomId));
      await client.leave(this.toRoomKey(previousRoomId));
      await client.join(this.toRoomKey(dto.roomId));
      const data = client.data as Record<string, unknown>;
      data.activeRoomId = dto.roomId;
      client.emit('chat:history', history);
      client.emit('chat:typing', this.getTypingNames(dto.roomId));
    } catch (e) {
      if (e instanceof NotFoundException || e instanceof ForbiddenException) {
        client.emit('chat:error', 'Accès au salon impossible');
        return;
      }
      throw e;
    }
  }

  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @SubscribeMessage('chat:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateMessageDto,
  ) {
    const userId = this.getUserId(client);
    if (!userId) {
      client.disconnect();
      return;
    }
    const roomId = this.getActiveRoomId(client);
    try {
      this.clearTypingForUser(userId, roomId);
      this.server.to(this.toRoomKey(roomId)).emit('chat:typing', this.getTypingNames(roomId));
      const message = await this.chatService.createMessage(userId, dto.text, roomId);
      this.server.to(this.toRoomKey(roomId)).emit('chat:message', message);
      return message;
    } catch (e) {
      if (e instanceof NotFoundException || e instanceof ForbiddenException) {
        client.emit('chat:error', 'Message refusé');
        return;
      }
      throw e;
    }
  }

  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { typing?: boolean },
  ) {
    const userId = this.getUserId(client);
    const username = this.getUsername(client);
    if (!userId || !username) {
      client.disconnect();
      return;
    }
    const roomId = this.getActiveRoomId(client);
    if (body.typing) {
      this.typingUsers.set(client.id, {
        userId,
        username,
        roomKey: this.toRoomKey(roomId),
      });
    } else {
      this.typingUsers.delete(client.id);
    }
    this.server.to(this.toRoomKey(roomId)).emit('chat:typing', this.getTypingNames(roomId));
  }

  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @SubscribeMessage('chat:toggleReaction')
  async handleToggleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ToggleReactionDto,
  ) {
    const userId = this.getUserId(client);
    const username = this.getUsername(client);
    const roomId = this.getActiveRoomId(client);
    if (!userId || !username) {
      client.disconnect();
      return;
    }
    try {
      const result = await this.chatService.toggleReaction(
        dto.messageId,
        userId,
        username,
        dto.emoji,
        roomId,
      );
      this.server.to(this.toRoomKey(roomId)).emit('chat:reaction', result);
      return result;
    } catch (e) {
      if (e instanceof NotFoundException || e instanceof ForbiddenException) {
        client.emit('chat:error', 'Réaction refusée');
        return;
      }
      throw e;
    }
  }

  private extractToken(client: Socket) {
    const auth = client.handshake.auth as Record<string, unknown>;
    const authToken = auth.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken.startsWith('Bearer ') ? authToken.slice(7) : authToken;
    }
    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }
    return null;
  }

  private getUserId(client: Socket) {
    const data = client.data as Record<string, unknown>;
    return typeof data.userId === 'string' ? data.userId : null;
  }

  private getUsername(client: Socket) {
    const data = client.data as Record<string, unknown>;
    return typeof data.username === 'string' ? data.username : null;
  }

  private getActiveRoomId(client: Socket) {
    const data = client.data as Record<string, unknown>;
    return typeof data.activeRoomId === 'string' ? data.activeRoomId : null;
  }

  private clearTypingForUser(userId: string, roomId: string | null) {
    const roomKey = this.toRoomKey(roomId);
    for (const [socketId, entry] of this.typingUsers.entries()) {
      if (entry.userId === userId && entry.roomKey === roomKey) {
        this.typingUsers.delete(socketId);
      }
    }
  }

  private getTypingNames(roomId: string | null) {
    const roomKey = this.toRoomKey(roomId);
    return [
      ...new Map(
        [...this.typingUsers.values()]
          .filter((entry) => entry.roomKey === roomKey)
          .map((entry) => [entry.userId, entry.username]),
      ).values(),
    ];
  }

  private toRoomKey(roomId: string | null) {
    return roomId ? `chat:${roomId}` : GENERAL_ROOM_KEY;
  }
}
