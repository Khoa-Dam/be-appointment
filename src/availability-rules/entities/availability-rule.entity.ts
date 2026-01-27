import { RuleType } from '../../common/enums';

export class AvailabilityRule {
  id: string;
  hostId: string;
  ruleType: RuleType;
  startHour: number; // 0-23
  endHour: number; // 0-23
  daysOfWeek?: string; // 'MON,TUE,WED'
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<AvailabilityRule>) {
    Object.assign(this, partial);
  }
}
