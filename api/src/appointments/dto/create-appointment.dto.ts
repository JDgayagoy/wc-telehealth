import { IsString, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  slotId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
