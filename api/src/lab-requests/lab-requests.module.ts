import { Module } from '@nestjs/common';
import { LabRequestsController } from './lab-requests.controller';
import { LabRequestsService } from './lab-requests.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, NotificationsModule],
    controllers: [LabRequestsController],
    providers: [LabRequestsService],
})
export class LabRequestsModule {}
