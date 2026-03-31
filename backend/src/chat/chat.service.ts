import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { ChatMessage } from './chat-message.entity';

type PublicChatMessage = {
  id: string;
  authorId: string;
  authorName: string;
  authorColor: string;
  text: string;
  createdAt: string;
  reactions: [];
};

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messagesRepository: Repository<ChatMessage>,
    private readonly usersService: UsersService,
  ) {}

  async getHistory(limit = 50): Promise<PublicChatMessage[]> {
    const messages = await this.messagesRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return messages.reverse().map((message) => this.toPublic(message));
  }

  async createMessage(
    userId: string,
    text: string,
  ): Promise<PublicChatMessage> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException();
    }
    const created = await this.messagesRepository.save(
      this.messagesRepository.create({
        userId: user.id,
        text: text.trim(),
      }),
    );
    return {
      id: created.id,
      authorId: user.id,
      authorName: user.username,
      authorColor: user.accentColor,
      text: created.text,
      createdAt: created.createdAt.toISOString(),
      reactions: [],
    };
  }

  private toPublic(message: ChatMessage): PublicChatMessage {
    return {
      id: message.id,
      authorId: message.userId,
      authorName: message.user.username,
      authorColor: message.user.accentColor,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
      reactions: [],
    };
  }
}
