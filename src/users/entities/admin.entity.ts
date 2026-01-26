import { User } from './user.entity';
import { UserRole } from '../../common/enums';

export class Admin extends User {
    constructor(partial: Partial<Admin>) {
        super({ ...partial, role: UserRole.ADMIN });
    }
}
