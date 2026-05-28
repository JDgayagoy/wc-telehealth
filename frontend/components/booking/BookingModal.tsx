'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from '@/lib/axios';
import {
    format, isSameDay, startOfMonth, endOfMonth,
    eachDayOfInterval, getDay, addMonths, subMonths
} from 'date-fns';
import { X, ChevronLeft, ChevronRight, Calendar, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';

const bookingSchema = z.object({
    slotId: z.string().min(1),
    reason: z.string().max(500).optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface Slot {
    id: string;
    startTime: string;
    endTime: string;
}

interface Doctor {
    id: string;
    profile: {
        firstName: string;
        lastName: string;
        profilePictureUrl?: string;
    };
    doctorProfile: {
        specialization: string;
        bio: string;
        yearsOfExperience: number;
    };
}

interface Props {
    doctor: Doctor | null;
    onClose: () => void;
    onBooked: () => void;
}

export default function BookingModal({ doctor, onClose, onBooked }: Props) {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [step, setStep] = useState<'calendar' | 'confirm'>('calendar');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<BookingFormData>({
        resolver: zodResolver(bookingSchema),
        defaultValues: { slotId: '', reason: '' },
    });

    const selectedSlotId = watch('slotId');
    const selectedSlot = slots.find(s => s.id === selectedSlotId) ?? null;

    // needed for createPortal — document isn't available on server
    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!doctor) return;
        setLoading(true);
        setSlots([]);
        setSelectedDate(null);
        setStep('calendar');
        reset();
        axios.get(`/doctors/${doctor.id}/slots`)
            .then(res => setSlots(res.data))
            .finally(() => setLoading(false));
    }, [doctor, reset]);

    if (!doctor || !mounted) return null;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPadding = getDay(monthStart);

    const datesWithSlots = new Set(
        slots.map(s => format(new Date(s.startTime), 'yyyy-MM-dd'))
    );

    const slotsForSelectedDate = selectedDate
        ? slots.filter(s => isSameDay(new Date(s.startTime), selectedDate))
        : [];

    const onSubmit = async (data: BookingFormData) => {
        try {
            await axios.post('/appointments', data);
            onBooked();
            onClose();
        } catch (e: any) {
            alert(e.response?.data?.message ?? 'Booking failed.');
        }
    };

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

                    {/* Header */}
                    <div className="flex items-start justify-between p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                <User size={22} className="text-gray-400" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">
                                    Dr. {doctor.profile?.firstName} {doctor.profile?.lastName}
                                </h2>
                                <Badge variant="secondary" className="text-xs mt-0.5">
                                    {doctor.doctorProfile?.specialization}
                                </Badge>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        {step === 'calendar' ? (
                            <div className="p-6 space-y-5">

                                {/* Calendar nav */}
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-gray-900">
                                        {format(currentMonth, 'MMMM yyyy')}
                                    </span>
                                    <div className="flex gap-1">
                                        <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                            className="p-1.5 rounded-lg hover:bg-gray-100">
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                            className="p-1.5 rounded-lg hover:bg-gray-100">
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Day headers */}
                                <div className="grid grid-cols-7">
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                        <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                                    ))}
                                </div>

                                {/* Day cells */}
                                <div className="grid grid-cols-7 gap-1">
                                    {Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} />)}
                                    {days.map(day => {
                                        const key = format(day, 'yyyy-MM-dd');
                                        const hasSlots = datesWithSlots.has(key);
                                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                                        const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                disabled={!hasSlots || isPast}
                                                onClick={() => { setSelectedDate(day); setValue('slotId', ''); }}
                                                className={`
                                                    relative aspect-square flex flex-col items-center justify-center 
                                                    rounded-lg text-sm font-medium transition-all
                                                    ${isSelected ? 'bg-blue-600 text-white' : ''}
                                                    ${!isSelected && hasSlots && !isPast ? 'hover:bg-blue-50 text-gray-900' : ''}
                                                    ${!hasSlots || isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                {format(day, 'd')}
                                                {hasSlots && !isPast && (
                                                    <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <input type="hidden" {...register('slotId')} />
                                {errors.slotId && (
                                    <p className="text-xs text-red-500">{errors.slotId.message}</p>
                                )}

                                {loading && (
                                    <p className="text-sm text-gray-400 text-center py-2">Loading slots…</p>
                                )}

                                {selectedDate && !loading && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                                            <Clock size={14} /> {format(selectedDate, 'EEEE, MMMM d')}
                                        </p>
                                        {slotsForSelectedDate.length === 0 ? (
                                            <p className="text-sm text-gray-400">No slots on this day.</p>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                {slotsForSelectedDate.map(slot => (
                                                    <button
                                                        key={slot.id}
                                                        type="button"
                                                        onClick={() => setValue('slotId', slot.id, { shouldValidate: true })}
                                                        className={`
                                                            py-2.5 px-3 rounded-xl border text-sm text-left transition-all
                                                            ${selectedSlotId === slot.id
                                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                : 'border-gray-200 hover:border-blue-300 text-gray-700'}
                                                        `}
                                                    >
                                                        <div className="font-medium">{format(new Date(slot.startTime), 'h:mm a')}</div>
                                                        <div className="text-xs text-gray-400">– {format(new Date(slot.endTime), 'h:mm a')}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!selectedDate && !loading && (
                                    <p className="text-sm text-gray-400 text-center py-2">
                                        Select a highlighted date to see available times
                                    </p>
                                )}

                                {selectedSlotId && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            Reason <span className="text-gray-400 font-normal">(optional)</span>
                                        </p>
                                        <Textarea
                                            {...register('reason')}
                                            placeholder="Briefly describe your concern…"
                                            rows={2}
                                            className="resize-none text-sm"
                                        />
                                        {errors.reason && (
                                            <p className="text-xs text-red-500 mt-1">{errors.reason.message}</p>
                                        )}
                                    </div>
                                )}

                                <Button
                                    type="button"
                                    className="w-full"
                                    disabled={!selectedSlotId}
                                    onClick={() => setStep('confirm')}
                                >
                                    <Calendar size={15} className="mr-2" /> Review booking
                                </Button>
                            </div>

                        ) : (
                            <div className="p-6 space-y-4">
                                <h3 className="font-medium text-gray-900">Confirm your appointment</h3>
                                <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                                    {[
                                        { label: 'Doctor', value: `Dr. ${doctor.profile?.firstName} ${doctor.profile?.lastName}` },
                                        { label: 'Specialization', value: doctor.doctorProfile?.specialization },
                                        { label: 'Date', value: selectedDate ? format(selectedDate, 'MMMM d, yyyy') : '' },
                                        { label: 'Time', value: selectedSlot ? `${format(new Date(selectedSlot.startTime), 'h:mm a')} – ${format(new Date(selectedSlot.endTime), 'h:mm a')}` : '' },
                                    ].map(row => (
                                        <div key={row.label} className="flex justify-between px-4 py-3 text-sm">
                                            <span className="text-gray-500">{row.label}</span>
                                            <span className="font-medium text-gray-900">{row.value}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('calendar')}>
                                        Back
                                    </Button>
                                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                                        {isSubmitting ? 'Booking…' : 'Confirm appointment'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </>,
        document.body
    );
}