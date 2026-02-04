import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../common/enums';

export class NotificationResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ example: '2026-02-01T10:00:00Z' })
  3: string;

  @ApiProperty({ enum: ['SENT', 'READ'] })
  status: 'SENT' | 'READ';
}
