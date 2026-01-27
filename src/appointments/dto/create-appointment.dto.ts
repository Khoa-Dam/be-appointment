import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsUUID()
  hostId: string;

  @IsNotEmpty()
  @IsUUID()
  timeSlotId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
