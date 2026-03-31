import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { PublicUser } from '../users/public-user';
import { UsersService } from '../users/users.service';
import type { RegisterDto } from './dto/register.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<PublicUser | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return null;
    }
    return this.usersService.toPublic(user);
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const username = dto.username.trim();
    if (await this.usersService.findByEmail(email)) {
      throw new ConflictException('Email déjà utilisé');
    }
    if (await this.usersService.findByUsername(username)) {
      throw new ConflictException('Pseudo déjà pris');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const accentColor = dto.accentColor ?? '#5e5e60';
    const user = await this.usersService.create({
      email,
      username,
      passwordHash,
      accentColor,
    });
    const publicUser = this.usersService.toPublic(user);
    return this.issueTokens(publicUser);
  }

  login(user: PublicUser) {
    return this.issueTokens(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException();
    }
    const username = dto.username?.trim();
    if (username && username !== user.username) {
      const existing = await this.usersService.findByUsername(username);
      if (existing && existing.id !== userId) {
        throw new ConflictException('Pseudo déjà pris');
      }
    }
    const updated = await this.usersService.updateProfile(userId, {
      username,
      accentColor: dto.accentColor,
    });
    if (!updated) {
      throw new NotFoundException();
    }
    return this.usersService.toPublic(updated);
  }

  private issueTokens(user: PublicUser) {
    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
      }),
      user,
    };
  }
}
