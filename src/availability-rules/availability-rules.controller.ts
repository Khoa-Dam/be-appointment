import { Controller } from '@nestjs/common';
import { AvailabilityRulesService } from './availability-rules.service';

@Controller('availability-rules')
export class AvailabilityRulesController {
    constructor(private readonly availabilityRulesService: AvailabilityRulesService) { }

    // POST /availability-rules

    // GET /availability-rules/:hostId
}
