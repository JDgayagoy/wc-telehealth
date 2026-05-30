import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHistoryDto } from './dto/create-patient.dto';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class PatientsService {
    constructor(private prisma: PrismaService) { }

    create(userId: string, dto: CreateHistoryDto) {
        return this.prisma.medicalHistory.create({
            data: {
                userId,
                condition: dto.condition,
                description: dto.description,
                isActive: dto.isActive ?? true,
                isAllergy: dto.isAllergy ?? false,
                diagnosedAt: dto.diagnosedAt ? new Date(dto.diagnosedAt) : null,
            },
        });
    }

    async getStats(userId: string) {
        return this.prisma.physicalStat.findFirst({
            where: { userId },
            orderBy: { recordedAt: 'desc' },
        });
    }

    async upsertStats(userId: string, weight: number, height: number) {
        const existing = await this.prisma.physicalStat.findFirst({
            where: { userId },
            orderBy: { recordedAt: 'desc' },
        });
        if (existing) {
            return this.prisma.physicalStat.update({
                where: { id: existing.id },
                data: { weight, height, recordedAt: new Date() },
            });
        }
        return this.prisma.physicalStat.create({
            data: { userId, weight, height },
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
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                ...(dto.isAllergy !== undefined && { isAllergy: dto.isAllergy }),
                diagnosedAt: dto.diagnosedAt ? new Date(dto.diagnosedAt) : undefined,
            },
        });
    }

    delete(userId: string, id: string) {
        return this.prisma.medicalHistory.delete({
            where: { userId, id },
        });
    }

    private extractPrimaryDiagnosis(diagnosis: string): string {
        for (const line of diagnosis.split('\n')) {
            if (line.startsWith('Primary: ')) {
                return line.slice('Primary: '.length).trim();
            }
        }
        return diagnosis.trim();
    }

    // Doctor-facing: create a new medical record and sync to patient's medical history
    async createMedicalRecord(doctorId: string, patientId: string, dto: CreateMedicalRecordDto) {
        const [record] = await this.prisma.$transaction([
            this.prisma.medicalRecord.create({
                data: {
                    doctorId,
                    patientId,
                    diagnosis: dto.diagnosis,
                    treatment: dto.treatment,
                    consultationNotes: dto.consultationNotes,
                },
                include: {
                    doctor: {
                        select: {
                            profile: { select: { firstName: true, lastName: true } },
                            doctorProfile: { select: { specialization: true } },
                        },
                    },
                },
            }),
            this.prisma.medicalHistory.create({
                data: {
                    userId: patientId,
                    condition: this.extractPrimaryDiagnosis(dto.diagnosis),
                    isActive: true,
                    diagnosedAt: new Date(),
                },
            }),
        ]);
        return record;
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

    async extractFromFile(file: Express.Multer.File): Promise<{
        condition: string;
        description: string;
        diagnosedAt: string | null;
        isActive: boolean;
    }> {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const base64 = file.buffer.toString('base64');
        const mimeType = file.mimetype as 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';

        const result = await model.generateContent([
            {
                inlineData: { data: base64, mimeType },
            },
            `You are a medical data extractor. Analyze this document and extract medical information.
Return ONLY a JSON object with these exact fields:
{
  "condition": "primary condition or diagnosis name (string)",
  "description": "detailed description of the condition, symptoms, findings (string)",
  "diagnosedAt": "ISO date string if date found, or null",
  "isActive": true or false (true if condition is ongoing/active, false if resolved)
}
No explanation, no markdown, just the JSON object.`,
        ]);

        const raw = result.response.text().trim();
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('AI could not extract data from file');
        return JSON.parse(match[0]);
    }

    // Doctor-facing: create a medical record from an appointment (resolves patientId server-side)
    async createMedicalRecordByAppointment(doctorId: string, appointmentId: string, dto: CreateMedicalRecordDto) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            select: { patientId: true },
        });

        if (!appointment) throw new Error('Appointment not found');

        const [record] = await this.prisma.$transaction([
            this.prisma.medicalRecord.create({
                data: {
                    doctorId,
                    patientId: appointment.patientId,
                    appointmentId,
                    diagnosis: dto.diagnosis,
                    treatment: dto.treatment,
                    consultationNotes: dto.consultationNotes,
                },
                include: {
                    doctor: {
                        select: {
                            profile: { select: { firstName: true, lastName: true } },
                            doctorProfile: { select: { specialization: true } },
                        },
                    },
                },
            }),
            this.prisma.medicalHistory.create({
                data: {
                    userId: appointment.patientId,
                    condition: this.extractPrimaryDiagnosis(dto.diagnosis),
                    isActive: true,
                    diagnosedAt: new Date(),
                },
            }),
        ]);
        return record;
    }

    // Patient-facing: get diagnosis + prescriptions for a specific appointment
    async getAppointmentSummary(patientId: string, appointmentId: string) {
        const [medicalRecord, prescriptions] = await Promise.all([
            this.prisma.medicalRecord.findFirst({
                where: { appointmentId, patientId },
                select: {
                    diagnosis: true,
                    treatment: true,
                    consultationNotes: true,
                    createdAt: true,
                    doctor: {
                        select: { profile: { select: { firstName: true, lastName: true } } },
                    },
                },
            }),
            this.prisma.prescription.findMany({
                where: { appointmentId, patientId },
                select: {
                    medication: true,
                    dosage: true,
                    instructions: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'asc' },
            }),
        ]);

        return { medicalRecord, prescriptions };
    }
}
