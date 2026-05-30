import { IsString, IsOptional } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsString()
  newSlotId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
