import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class RecommendDto {
  @IsString()
  symptoms: string;
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('recommend')
  recommend(@Body() body: RecommendDto) {
    return this.aiService.recommend(body.symptoms);
  }
}
