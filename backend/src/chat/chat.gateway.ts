import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

type JwtPayload = {
  sub: string;
  email: string;
};

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
    { userId: string; username: string }
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
      client.emit('chat:history', await this.chatService.getHistory());
      client.emit('chat:typing', this.getTypingNames());
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.typingUsers.delete(client.id);
    this.server.emit('chat:typing', this.getTypingNames());
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
    this.clearTypingForUser(userId);
    this.server.emit('chat:typing', this.getTypingNames());
    const message = await this.chatService.createMessage(userId, dto.text);
    this.server.emit('chat:message', message);
    return message;
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
    if (body.typing) {
      this.typingUsers.set(client.id, { userId, username });
    } else {
      this.typingUsers.delete(client.id);
    }
    this.server.emit('chat:typing', this.getTypingNames());
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

  private clearTypingForUser(userId: string) {
    for (const [socketId, entry] of this.typingUsers.entries()) {
      if (entry.userId === userId) {
        this.typingUsers.delete(socketId);
      }
    }
  }

  private getTypingNames() {
    return [
      ...new Map(
        [...this.typingUsers.values()].map((entry) => [
          entry.userId,
          entry.username,
        ]),
      ).values(),
    ];
  }
}
