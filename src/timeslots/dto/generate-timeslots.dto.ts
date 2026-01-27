import { IsDateString, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class GenerateTimeslotsDto {
    @IsString()
    @IsNotEmpty()
    ruleId: string;

    @IsInt()
    @Min(1)
    slotDuration: number;

    @IsDateString()
    fromDate: string;

    @IsDateString()
    toDate: string;
}
