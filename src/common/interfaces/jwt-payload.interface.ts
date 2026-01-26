import { UserRole } from '../enums';

export interface JwtPayload {
    sub: string; // user id
    email: string;
    role: UserRole;
    iat: number; // issued at
    exp: number; // expiration
    user_metadata?: {
        name?: string;
        role?: string;
    };
    app_metadata?: {
        role?: string;
    };
}
