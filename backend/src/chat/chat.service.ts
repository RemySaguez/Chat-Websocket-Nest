import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThanOrEqual, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { ChatMessage } from './chat-message.entity';
import { RoomMember } from './room-member.entity';

type ReactionRow = { emoji: string; userNames: string[] };

export type PublicChatMessage = {
  id: string;
  roomId: string | null;
  authorId: string;
  authorName: string;
  authorColor: string;
  text: string;
  createdAt: string;
  reactions: ReactionRow[];
};

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messagesRepository: Repository<ChatMessage>,
    @InjectRepository(RoomMember)
    private readonly roomMembersRepository: Repository<RoomMember>,
    private readonly usersService: UsersService,
  ) {}

  async getHistory(
    roomId: string | null,
    userId: string,
    limit = 50,
  ): Promise<PublicChatMessage[]> {
    let messages: ChatMessage[] = [];
    if (roomId) {
      const membership = await this.roomMembersRepository.findOne({
        where: { roomId, userId },
      });
      if (!membership) {
        throw new ForbiddenException();
      }
      messages = await this.messagesRepository.find({
        where: membership.canSeePriorHistory
          ? { roomId }
          : {
              roomId,
              createdAt: MoreThanOrEqual(membership.addedAt),
            },
        order: { createdAt: 'DESC' },
        take: limit,
      });
    } else {
      messages = await this.messagesRepository.find({
        where: { roomId: IsNull() },
        order: { createdAt: 'DESC' },
        take: limit,
      });
    }
    return messages.reverse().map((message) => this.toPublic(message));
  }

  async createMessage(
    userId: string,
    text: string,
    roomId: string | null,
  ): Promise<PublicChatMessage> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException();
    }
    if (roomId) {
      const membership = await this.roomMembersRepository.findOne({
        where: { roomId, userId },
      });
      if (!membership) {
        throw new ForbiddenException();
      }
    }
    const created = await this.messagesRepository.save(
      this.messagesRepository.create({
        userId: user.id,
        roomId,
        text: text.trim(),
      }),
    );
    return {
      id: created.id,
      roomId: created.roomId,
      authorId: user.id,
      authorName: user.username,
      authorColor: user.accentColor,
      text: created.text,
      createdAt: created.createdAt.toISOString(),
      reactions: this.normalizeReactions(created.reactions),
    };
  }

  async toggleReaction(
    messageId: string,
    userId: string,
    userName: string,
    emoji: string,
    roomId: string | null,
  ): Promise<{ messageId: string; reactions: ReactionRow[] }> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
    });
    if (!message) {
      throw new NotFoundException();
    }
    if (message.roomId !== roomId) {
      throw new NotFoundException();
    }
    if (roomId) {
      const membership = await this.roomMembersRepository.findOne({
        where: { roomId, userId },
      });
      if (!membership) {
        throw new ForbiddenException();
      }
    }
    const current = this.normalizeReactions(message.reactions);
    const next = this.applyToggle(current, emoji, userName);
    message.reactions = next;
    await this.messagesRepository.save(message);
    return { messageId, reactions: next };
  }

  private applyToggle(
    reactions: ReactionRow[],
    emoji: string,
    userName: string,
  ): ReactionRow[] {
    const others = reactions.filter((r) => r.emoji !== emoji);
    const existing = reactions.find((r) => r.emoji === emoji);
    const hadUser = existing?.userNames.includes(userName);
    const nextNames = existing
      ? hadUser
        ? existing.userNames.filter((u) => u !== userName)
        : [...existing.userNames, userName]
      : [userName];
    const nextReaction =
      nextNames.length > 0 ? [{ emoji, userNames: nextNames }] : [];
    return [...others, ...nextReaction].sort((a, b) =>
      a.emoji.localeCompare(b.emoji),
    );
  }

  private normalizeReactions(
    raw: ReactionRow[] | null | undefined,
  ): ReactionRow[] {
    return raw ?? [];
  }

  private toPublic(message: ChatMessage): PublicChatMessage {
    return {
      id: message.id,
      roomId: message.roomId,
      authorId: message.userId,
      authorName: message.user.username,
      authorColor: message.user.accentColor,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
      reactions: this.normalizeReactions(message.reactions),
    };
  }
}
