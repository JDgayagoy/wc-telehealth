import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { SchedulesModule } from './schedules/schedules.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';


@Module({
  imports: [AuthModule, UsersModule, DoctorsModule, PatientsModule, AppointmentsModule, SchedulesModule, PrescriptionsModule, ConsultationsModule, NotificationsModule, PrismaModule, ProfileModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
