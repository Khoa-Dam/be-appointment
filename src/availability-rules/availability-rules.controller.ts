import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AvailabilityRulesService } from './availability-rules.service';
import { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';

@Controller('availability-rules')
export class AvailabilityRulesController {
  constructor(
    private readonly availabilityRulesService: AvailabilityRulesService,
  ) {}

  @Post()
  create(@Body() createAvailabilityRuleDto: CreateAvailabilityRuleDto) {
    // TODO: Trong thực tế, hostId sẽ được lấy từ token xác thực (req.user.id)
    const hostId = 'uuid';
    return this.availabilityRulesService.create(
      hostId,
      createAvailabilityRuleDto,
    );
  }

  @Get(':hostId')
  findByHostId(@Param('hostId') hostId: string) {
    return this.availabilityRulesService.findByHostId(hostId);
  }
}
