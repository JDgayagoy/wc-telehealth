import { IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
    @IsString()
    appointmentId: string;

    @IsOptional()
    @IsString()
    content?: string;
}
