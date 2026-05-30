import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConsultationsService {
  constructor(private prisma: PrismaService) {}

  async generateSession(appointmentId: string, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { slot: true },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (appointment.patientId !== userId && appointment.slot.doctorId !== userId) {
      throw new Error('Unauthorized access to this session');
    }

    // Generate a deterministic unique room name
    const roomName = `telehealth-session-${appointmentId}`;
    
    return {
      roomName,
      url: `https://meet.jit.si/${roomName}`,
      appointment,
    };
  }
}
