import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DoctorsService {
    constructor(private prisma: PrismaService) { }

    async findAll(specialization?: string) {
        return this.prisma.user.findMany({
            where: {
                role: 'DOCTOR',
                doctorProfile: specialization
                    ? { specialization: { contains: specialization, mode: 'insensitive' } }
                    : { isNot: null },
            },
            select: {
                id: true,
                profile: {
                    select: { firstName: true, lastName: true, profilePictureUrl: true },
                },
                doctorProfile: {
                    select: {
                        specialization: true,
                        bio: true,
                        yearsOfExperience: true,
                    },
                },
                consultationSlots: {
                    where: { isAvailable: true, startTime: { gte: new Date() } },
                    orderBy: { startTime: 'asc' },
                    take: 5,
                },
            },
        });
    }

    async findOne(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                profile: true,
                doctorProfile: true,
                consultationSlots: {
                    where: { isAvailable: true, startTime: { gte: new Date() } },
                    orderBy: { startTime: 'asc' },
                },
            },
        });
    }

    async getSlots(doctorId: string) {
        return this.prisma.consultationSlot.findMany({
            where: {
                doctorId,
                isAvailable: true,
                startTime: { gte: new Date() },
            },
            orderBy: { startTime: 'asc' },
        });
    }
}