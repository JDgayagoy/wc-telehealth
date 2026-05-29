import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) { }

  @Post()
  book(@Req() req, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.book(req.user.id, dto);
  }

  @Get('mine')
  getMyAppointments(@Req() req) {
    return this.appointmentsService.getMyAppointments(req.user.id);
  }

  // Doctor: get all appointments where doctor = logged in user
  @Get('doctor')
  getDoctorAppointments(@Req() req) {
    return this.appointmentsService.getDoctorAppointments(req.user.id);
  }

  // Doctor: get full appointment details with patient info
  @Get(':id')
  getAppointmentById(@Param('id') id: string) {
    return this.appointmentsService.getAppointmentById(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Req() req) {
    return this.appointmentsService.cancel(id, req.user.id);
  }
}

