import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MessagesService } from '../messages/messages.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => MessagesService)) private messagesService: MessagesService,
  ) { }

  async book(patientId: string, dto: CreateAppointmentDto) {
    const slot = await this.prisma.consultationSlot.findUnique({
      where: { id: dto.slotId },
    });

    if (!slot) throw new NotFoundException('Slot not found');
    if (!slot.isAvailable) throw new BadRequestException('Slot is no longer available');
    console.log('PATIENT ID:', patientId);
    const appointment = await this.prisma.appointment.create({
      data: {
        patientId,
        slotId: dto.slotId,
        reason: dto.reason,
        status: 'PENDING',
      },
      include: { slot: true },
    });

    const doctorId = appointment.slot.doctorId;
    await this.notificationsService.createNotification(
      doctorId,
      'appointment:pending',
      'New Appointment Request',
      `A patient has requested an appointment for ${appointment.slot.startTime.toLocaleString()}. Please confirm or decline.`,
      { appointmentId: appointment.id }
    );
    await this.notificationsService.createNotification(
      patientId,
      'appointment:pending',
      'Appointment Request Sent',
      `Your appointment request for ${appointment.slot.startTime.toLocaleString()} is awaiting doctor confirmation.`,
      { appointmentId: appointment.id }
    );

    return appointment;
  }

  async reschedule(appointmentId: string, patientId: string, dto: RescheduleAppointmentDto) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, patientId },
      include: { slot: true },
    });

    if (!appt) throw new NotFoundException('Appointment not found');
    if (appt.status === 'CANCELLED' || appt.status === 'COMPLETED') {
      throw new BadRequestException(`Cannot reschedule ${appt.status.toLowerCase()} appointment`);
    }

    const newSlot = await this.prisma.consultationSlot.findUnique({
      where: { id: dto.newSlotId },
    });

    if (!newSlot) throw new NotFoundException('New slot not found');
    if (!newSlot.isAvailable) throw new BadRequestException('New slot is no longer available');

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        requestedSlotId: dto.newSlotId,
        status: 'RESCHEDULE_PENDING',
        reason: dto.reason ?? appt.reason,
      },
      include: { slot: true },
    });

    await this.notificationsService.createNotification(
      appt.slot.doctorId,
      'appointment:reschedule_requested',
      'Reschedule Request',
      `A patient has requested to reschedule their appointment to ${newSlot.startTime.toLocaleString()}. Please approve or decline.`,
      { appointmentId: appt.id }
    );

    return updated;
  }

  async approveReschedule(appointmentId: string, doctorId: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, slot: { doctorId } },
      include: { slot: true },
    });

    if (!appt) throw new NotFoundException('Appointment not found or unauthorized');
    if (appt.status !== 'RESCHEDULE_PENDING') throw new BadRequestException('No pending reschedule request');
    if (!appt.requestedSlotId) throw new BadRequestException('No requested slot on file');

    const newSlot = await this.prisma.consultationSlot.findUnique({
      where: { id: appt.requestedSlotId },
    });
    if (!newSlot || !newSlot.isAvailable) throw new BadRequestException('Requested slot is no longer available');

    const [updated] = await this.prisma.$transaction([
      this.prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          slotId: appt.requestedSlotId,
          requestedSlotId: null,
          status: 'CONFIRMED',
        },
      }),
      // Free the old slot
      this.prisma.consultationSlot.update({
        where: { id: appt.slotId },
        data: { isAvailable: true },
      }),
      // Block the new slot
      this.prisma.consultationSlot.update({
        where: { id: appt.requestedSlotId },
        data: { isAvailable: false },
      }),
    ]);

    await this.notificationsService.createNotification(
      appt.patientId,
      'appointment:reschedule_approved',
      'Reschedule Approved',
      `Your reschedule request has been approved. New appointment: ${newSlot.startTime.toLocaleString()}.`,
      { appointmentId: appt.id }
    );

    return updated;
  }

  async rejectReschedule(appointmentId: string, doctorId: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, slot: { doctorId } },
      include: { slot: true },
    });

    if (!appt) throw new NotFoundException('Appointment not found or unauthorized');
    if (appt.status !== 'RESCHEDULE_PENDING') throw new BadRequestException('No pending reschedule request');

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        requestedSlotId: null,
        status: 'CONFIRMED',
      },
    });

    await this.notificationsService.createNotification(
      appt.patientId,
      'appointment:reschedule_rejected',
      'Reschedule Declined',
      `Your reschedule request was declined. Your original appointment remains at ${appt.slot.startTime.toLocaleString()}.`,
      { appointmentId: appt.id }
    );

    return updated;
  }

  async confirm(appointmentId: string, doctorId: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, slot: { doctorId } },
      include: { slot: true },
    });
    if (!appt) throw new NotFoundException('Appointment not found or unauthorized');
    if (appt.status !== 'PENDING') throw new BadRequestException('Appointment is not pending');

    const [updated] = await this.prisma.$transaction([
      this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CONFIRMED' },
      }),
      this.prisma.consultationSlot.update({
        where: { id: appt.slotId },
        data: { isAvailable: false },
      }),
    ]);

    await this.notificationsService.createNotification(
      appt.patientId,
      'appointment:confirmed',
      'Appointment Confirmed',
      `Your appointment on ${appt.slot.startTime.toLocaleString()} has been confirmed by your doctor.`,
      { appointmentId: appt.id }
    );

    return updated;
  }

  async reject(appointmentId: string, doctorId: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, slot: { doctorId } },
      include: { slot: true },
    });
    if (!appt) throw new NotFoundException('Appointment not found or unauthorized');
    if (appt.status !== 'PENDING') throw new BadRequestException('Appointment is not pending');

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' },
    });

    await this.notificationsService.createNotification(
      appt.patientId,
      'appointment:rejected',
      'Appointment Declined',
      `Your appointment request for ${appt.slot.startTime.toLocaleString()} was declined by the doctor.`,
      { appointmentId: appt.id }
    );

    return updated;
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
                profile: { select: { firstName: true, lastName: true, profilePictureUrl: true } },
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
      include: { slot: true },
    });

    if (!appt) throw new NotFoundException('Appointment not found');
    if (appt.status === 'CANCELLED') throw new BadRequestException('Already cancelled');
    if (appt.status === 'CANCEL_PENDING') throw new BadRequestException('Cancellation already pending doctor approval');

    // PENDING: slot not yet blocked — cancel immediately
    if (appt.status === 'PENDING') {
      const updated = await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' },
        include: { slot: true },
      });
      await this.notificationsService.createNotification(
        appt.slot.doctorId,
        'appointment:cancelled',
        'Appointment Cancelled',
        `An appointment request for ${appt.slot.startTime.toLocaleString()} was cancelled by the patient.`,
        { appointmentId }
      );
      return updated;
    }

    // CONFIRMED / RESCHEDULED: require doctor approval
    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCEL_PENDING' },
      include: { slot: true },
    });

    await this.notificationsService.createNotification(
      appt.slot.doctorId,
      'appointment:cancel_requested',
      'Cancellation Request',
      `A patient has requested to cancel their appointment on ${appt.slot.startTime.toLocaleString()}. Please approve or decline.`,
      { appointmentId }
    );
    await this.notificationsService.createNotification(
      patientId,
      'appointment:cancel_requested',
      'Cancellation Request Sent',
      `Your cancellation request for ${appt.slot.startTime.toLocaleString()} is awaiting doctor approval.`,
      { appointmentId }
    );

    return updated;
  }

  async approveCancellation(appointmentId: string, doctorId: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, slot: { doctorId } },
      include: { slot: true },
    });

    if (!appt) throw new NotFoundException('Appointment not found or unauthorized');
    if (appt.status !== 'CANCEL_PENDING') throw new BadRequestException('No pending cancellation request');

    const [updatedAppt] = await this.prisma.$transaction([
      this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' },
        include: { slot: true },
      }),
      this.prisma.consultationSlot.update({
        where: { id: appt.slotId },
        data: { isAvailable: true },
      }),
    ]);

    await this.notificationsService.createNotification(
      appt.patientId,
      'appointment:cancelled',
      'Cancellation Approved',
      `Your cancellation request for ${appt.slot.startTime.toLocaleString()} has been approved.`,
      { appointmentId }
    );

    return updatedAppt;
  }

  async rejectCancellation(appointmentId: string, doctorId: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, slot: { doctorId } },
      include: { slot: true },
    });

    if (!appt) throw new NotFoundException('Appointment not found or unauthorized');
    if (appt.status !== 'CANCEL_PENDING') throw new BadRequestException('No pending cancellation request');

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CONFIRMED' },
      include: { slot: true },
    });

    await this.notificationsService.createNotification(
      appt.patientId,
      'appointment:cancel_rejected',
      'Cancellation Declined',
      `Your cancellation request for ${appt.slot.startTime.toLocaleString()} was declined. Your appointment remains confirmed.`,
      { appointmentId }
    );

    return updated;
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
        medicalRecords: { orderBy: { createdAt: 'desc' } },
        prescriptions:  { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async updateNotes(appointmentId: string, doctorId: string, notes: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, slot: { doctorId } },
    });
    if (!appt) throw new Error('Appointment not found or unauthorized');

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { notes },
    });
  }

  async complete(appointmentId: string, doctorId: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, slot: { doctorId } },
      include: { slot: true },
    });

    if (!appt) throw new Error('Appointment not found or unauthorized');
    if (appt.status === 'COMPLETED') throw new Error('Already completed');

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'COMPLETED' },
    });

    await this.notificationsService.createNotification(
      appt.patientId,
      'appointment:completed',
      'Consultation Completed',
      `Your consultation on ${appt.slot.startTime.toLocaleString()} has been marked as completed.`,
      { appointmentId: appt.id }
    );

    this.notificationsService.emitConsultationEnded(appt.patientId, appointmentId);

    await this.messagesService.sendSystemMessage(
      appointmentId,
      `Consultation completed on ${appt.slot.startTime.toLocaleDateString()}. You can continue your follow-up here.`,
    );

    return updated;
  }

  async rateDoctor(appointmentId: string, patientId: string, rating: number, review?: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, patientId, status: 'COMPLETED' },
      include: { slot: true },
    });

    if (!appt) throw new NotFoundException('Completed appointment not found');

    return this.prisma.doctorRating.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        patientId,
        doctorId: appt.slot.doctorId,
        rating,
        review,
      },
      update: { rating, review },
    });
  }
}
