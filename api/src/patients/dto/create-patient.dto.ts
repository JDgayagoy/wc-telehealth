import { IsString, IsDateString, IsOptional, IsBoolean } from "class-validator";

export class CreateHistoryDto {
    @IsString()
    condition: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsBoolean()
    @IsOptional()
    isAllergy?: boolean;

    @IsDateString()
    @IsOptional()
    diagnosedAt?: Date;
}
