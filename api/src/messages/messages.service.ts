import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const PARTICIPANT_SELECT = {
    id: true,
    profile: { select: { firstName: true, lastName: true, profilePictureUrl: true } },
};

const MESSAGE_INCLUDE = {
    sender: { select: PARTICIPANT_SELECT },
};

@Injectable()
export class MessagesService {
    constructor(
        private prisma: PrismaService,
        private notifications: NotificationsService,
    ) {}

    private async assertParticipant(appointmentId: string, userId: string) {
        const appt = await this.prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                OR: [{ patientId: userId }, { slot: { doctorId: userId } }],
            },
            include: { slot: { select: { doctorId: true } } },
        });
        if (!appt) throw new ForbiddenException('Not a participant of this appointment');
        return appt;
    }

    private async isThreadClosed(appointmentId: string): Promise<boolean> {
        const record = await this.prisma.messageThreadClose.findUnique({
            where: { appointmentId },
        });
        return !!record;
    }

    async closeThread(appointmentId: string, userId: string) {
        const appt = await this.assertParticipant(appointmentId, userId);
        if (appt.slot.doctorId !== userId) throw new ForbiddenException('Only the doctor can close a conversation');

        await this.prisma.messageThreadClose.upsert({
            where: { appointmentId },
            create: { appointmentId, closedBy: userId },
            update: { closedAt: new Date() },
        });

        await this.archiveThread(appointmentId, userId);
        await this.sendSystemMessage(appointmentId, 'This conversation has been closed by the doctor.');

        this.notifications.emitConversationClosed(appt.patientId, appointmentId);

        return { closed: true };
    }

    async sendText(senderId: string, appointmentId: string, content: string) {
        if (!content?.trim()) throw new BadRequestException('Message content required');
        const appt = await this.assertParticipant(appointmentId, senderId);

        if (await this.isThreadClosed(appointmentId)) throw new ForbiddenException('This conversation has been closed');

        const message = await this.prisma.message.create({
            data: { appointmentId, senderId, content: content.trim(), type: 'TEXT' },
            include: MESSAGE_INCLUDE,
        });

        const recipientId = appt.patientId === senderId ? appt.slot.doctorId : appt.patientId;
        this.notifications.emitMessage(recipientId, message);
        this.notifications.emitMessage(senderId, message);

        return message;
    }

    async sendFile(senderId: string, appointmentId: string, file: Express.Multer.File) {
        const appt = await this.assertParticipant(appointmentId, senderId);

        if (await this.isThreadClosed(appointmentId)) throw new ForbiddenException('This conversation has been closed');

        const fileUrl = `/uploads/messages/${file.filename}`;
        const fileType = file.mimetype.startsWith('image') ? 'image' : 'pdf';

        const message = await this.prisma.message.create({
            data: {
                appointmentId, senderId, type: 'FILE',
                fileUrl, fileName: file.originalname, fileType,
            },
            include: MESSAGE_INCLUDE,
        });

        const recipientId = appt.patientId === senderId ? appt.slot.doctorId : appt.patientId;
        this.notifications.emitMessage(recipientId, message);
        this.notifications.emitMessage(senderId, message);

        return message;
    }

    async getMessages(appointmentId: string, userId: string) {
        await this.assertParticipant(appointmentId, userId);
        return this.prisma.message.findMany({
            where: { appointmentId },
            include: MESSAGE_INCLUDE,
            orderBy: { createdAt: 'asc' },
        });
    }

    async markRead(appointmentId: string, userId: string) {
        await this.assertParticipant(appointmentId, userId);
        return this.prisma.message.updateMany({
            where: { appointmentId, senderId: { not: userId }, readAt: null },
            data: { readAt: new Date() },
        });
    }

    async archiveThread(appointmentId: string, userId: string) {
        await this.assertParticipant(appointmentId, userId);
        return this.prisma.messageThreadArchive.upsert({
            where: { appointmentId_userId: { appointmentId, userId } },
            create: { appointmentId, userId },
            update: { archivedAt: new Date() },
        });
    }

    async unarchiveThread(appointmentId: string, userId: string) {
        await this.assertParticipant(appointmentId, userId);
        return this.prisma.messageThreadArchive.deleteMany({
            where: { appointmentId, userId },
        });
    }

    async getThreads(userId: string, archived = false) {
        const archivedIds = (await this.prisma.messageThreadArchive.findMany({
            where: { userId },
            select: { appointmentId: true },
        })).map(a => a.appointmentId);

        const appointments = await this.prisma.appointment.findMany({
            where: {
                OR: [{ patientId: userId }, { slot: { doctorId: userId } }],
                status: { in: ['CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCEL_PENDING'] },
                id: archived
                    ? { in: archivedIds }
                    : { notIn: archivedIds },
            },
            select: {
                id: true, status: true, reason: true,
                patientId: true,
                slot: {
                    select: {
                        startTime: true, endTime: true, doctorId: true,
                        doctor: { select: PARTICIPANT_SELECT },
                    },
                },
                patient: { select: PARTICIPANT_SELECT },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { id: true, content: true, type: true, createdAt: true, senderId: true, fileName: true },
                },
            },
        });

        const appointmentIds = appointments.map(a => a.id);
        const unreadGroups = await this.prisma.message.groupBy({
            by: ['appointmentId'],
            where: { appointmentId: { in: appointmentIds }, senderId: { not: userId }, readAt: null },
            _count: { id: true },
        });
        const unreadMap = new Map(unreadGroups.map(u => [u.appointmentId, u._count.id]));

        const closedIds = new Set(
            (await this.prisma.messageThreadClose.findMany({
                where: { appointmentId: { in: appointmentIds } },
                select: { appointmentId: true },
            })).map(c => c.appointmentId)
        );

        const archivedSet = new Set(archivedIds);
        return appointments
            .map(a => ({
                appointmentId: a.id,
                status: a.status,
                reason: a.reason,
                slot: { startTime: a.slot.startTime, endTime: a.slot.endTime },
                otherUser: a.slot.doctorId === userId ? a.patient : a.slot.doctor,
                lastMessage: a.messages[0] ?? null,
                unreadCount: unreadMap.get(a.id) ?? 0,
                isArchived: archivedSet.has(a.id),
                isClosed: closedIds.has(a.id),
            }))
            .sort((a, b) => {
                const aT = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
                const bT = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
                return bT - aT;
            });
    }

    async sendSystemMessage(appointmentId: string, content: string) {
        const appt = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { slot: { select: { doctorId: true } } },
        });
        if (!appt) return;

        const message = await this.prisma.message.create({
            data: { appointmentId, senderId: appt.slot.doctorId, content, type: 'SYSTEM' },
            include: MESSAGE_INCLUDE,
        });

        this.notifications.emitMessage(appt.patientId, message);
        this.notifications.emitMessage(appt.slot.doctorId, message);

        return message;
    }
}
