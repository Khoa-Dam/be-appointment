import { ApiProperty } from '@nestjs/swagger';

export class SendNotificationResponseDto {
    @ApiProperty({ example: 'Notification sent' })
    message: string;
}
