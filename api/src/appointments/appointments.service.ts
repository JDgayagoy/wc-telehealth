import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) { }

  async book(patientId: string, dto: CreateAppointmentDto) {
    const slot = await this.prisma.consultationSlot.findUnique({
      where: { id: dto.slotId },
    });

    if (!slot) throw new NotFoundException('Slot not found');
    if (!slot.isAvailable) throw new BadRequestException('Slot is no longer available');
    console.log('PATIENT ID:', patientId);
    const [appointment] = await this.prisma.$transaction([
      this.prisma.appointment.create({
        data: {
          patientId,
          slotId: dto.slotId,
          reason: dto.reason,
          status: 'CONFIRMED',
        },
        include: { slot: true },
      }),
      this.prisma.consultationSlot.update({
        where: { id: dto.slotId },
        data: { isAvailable: false },
      }),
    ]);

    return appointment;
  }

  async getMyAppointments(patientId: string) {
    return this.prisma.appointment.findMany({
      where: { patientId },
      include: {
        slot: {
          include: {
            doctor: {
              select: {
                id: true,
                profile: { select: { firstName: true, lastName: true } },
                doctorProfile: { select: { specialization: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(appointmentId: string, patientId: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, patientId },
    });

    if (!appt) throw new NotFoundException('Appointment not found');
    if (appt.status === 'CANCELLED') throw new BadRequestException('Already cancelled');

    return this.prisma.$transaction([
      this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' },
      }),
      this.prisma.consultationSlot.update({
        where: { id: appt.slotId },
        data: { isAvailable: true },
      }),
    ]);
  }

  async getDoctorAppointments(doctorId: string) {
    return this.prisma.appointment.findMany({
      where: {
        slot: { doctorId },
      },
      include: {
        slot: true,
        patient: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true, birthday: true, profilePictureUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAppointmentById(appointmentId: string) {
    return this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        slot: true,
        patient: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true, birthday: true, contactNumber: true, profilePictureUrl: true } },
          },
        },
      },
    });
  }
}
