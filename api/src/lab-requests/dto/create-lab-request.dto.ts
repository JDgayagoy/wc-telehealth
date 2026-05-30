import { IsOptional, IsString } from 'class-validator';

export class CreateLabRequestDto {
    @IsString()
    appointmentId: string;

    @IsString()
    testName: string;

    @IsOptional()
    @IsString()
    instructions?: string;
}
