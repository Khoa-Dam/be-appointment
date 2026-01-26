import { User } from './user.entity';
import { UserRole } from '../../common/enums';

export class Guest extends User {
    constructor(partial: Partial<Guest>) {
        super({ ...partial, role: UserRole.GUEST });
    }
}
