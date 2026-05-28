import {
    IsDateString,
    IsEmail,
    IsEnum,
    IsString,
    MinLength,
    IsOptional,
    IsNumber
} from 'class-validator';

export enum Role {
    PATIENT = 'PATIENT',
    DOCTOR = 'DOCTOR',
}

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsString()
    contactNumber: string;

    @IsDateString()
    birthday: string;

    @IsEnum(Role)
    role: Role;

    @IsOptional()
    @IsString()
    specialization?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsNumber()
    yearsOfExperience?: number;

    @IsOptional()
    @IsString()
    licenseNumber?: string;
}