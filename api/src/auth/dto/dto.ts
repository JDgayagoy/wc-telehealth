import {
    IsDateString,
    IsEmail,
    IsEnum,
    IsString,
    MinLength,
    IsOptional,
    IsNumber,
    IsArray
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
    @IsArray()
    @IsString({ each: true })
    specialization?: string[];

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