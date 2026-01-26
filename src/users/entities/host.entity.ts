import { User } from './user.entity';
import { UserRole } from '../../common/enums';

export class Host extends User {
    specialty?: string;
    description?: string;
    address?: string;

    constructor(partial: Partial<Host>) {
        super({ ...partial, role: UserRole.HOST });
        this.specialty = partial.specialty;
        this.description = partial.description;
        this.address = partial.address;
    }
}
