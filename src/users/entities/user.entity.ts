import { UserRole } from '../../common/enums';

export class User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }
}
