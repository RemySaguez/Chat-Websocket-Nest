import { Transform } from 'class-transformer';
import { IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';

export class AddRoomMemberDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  username: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  canSeePriorHistory: boolean;
}
