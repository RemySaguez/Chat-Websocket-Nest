import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { ChatGateway } from './chat.gateway';
import { ChatMessage } from './chat-message.entity';
import { ChatService } from './chat.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([ChatMessage]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
