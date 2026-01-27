import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Data Transfer Object for canceling an appointment.
 * It contains the reason for cancellation, which is optional.
 */
export class CancelAppointmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelReason?: string;
}
