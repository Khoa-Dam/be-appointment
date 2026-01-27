import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class QueryTimeslotsDto {
    @IsString()
    @IsUUID()
    @IsOptional() // Make it optional to allow other queries later
    hostId?: string;
}
