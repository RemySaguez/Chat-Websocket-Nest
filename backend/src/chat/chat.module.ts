import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ChatGateway } from './chat.gateway';
import { ChatMessage } from './chat-message.entity';
import { ChatService } from './chat.service';
import { RoomMember } from './room-member.entity';
import { Room } from './room.entity';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TypeOrmModule.forFeature([ChatMessage, Room, RoomMember]),
  ],
  controllers: [RoomsController],
  providers: [ChatGateway, ChatService, RoomsService],
})
export class ChatModule {}
