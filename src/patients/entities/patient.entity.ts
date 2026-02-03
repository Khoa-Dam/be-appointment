export class Patient {
    id: string;
    ownerId: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    dob?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    createdAt: Date;
    updatedAt: Date;

    constructor(partial: Partial<Patient>) {
        Object.assign(this, partial);
    }
}
