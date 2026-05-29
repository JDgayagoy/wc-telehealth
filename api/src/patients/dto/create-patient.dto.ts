import { IsString, IsDateString, IsOptional, IsBoolean } from "class-validator";

export class CreateHistoryDto {
    @IsString()
    condition: string;

    @IsString()
    description: string;

    @IsBoolean()
    isActive: boolean;

    @IsDateString()
    @IsOptional()
    diagnosedAt: Date;
}