import { Controller } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    // POST /appointments

    // GET /appointments/my

    // PATCH /appointments/:id/confirm

    // PATCH /appointments/:id/cancel
}
