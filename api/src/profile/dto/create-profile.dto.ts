import { IsString, IsDateString, IsOptional } from "class-validator";

export class CreateProfileDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsDateString()
    birthday: string;

    @IsString()
    contactNumber: string;

    @IsString()
    @IsOptional()
    profilePictureUrl?: string;

    @IsString()
    @IsOptional()
    gender?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    bloodType?: string;

    @IsString()
    @IsOptional()
    emergencyContactName?: string;

    @IsString()
    @IsOptional()
    emergencyContactRelation?: string;

    @IsString()
    @IsOptional()
    emergencyContactPhone?: string;
}
