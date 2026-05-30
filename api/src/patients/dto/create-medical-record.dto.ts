import { IsString, IsOptional } from 'class-validator';

export class CreateMedicalRecordDto {
  @IsString()
  diagnosis: string;

  @IsString()
  @IsOptional()
  treatment?: string;

  @IsString()
  @IsOptional()
  consultationNotes?: string;
}
