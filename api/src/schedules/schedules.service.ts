import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addDays, setHours, setMinutes, startOfDay } from 'date-fns';

@Injectable()
export class SchedulesService {
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

            // Skip weekends
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

        return { message: `Generated ${slots.length} slots for the next 30 days.` };
    }

    async getMySlots(doctorId: string) {
        return this.prisma.consultationSlot.findMany({
            where: { doctorId },
            include: {
                appointments: {
                    select: {
                        id: true,
                        status: true,
                        patient: {
                            select: {
                                profile: { select: { firstName: true, lastName: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { startTime: 'asc' },
        });
    }

    async toggleSlotAvailability(slotId: string, doctorId: string) {
        const slot = await this.prisma.consultationSlot.findUnique({
            where: { id: slotId },
        });

        if (!slot) throw new NotFoundException('Slot not found');
        if (slot.doctorId !== doctorId) throw new ForbiddenException('Not your slot');

        return this.prisma.consultationSlot.update({
            where: { id: slotId },
            data: { isAvailable: !slot.isAvailable },
        });
    }

    async deleteSlot(slotId: string, doctorId: string) {
        const slot = await this.prisma.consultationSlot.findUnique({
            where: { id: slotId },
            include: { appointments: true },
        });

        if (!slot) throw new NotFoundException('Slot not found');
        if (slot.doctorId !== doctorId) throw new ForbiddenException('Not your slot');
        if (slot.appointments.length > 0) {
            throw new ForbiddenException('Cannot delete a slot with existing appointments');
        }

        return this.prisma.consultationSlot.delete({
            where: { id: slotId },
        });
    }

    async addCustomSchedule(doctorId: string, data: any) {
        const { days, timeRanges, repeat, endDate } = data;
        const slots: { doctorId: string; startTime: Date; endTime: Date; isAvailable: boolean }[] = [];
        const today = startOfDay(new Date());

        let limitDate = today;
        if (repeat === 'none') {
            limitDate = addDays(today, 7); // just the next 7 days (current week context)
        } else if (repeat === 'weekly' && !endDate) {
            limitDate = addDays(today, 90); // default indefinite to 90 days
        } else if (endDate) {
            limitDate = new Date(endDate);
        }

        const totalDays = Math.ceil((limitDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

        for (let i = 0; i <= totalDays; i++) {
            const date = addDays(today, i);
            const dayOfWeek = date.getDay();

            if (days.includes(dayOfWeek)) {
                for (const range of timeRanges) {
                    const [startH, startM] = range.startTime.split(':').map(Number);
                    const [endH, endM] = range.endTime.split(':').map(Number);

                    // Generate 30 min chunks
                    let current = setMinutes(setHours(date, startH), startM);
                    const end = setMinutes(setHours(date, endH), endM);

                    while (current < end) {
                        const next = addDays(current, 0); // copy date
                        next.setMinutes(next.getMinutes() + 30);
                        if (next > end) break; // Don't overshoot

                        slots.push({
                            doctorId,
                            startTime: current,
                            endTime: next,
                            isAvailable: true
                        });
                        current = next;
                    }
                }
            }
        }

        // Ideally check for overlaps here, but for simplicity we'll just insert and let Prisma/logic handle or allow multiple
        // Let's filter out slots that already exist
        const existingSlots = await this.prisma.consultationSlot.findMany({
            where: { doctorId, startTime: { gte: today, lte: limitDate } },
            select: { startTime: true }
        });
        const existingTimes = new Set(existingSlots.map(s => s.startTime.getTime()));

        const newSlots = slots.filter(s => !existingTimes.has(s.startTime.getTime()));

        if (newSlots.length > 0) {
            await this.prisma.consultationSlot.createMany({ data: newSlots });
        }

        return { message: `Added ${newSlots.length} new slots.` };
    }
}
