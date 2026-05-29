import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHistoryDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
    constructor(private prisma: PrismaService) { }

    create(userId: string, dto: CreateHistoryDto) {
        return this.prisma.medicalHistory.create({
            data: {
                userId,
                condition: dto.condition,
                description: dto.description,
                isActive: dto.isActive,
                diagnosedAt: dto.diagnosedAt ? new Date(dto.diagnosedAt) : null,
            },
        });
    }

    findAll(userId: string) {
        return this.prisma.medicalHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    findOne(userId: string, id: string) {
        return this.prisma.medicalHistory.findUnique({
            where: { userId, id },
        });
    }

    update(userId: string, id: string, dto: CreateHistoryDto) {
        return this.prisma.medicalHistory.update({
            where: { userId, id },
            data: {
                condition: dto.condition,
                description: dto.description,
                isActive: dto.isActive,
                diagnosedAt: dto.diagnosedAt ? new Date(dto.diagnosedAt) : undefined,
            },
        });
    }

    delete(userId: string, id: string) {
        return this.prisma.medicalHistory.delete({
            where: { userId, id },
        });
    }

    // Doctor-facing: get a specific patient's prescriptions
    getPatientPrescriptions(patientId: string) {
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

    // Doctor-facing: get a specific patient's medical records
    getPatientMedicalRecords(patientId: string) {
        return this.prisma.medicalRecord.findMany({
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
}
