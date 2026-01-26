import { DocumentBuilder } from '@nestjs/swagger';
import { config } from './envs/default';

export const swaggerConfig = new DocumentBuilder()
    .setTitle(config().swagger.title)
    .setDescription(config().swagger.description)
    .setVersion(config().swagger.version)
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('hosts', 'Host management')
    .addTag('appointments', 'Appointment booking')
    .addTag('availability', 'Availability rules')
    .addTag('timeslots', 'TimeSlot management')
    .addTag('notifications', 'Notifications')
    .addTag('reports', 'Reports and statistics')
    .addBearerAuth(
        {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'Authorization',
            description: 'Enter JWT token',
            in: 'header',
        },
        'access-token',
    )
    .build();
