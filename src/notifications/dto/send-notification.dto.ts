import { IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../common/enums';

export class SendNotificationDto {
    @ApiProperty({ description: 'Appointment ID', example: 'uuid' })
    @IsUUID()
    appointmentId: string;

    @ApiProperty({
        enum: NotificationType,
        description: 'Notification type',
        example: 'APPOINTMENT_CONFIRMED',
    })
    @IsEnum(NotificationType)
    type: NotificationType;
}
