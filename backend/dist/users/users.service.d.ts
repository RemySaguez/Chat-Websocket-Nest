import { Repository } from 'typeorm';
import { User } from './user.entity';
import type { PublicUser } from './public-user';
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: Repository<User>);
    toPublic(user: User): PublicUser;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    create(data: {
        email: string;
        username: string;
        passwordHash: string;
        accentColor: string;
    }): Promise<User>;
}
