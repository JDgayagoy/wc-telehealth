import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
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

  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @Req() req) {
    return this.appointmentsService.confirm(id, req.user.id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Req() req) {
    return this.appointmentsService.reject(id, req.user.id);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @Req() req) {
    return this.appointmentsService.complete(id, req.user.id);
  }

  @Patch(':id/notes')
  updateNotes(@Param('id') id: string, @Req() req, @Body('notes') notes: string) {
    return this.appointmentsService.updateNotes(id, req.user.id, notes);
  }

  @Patch(':id/reschedule')
  reschedule(@Param('id') id: string, @Req() req, @Body() dto: RescheduleAppointmentDto) {
    return this.appointmentsService.reschedule(id, req.user.id, dto);
  }

  @Patch(':id/approve-cancellation')
  approveCancellation(@Param('id') id: string, @Req() req) {
    return this.appointmentsService.approveCancellation(id, req.user.id);
  }

  @Patch(':id/reject-cancellation')
  rejectCancellation(@Param('id') id: string, @Req() req) {
    return this.appointmentsService.rejectCancellation(id, req.user.id);
  }

  @Patch(':id/approve-reschedule')
  approveReschedule(@Param('id') id: string, @Req() req) {
    return this.appointmentsService.approveReschedule(id, req.user.id);
  }

  @Patch(':id/reject-reschedule')
  rejectReschedule(@Param('id') id: string, @Req() req) {
    return this.appointmentsService.rejectReschedule(id, req.user.id);
  }

  @Post(':id/rate')
  rate(@Param('id') id: string, @Req() req, @Body() body: { rating: number; review?: string }) {
    return this.appointmentsService.rateDoctor(id, req.user.id, body.rating, body.review);
  }
}

