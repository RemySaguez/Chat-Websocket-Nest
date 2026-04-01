import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { PublicUser } from '../users/public-user';
import { AddRoomMemberDto } from './dto/add-room-member.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomMemberDto } from './dto/update-room-member.dto';
import { RoomsService } from './rooms.service';

@Controller('rooms')
@UseGuards(AuthGuard('jwt'))
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  list(@Request() req: { user: PublicUser }) {
    return this.roomsService.listForUser(req.user.id);
  }

  @Get('available-users')
  listAvailableUsers(@Request() req: { user: PublicUser }) {
    return this.roomsService.listAvailableUsers(req.user.id);
  }

  @Post()
  create(@Request() req: { user: PublicUser }, @Body() dto: CreateRoomDto) {
    return this.roomsService.create(req.user.id, dto.name, dto.inviteUsernames ?? []);
  }

  @Get(':id/available-users')
  listRoomAvailableUsers(
    @Request() req: { user: PublicUser },
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.roomsService.listAvailableUsers(req.user.id, id);
  }

  @Get(':id')
  getOne(
    @Request() req: { user: PublicUser },
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.roomsService.getOneIfMember(id, req.user.id);
  }

  @Post(':id/members')
  addMember(
    @Request() req: { user: PublicUser },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddRoomMemberDto,
  ) {
    return this.roomsService.addMember(
      id,
      req.user.id,
      dto.username,
      dto.canSeePriorHistory,
    );
  }

  @Patch(':id/members/:userId')
  updateMember(
    @Request() req: { user: PublicUser },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: UpdateRoomMemberDto,
  ) {
    return this.roomsService.setMemberHistory(
      id,
      req.user.id,
      userId,
      dto.canSeePriorHistory,
    );
  }
}
