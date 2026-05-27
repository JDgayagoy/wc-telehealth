import { IsEmail, IsEnum, IsString, MinLength } from "class-validator";

export enum Role {
    PATIENT = 'PATIENT',
    DOCTOR = 'DOCTOR'
}

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6, { message: "Password must be atleast 6 characters" })
    password: string;

    @IsEnum(Role)
    role: Role;
}