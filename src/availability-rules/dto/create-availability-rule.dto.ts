import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { RuleType } from '../../common/enums';

export class CreateAvailabilityRuleDto {
  @IsEnum(RuleType)
  ruleType: RuleType;

  @IsInt()
  @Min(0)
  @Max(23)
  startHour: number;

  @IsInt()
  @Min(0)
  @Max(23)
  endHour: number;

  @IsOptional()
  @IsString()
  daysOfWeek?: string;

  @IsBoolean()
  isActive: boolean;
}
