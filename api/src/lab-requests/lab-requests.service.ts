import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateLabRequestDto } from './dto/create-lab-request.dto';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class LabRequestsService {
    constructor(
        private prisma: PrismaService,
        private notifications: NotificationsService,
    ) {}

    async create(doctorId: string, dto: CreateLabRequestDto) {
        const appointment = await this.prisma.appointment.findFirst({
            where: { id: dto.appointmentId, slot: { doctorId } },
            include: { slot: true },
        });
        if (!appointment) throw new NotFoundException('Appointment not found or unauthorized');

        const labRequest = await this.prisma.labRequest.create({
            data: {
                appointmentId: dto.appointmentId,
                doctorId,
                testName: dto.testName,
                instructions: dto.instructions,
            },
            include: { doctor: { select: { profile: { select: { firstName: true, lastName: true } } } } },
        });

        await this.notifications.createNotification(
            appointment.patientId,
            'lab:requested',
            'Lab Test Required',
            `Dr. ${labRequest.doctor.profile?.firstName} ${labRequest.doctor.profile?.lastName} has requested a "${dto.testName}" lab test before your consultation on ${appointment.slot.startTime.toLocaleDateString()}. Please upload your result before the appointment.`,
            { appointmentId: dto.appointmentId, labRequestId: labRequest.id },
        );

        return labRequest;
    }

    async getByAppointment(appointmentId: string, userId: string) {
        const appointment = await this.prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                OR: [
                    { patientId: userId },
                    { slot: { doctorId: userId } },
                ],
            },
        });
        if (!appointment) throw new ForbiddenException('Access denied');

        return this.prisma.labRequest.findMany({
            where: { appointmentId },
            include: {
                result: true,
                doctor: { select: { profile: { select: { firstName: true, lastName: true } } } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async uploadResult(labRequestId: string, patientId: string, file: Express.Multer.File) {
        const labRequest = await this.prisma.labRequest.findFirst({
            where: { id: labRequestId, appointment: { patientId } },
            include: { appointment: { include: { slot: true } }, doctor: { select: { profile: true } } },
        });
        if (!labRequest) throw new NotFoundException('Lab request not found or unauthorized');

        const fileUrl = `/uploads/lab-results/${file.filename}`;
        const fileType = file.mimetype.startsWith('image') ? 'image' : 'pdf';

        await this.prisma.labResult.upsert({
            where: { labRequestId },
            create: { labRequestId, fileUrl, fileName: file.originalname, fileType },
            update: { fileUrl, fileName: file.originalname, fileType },
        });

        const updated = await this.prisma.labRequest.update({
            where: { id: labRequestId },
            data: { status: 'UPLOADED' },
            include: { result: true },
        });

        await this.notifications.createNotification(
            labRequest.doctorId,
            'lab:uploaded',
            'Lab Result Uploaded',
            `A patient has uploaded the result for "${labRequest.testName}". Review before the consultation.`,
            { appointmentId: labRequest.appointmentId, labRequestId },
        );

        return updated;
    }

    async markReviewed(labRequestId: string, doctorId: string) {
        const req = await this.prisma.labRequest.findFirst({
            where: { id: labRequestId, doctorId },
        });
        if (!req) throw new NotFoundException('Lab request not found or unauthorized');

        return this.prisma.labRequest.update({
            where: { id: labRequestId },
            data: { status: 'REVIEWED' },
            include: { result: true },
        });
    }

    async delete(labRequestId: string, doctorId: string) {
        const req = await this.prisma.labRequest.findFirst({
            where: { id: labRequestId, doctorId, status: 'PENDING' },
        });
        if (!req) throw new NotFoundException('Lab request not found, unauthorized, or already has a result');
        return this.prisma.labRequest.delete({ where: { id: labRequestId } });
    }
}
