import {
    IsDateString,
    IsEmail,
    IsEnum,
    IsString,
    MinLength,
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
}