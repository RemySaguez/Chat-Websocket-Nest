import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Room } from './room.entity';

@Entity('room_members')
export class RoomMember {
  @PrimaryColumn({ name: 'room_id' })
  roomId: string;

  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Room, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => User, { eager: true, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'can_see_prior_history', default: false })
  canSeePriorHistory: boolean;

  @CreateDateColumn({ name: 'added_at' })
  addedAt: Date;
}
