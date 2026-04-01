import { IsBoolean } from 'class-validator';

export class UpdateRoomMemberDto {
  @IsBoolean()
  canSeePriorHistory: boolean;
}
