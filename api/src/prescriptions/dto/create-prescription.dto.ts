import { IsOptional, IsString } from 'class-validator';

export class CreatePrescriptionDto {
    @IsString()
    patientId: string;

    @IsString()
    medication: string;

    @IsString()
    dosage: string;

    @IsString()
    instructions: string;

    @IsOptional()
    @IsString()
    appointmentId?: string;
}
