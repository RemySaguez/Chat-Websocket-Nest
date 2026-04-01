import { IsIn, IsUUID } from 'class-validator';

export class ToggleReactionDto {
  @IsUUID()
  messageId: string;

  @IsIn(['🔥', '👍', '😂'])
  emoji: string;
}
