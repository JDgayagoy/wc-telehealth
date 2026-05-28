import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addDays, setHours, setMinutes, startOfDay } from 'date-fns';

@Injectable()
export class DoctorsService {
    constructor(private prisma: PrismaService) { }

    async generateDefaultSlots(doctorId: string) {
        const slots: {
            doctorId: string;
            startTime: Date;
            endTime: Date;
            isAvailable: boolean;
        }[] = [];

        const today = startOfDay(new Date());

        for (let day = 1; day <= 30; day++) {
            const date = addDays(today, day);
            const dayOfWeek = date.getDay();

            if (dayOfWeek === 0 || dayOfWeek === 6) continue;

            const hours = [9, 9.5, 10, 10.5, 11, 11.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5];

            for (const hour of hours) {
                const h = Math.floor(hour);
                const m = hour % 1 === 0.5 ? 30 : 0;

                const startTime = setMinutes(setHours(date, h), m);
                const endTime = setMinutes(setHours(date, m === 30 ? h + 1 : h), m === 30 ? 0 : 30);

                slots.push({ doctorId, startTime, endTime, isAvailable: true });
            }
        }

        await this.prisma.consultationSlot.createMany({ data: slots });
    }

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