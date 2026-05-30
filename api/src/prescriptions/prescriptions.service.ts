import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Injectable()
export class PrescriptionsService {
    constructor(private prisma: PrismaService) { }

    create(doctorId: string, dto: CreatePrescriptionDto) {
        return this.prisma.prescription.create({
            data: {
                doctorId,
                patientId: dto.patientId,
                medication: dto.medication,
                dosage: dto.dosage,
                instructions: dto.instructions,
            },
            include: {
                patient: { select: { profile: { select: { firstName: true, lastName: true } } } },
            },
        });
    }

    async batchCreate(doctorId: string, dtos: CreatePrescriptionDto[]) {
        const data = dtos.map(dto => ({
            doctorId,
            patientId: dto.patientId,
            medication: dto.medication,
            dosage: dto.dosage,
            instructions: dto.instructions,
            ...(dto.appointmentId ? { appointmentId: dto.appointmentId } : {}),
        }));
        await this.prisma.prescription.createMany({ data });
        return { message: 'Prescriptions added successfully' };
    }

    findByPatient(patientId: string) {
        return this.prisma.prescription.findMany({
            where: { patientId },
            include: {
                doctor: {
                    select: {
                        profile: { select: { firstName: true, lastName: true } },
                        doctorProfile: { select: { specialization: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    findByDoctor(doctorId: string) {
        return this.prisma.prescription.findMany({
            where: { doctorId },
            include: {
                patient: { select: { profile: { select: { firstName: true, lastName: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
