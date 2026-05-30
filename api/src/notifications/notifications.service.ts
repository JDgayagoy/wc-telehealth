import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async createNotification(userId: string, type: string, title: string, message: string, metadata?: any) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Push the notification via WebSocket to the specific user's room
    this.gateway.server.to(userId).emit('notification', notification);

    return notification;
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  emitConsultationEnded(patientId: string, appointmentId: string) {
    this.gateway.server.to(patientId).emit('consultation:ended', { appointmentId });
  }

  emitMessage(toUserId: string, message: any) {
    this.gateway.server.to(toUserId).emit('message:new', message);
  }

  emitConversationClosed(toUserId: string, appointmentId: string) {
    this.gateway.server.to(toUserId).emit('conversation:closed', { appointmentId });
  }
}
