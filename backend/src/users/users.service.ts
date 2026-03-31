import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import type { PublicUser } from './public-user';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  toPublic(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      accentColor: user.accentColor,
    };
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username: username.trim() },
    });
  }

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
    accentColor: string;
  }): Promise<User> {
    const user = this.usersRepository.create({
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      accentColor: data.accentColor,
    });
    return this.usersRepository.save(user);
  }

  async updateProfile(
    id: string,
    data: { username?: string; accentColor?: string },
  ): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }
    if (data.username !== undefined) {
      user.username = data.username.trim();
    }
    if (data.accentColor !== undefined) {
      user.accentColor = data.accentColor;
    }
    return this.usersRepository.save(user);
  }
}
