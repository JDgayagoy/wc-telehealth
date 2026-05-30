import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('consultations')
@UseGuards(JwtAuthGuard)
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Get(':appointmentId/session')
  getSession(@Param('appointmentId') appointmentId: string, @Req() req) {
    return this.consultationsService.generateSession(appointmentId, req.user.id);
  }
}
