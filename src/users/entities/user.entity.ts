import { UserRole } from '../../common/enums';

export class User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    is_active: boolean;
    phone?: string;
    created_at: Date;
    updated_at: Date;

    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }
}
