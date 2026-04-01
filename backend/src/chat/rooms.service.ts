import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RoomMember } from './room-member.entity';
import { Room } from './room.entity';

type PublicRoom = {
  id: string;
  name: string;
  creatorId: string;
  createdAt: string;
};

type PublicRoomMember = {
  userId: string;
  username: string;
  accentColor: string;
  addedAt: string;
  canSeePriorHistory: boolean;
  isCreator: boolean;
};

type AvailableRoomUser = {
  id: string;
  username: string;
  accentColor: string;
};

type PublicRoomDetail = PublicRoom & {
  members: PublicRoomMember[];
};

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomsRepository: Repository<Room>,
    @InjectRepository(RoomMember)
    private readonly roomMembersRepository: Repository<RoomMember>,
    private readonly usersService: UsersService,
  ) {}

  async listForUser(userId: string): Promise<PublicRoom[]> {
    const memberships = await this.roomMembersRepository.find({
      where: { userId },
      relations: { room: true },
      order: { addedAt: 'DESC' },
    });
    return memberships.map(({ room }) => this.toPublicRoom(room));
  }

  async create(
    creatorId: string,
    name: string,
    inviteUsernames: string[],
  ): Promise<PublicRoomDetail> {
    const room = await this.roomsRepository.save(
      this.roomsRepository.create({
        creatorId,
        name: name.trim(),
      }),
    );
    const users = await this.resolveUsers(inviteUsernames);
    const members = [
      this.roomMembersRepository.create({
        roomId: room.id,
        userId: creatorId,
        canSeePriorHistory: true,
      }),
      ...users
        .filter((user) => user.id !== creatorId)
        .map((user) =>
          this.roomMembersRepository.create({
            roomId: room.id,
            userId: user.id,
            canSeePriorHistory: false,
          }),
        ),
    ];
    await this.roomMembersRepository.save(
      this.deduplicateMembersByUserId(members),
    );
    return this.getOneIfMember(room.id, creatorId);
  }

  async getOneIfMember(roomId: string, userId: string): Promise<PublicRoomDetail> {
    const room = await this.assertRoomMember(roomId, userId);
    const members = await this.roomMembersRepository.find({
      where: { roomId },
      order: { addedAt: 'ASC' },
    });
    return {
      ...this.toPublicRoom(room),
      members: members.map((member) => this.toPublicMember(member, room.creatorId)),
    };
  }

  async addMember(
    roomId: string,
    actorId: string,
    username: string,
    canSeePriorHistory: boolean,
  ): Promise<PublicRoomMember> {
    const room = await this.assertRoomMember(roomId, actorId);
    const target = await this.usersService.findByUsername(username.trim());
    if (!target) {
      throw new NotFoundException();
    }
    const existing = await this.roomMembersRepository.findOne({
      where: { roomId, userId: target.id },
    });
    if (existing) {
      return this.toPublicMember(existing, room.creatorId);
    }
    const prior =
      target.id === room.creatorId ? true : canSeePriorHistory;
    await this.roomMembersRepository.insert({
      roomId,
      userId: target.id,
      canSeePriorHistory: prior,
    });
    const reloaded = await this.roomMembersRepository.findOne({
      where: { roomId, userId: target.id },
    });
    if (!reloaded) {
      throw new NotFoundException();
    }
    return {
      userId: reloaded.userId,
      username: target.username,
      accentColor: target.accentColor,
      addedAt: reloaded.addedAt.toISOString(),
      canSeePriorHistory: reloaded.canSeePriorHistory,
      isCreator: reloaded.userId === room.creatorId,
    };
  }

  async setMemberHistory(
    roomId: string,
    actorId: string,
    targetUserId: string,
    canSeePriorHistory: boolean,
  ): Promise<PublicRoomMember> {
    const room = await this.assertRoomMember(roomId, actorId);
    const member = await this.roomMembersRepository.findOne({
      where: { roomId, userId: targetUserId },
    });
    if (!member) {
      throw new NotFoundException();
    }
    member.canSeePriorHistory =
      targetUserId === room.creatorId ? true : canSeePriorHistory;
    await this.roomMembersRepository.save(member);
    const reloaded = await this.roomMembersRepository.findOne({
      where: { roomId, userId: targetUserId },
    });
    if (!reloaded) {
      throw new NotFoundException();
    }
    return this.toPublicMember(reloaded, room.creatorId);
  }

  async listAvailableUsers(
    actorId: string,
    roomId?: string,
  ): Promise<AvailableRoomUser[]> {
    let excludedIds = [actorId];
    if (roomId) {
      await this.assertRoomMember(roomId, actorId);
      const members = await this.roomMembersRepository.find({
        where: { roomId },
      });
      excludedIds = members.map((member) => member.userId);
    }
    const users = await this.usersService.listAll();
    return users
      .filter((user) => !excludedIds.includes(user.id))
      .map((user) => ({
        id: user.id,
        username: user.username,
        accentColor: user.accentColor,
      }));
  }

  async assertRoomMember(roomId: string, userId: string): Promise<Room> {
    const room = await this.roomsRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException();
    }
    const membership = await this.roomMembersRepository.findOne({
      where: { roomId, userId },
    });
    if (!membership) {
      throw new ForbiddenException();
    }
    return room;
  }

  private async resolveUsers(usernames: string[]) {
    const unique = [...new Set(usernames.map((username) => username.trim()))].filter(
      Boolean,
    );
    const users = await Promise.all(
      unique.map((username) => this.usersService.findByUsername(username)),
    );
    return users.filter((user): user is NonNullable<typeof user> => Boolean(user));
  }

  private deduplicateMembersByUserId(members: RoomMember[]) {
    return [...new Map(members.map((member) => [member.userId, member])).values()];
  }

  private toPublicRoom(room: Room): PublicRoom {
    return {
      id: room.id,
      name: room.name,
      creatorId: room.creatorId,
      createdAt: room.createdAt.toISOString(),
    };
  }

  private toPublicMember(
    member: RoomMember,
    creatorId: string,
  ): PublicRoomMember {
    return {
      userId: member.userId,
      username: member.user.username,
      accentColor: member.user.accentColor,
      addedAt: member.addedAt.toISOString(),
      canSeePriorHistory: member.canSeePriorHistory,
      isCreator: member.userId === creatorId,
    };
  }
}
