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
}
