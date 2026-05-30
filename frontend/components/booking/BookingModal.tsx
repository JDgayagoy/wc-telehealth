'use client';

import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from '@/lib/axios';
import {
    format, isSameDay, startOfMonth, endOfMonth,
    eachDayOfInterval, getDay, addMonths, subMonths, isToday,
} from 'date-fns';
import { X, ChevronLeft, ChevronRight, Star, Sun, Sunset, ArrowRight, User, ShieldCheck } from 'lucide-react';
import { z } from 'zod';

const bookingSchema = z.object({
    slotId: z.string().min(1),
    reason: z.string().max(500).optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface Slot { id: string; startTime: string; endTime: string; }

interface Doctor {
    id: string;
    profile: { firstName: string; lastName: string; profilePictureUrl?: string };
    doctorProfile: { specialization: string | string[]; bio: string; yearsOfExperience: number };
}

interface Props {
    doctor: Doctor | null;
    onClose: () => void;
    onBooked: () => void;
}

function getSpecDisplay(spec: string | string[]): string {
    if (Array.isArray(spec)) return spec[0] ?? '';
    return spec;
}

export default function BookingModal({ doctor, onClose, onBooked }: Props) {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { register, handleSubmit, setValue, watch, reset, formState: { isSubmitting } } =
        useForm<BookingFormData>({
            resolver: zodResolver(bookingSchema),
            defaultValues: { slotId: '', reason: '' },
        });

    const selectedSlotId = watch('slotId');
    const selectedSlot = slots.find(s => s.id === selectedSlotId) ?? null;

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!doctor) return;
        setLoading(true);
        setSlots([]);
        setSelectedDate(null);
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

    const datesWithSlots = new Set(slots.map(s => format(new Date(s.startTime), 'yyyy-MM-dd')));

    const slotsForDay = selectedDate
        ? slots.filter(s => isSameDay(new Date(s.startTime), selectedDate))
        : [];

    const morningSlots = slotsForDay.filter(s => new Date(s.startTime).getHours() < 12);
    const afternoonSlots = slotsForDay.filter(s => new Date(s.startTime).getHours() >= 12);

    const onSubmit = async (data: BookingFormData) => {
        try {
            await axios.post('/appointments', data);
            onBooked();
            onClose();
        } catch (e: any) {
            toast.error(e.response?.data?.message ?? 'Booking failed.');
        }
    };

    const specialization = getSpecDisplay(doctor.doctorProfile?.specialization);

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[55] bg-gray-900/55 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                <div className="bg-white w-full max-w-[960px] max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

                    {/* ── Left: Doctor Profile ── */}
                    <div className="md:w-[38%] bg-gray-50 border-r border-gray-100 p-8 flex flex-col items-center text-center overflow-y-auto">
                        {/* Avatar */}
                        <div className="relative mb-5">
                            <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-blue-100">
                                {doctor.profile?.profilePictureUrl ? (
                                    <img src={doctor.profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                                        <User size={40} className="text-blue-300" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-gray-50" />
                        </div>

                        <h2 className="text-xl font-bold text-gray-900">
                            Dr. {doctor.profile?.firstName} {doctor.profile?.lastName}
                        </h2>
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mt-1 mb-3">{specialization}</p>

                        <div className="flex items-center gap-1.5 mb-5">
                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-bold text-gray-900">4.9</span>
                            <span className="text-xs text-gray-400">(1,240 reviews)</span>
                        </div>

                        {/* Bio */}
                        <div className="text-left w-full mb-5">
                            <h3 className="text-xs font-bold text-gray-900 mb-2">Professional Bio</h3>
                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-4">
                                {doctor.doctorProfile?.bio || 'Experienced specialist dedicated to patient-centered care.'}
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <div className="bg-white border border-gray-100 p-3 rounded-lg text-center">
                                <span className="block text-2xl font-bold text-blue-700">{doctor.doctorProfile?.yearsOfExperience}+</span>
                                <span className="text-xs text-gray-400">Years Exp.</span>
                            </div>
                            <div className="bg-white border border-gray-100 p-3 rounded-lg text-center">
                                <span className="block text-2xl font-bold text-blue-700">5k+</span>
                                <span className="text-xs text-gray-400">Patients</span>
                            </div>
                        </div>

                        {/* Verified badge */}
                        <div className="mt-auto pt-6 flex items-center gap-2 text-gray-400">
                            <ShieldCheck size={16} className="text-blue-700" />
                            <span className="text-xs font-medium">Verified Specialist</span>
                        </div>
                    </div>

                    {/* ── Right: Scheduling ── */}
                    <div className="md:w-[62%] flex flex-col bg-white">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h1 className="text-lg font-bold text-gray-900">Schedule Appointment</h1>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
                            <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin' }}>

                                {/* Calendar */}
                                <section>
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-sm font-bold text-gray-900">Select Date</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-600">{format(currentMonth, 'MMMM yyyy')}</span>
                                            <div className="flex gap-0.5">
                                                <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                                    className="p-1 hover:bg-gray-100 rounded transition-colors">
                                                    <ChevronLeft size={15} />
                                                </button>
                                                <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                                    className="p-1 hover:bg-gray-100 rounded transition-colors">
                                                    <ChevronRight size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Day headers */}
                                    <div className="grid grid-cols-7 text-center mb-2">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                            <div key={i} className="text-xs font-semibold text-gray-400 py-1">{d}</div>
                                        ))}
                                    </div>

                                    {/* Days */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {Array.from({ length: startPadding }).map((_, i) => <div key={`p${i}`} />)}
                                        {days.map(day => {
                                            const key = format(day, 'yyyy-MM-dd');
                                            const hasSlots = datesWithSlots.has(key);
                                            const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                                            const today = isToday(day);

                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    disabled={!hasSlots || isPast}
                                                    onClick={() => { setSelectedDate(day); setValue('slotId', ''); }}
                                                    className={`relative h-10 w-full flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all
                                                        ${isSelected ? 'bg-blue-700 text-white' : ''}
                                                        ${!isSelected && today ? 'ring-2 ring-blue-700 ring-inset text-blue-700' : ''}
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
                                </section>

                                {/* Time Slots */}
                                {selectedDate && (
                                    <section>
                                        <h3 className="text-sm font-bold text-gray-900 mb-4">Select Time Slot</h3>

                                        {loading ? (
                                            <p className="text-xs text-gray-400 text-center py-4">Loading slots…</p>
                                        ) : slotsForDay.length === 0 ? (
                                            <p className="text-xs text-gray-400 text-center py-4">No slots on this day.</p>
                                        ) : (
                                            <>
                                                {morningSlots.length > 0 && (
                                                    <div className="mb-4">
                                                        <div className="flex items-center gap-1.5 mb-2">
                                                            <Sun size={14} className="text-blue-700" />
                                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Morning</span>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {morningSlots.map(slot => (
                                                                <button
                                                                    key={slot.id}
                                                                    type="button"
                                                                    onClick={() => setValue('slotId', slot.id, { shouldValidate: true })}
                                                                    className={`py-3 px-2 border-2 rounded-lg text-sm font-medium transition-all
                                                                        ${selectedSlotId === slot.id
                                                                            ? 'border-blue-700 bg-blue-50 text-blue-700 font-bold'
                                                                            : 'border-gray-200 hover:border-blue-200 text-gray-700'}
                                                                    `}
                                                                >
                                                                    {format(new Date(slot.startTime), 'h:mm a')}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {afternoonSlots.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center gap-1.5 mb-2">
                                                            <Sunset size={14} className="text-blue-700" />
                                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Afternoon</span>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {afternoonSlots.map(slot => (
                                                                <button
                                                                    key={slot.id}
                                                                    type="button"
                                                                    onClick={() => setValue('slotId', slot.id, { shouldValidate: true })}
                                                                    className={`py-3 px-2 border-2 rounded-lg text-sm font-medium transition-all
                                                                        ${selectedSlotId === slot.id
                                                                            ? 'border-blue-700 bg-blue-50 text-blue-700 font-bold'
                                                                            : 'border-gray-200 hover:border-blue-200 text-gray-700'}
                                                                    `}
                                                                >
                                                                    {format(new Date(slot.startTime), 'h:mm a')}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </section>
                                )}

                                {/* Reason */}
                                {selectedSlotId && (
                                    <section>
                                        <h3 className="text-sm font-bold text-gray-900 mb-2">
                                            Reason <span className="text-gray-400 font-normal">(optional)</span>
                                        </h3>
                                        <textarea
                                            {...register('reason')}
                                            rows={2}
                                            placeholder="Briefly describe your concern…"
                                            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-blue-700 transition-colors"
                                        />
                                    </section>
                                )}

                                {/* Booking Summary */}
                                {selectedSlot && (
                                    <section className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white shrink-0">
                                                <ChevronRight size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900">Appointment Summary</h4>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(selectedSlot.startTime), 'MMM d, yyyy')} at {format(new Date(selectedSlot.startTime), 'h:mm a')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="block text-xs text-gray-400">Duration</span>
                                            <span className="text-sm font-bold text-gray-900">30 Minutes</span>
                                        </div>
                                    </section>
                                )}

                                <input type="hidden" {...register('slotId')} />
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!selectedSlotId || isSubmitting}
                                    className="px-6 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-bold hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? 'Booking…' : 'Confirm Appointment'}
                                    <ArrowRight size={15} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
