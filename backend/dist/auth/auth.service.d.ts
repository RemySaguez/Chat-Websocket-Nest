import { JwtService } from '@nestjs/jwt';
import type { PublicUser } from '../users/public-user';
import { UsersService } from '../users/users.service';
import type { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<PublicUser | null>;
    register(dto: RegisterDto): Promise<{
        access_token: string;
        user: PublicUser;
    }>;
    login(user: PublicUser): {
        access_token: string;
        user: PublicUser;
    };
    private issueTokens;
}
