import { IsString, IsNumber, IsOptional, IsArray, IsObject } from 'class-validator';

export class UpdateDoctorProfileDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialization?: string[];

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @IsNumber()
  @IsOptional()
  yearsOfExperience?: number;

  @IsString()
  @IsOptional()
  signatureUrl?: string;

  @IsOptional()
  workExperience?: any;
}
