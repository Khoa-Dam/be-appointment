export class Specialty {
    id: string;
    name: string;
    icon: string;
    createdAt: Date;

    constructor(partial: Partial<Specialty>) {
        Object.assign(this, partial);
    }
}
