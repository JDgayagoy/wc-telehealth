'use client';

import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from '@/lib/axios';
import {
    format, isSameDay, startOfMonth, endOfMonth,
    eachDayOfInterval, getDay, addMonths, subMonths, isToday,
} from 'date-fns';
import { X, ChevronLeft, ChevronRight, Sun, Sunset, ArrowRight, RotateCcw } from 'lucide-react';

interface Slot { id: string; startTime: string; endTime: string; }

interface Props {
    appointment: { id: string; slot: { startTime: string; doctor: { id: string; profile: { firstName: string; lastName: string } } } } | null;
    onClose: () => void;
    onRequested: () => void;
}

export default function RescheduleModal({ appointment, onClose, onRequested }: Props) {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlotId, setSelectedSlotId] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!appointment) return;
        setLoading(true);
        setSlots([]);
        setSelectedDate(null);
        setSelectedSlotId('');
        axios.get(`/doctors/${appointment.slot.doctor.id}/slots`)
            .then(res => setSlots(res.data))
            .finally(() => setLoading(false));
    }, [appointment]);

    if (!appointment || !mounted) return null;

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

    const handleSubmit = async () => {
        if (!selectedSlotId) return;
        setSubmitting(true);
        try {
            await axios.patch(`/appointments/${appointment.id}/reschedule`, { newSlotId: selectedSlotId });
            onRequested();
            onClose();
        } catch (e: any) {
            toast.error(e.response?.data?.message ?? 'Reschedule request failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedSlot = slots.find(s => s.id === selectedSlotId);

    return createPortal(
        <>
            <div className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <div className="bg-white w-full max-w-[560px] max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                        <div>
                            <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <RotateCcw size={16} className="text-blue-700" /> Request Reschedule
                            </h1>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Dr. {appointment.slot.doctor.profile.firstName} {appointment.slot.doctor.profile.lastName} · currently {format(new Date(appointment.slot.startTime), 'MMM d, h:mm a')}
                            </p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin' }}>

                        {/* Calendar */}
                        <section>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-gray-900">Select New Date</h3>
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

                            <div className="grid grid-cols-7 text-center mb-2">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                    <div key={i} className="text-xs font-semibold text-gray-400 py-1">{d}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: startPadding }).map((_, i) => <div key={`p${i}`} />)}
                                {days.map(day => {
                                    const key = format(day, 'yyyy-MM-dd');
                                    const hasSlots = datesWithSlots.has(key);
                                    const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                                    const today = isToday(day);
                                    return (
                                        <button key={key} type="button"
                                            disabled={!hasSlots || isPast}
                                            onClick={() => { setSelectedDate(day); setSelectedSlotId(''); }}
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
                                <h3 className="text-sm font-bold text-gray-900 mb-4">Select New Time</h3>
                                {loading ? (
                                    <p className="text-xs text-gray-400 text-center py-4">Loading slots…</p>
                                ) : slotsForDay.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-4">No slots on this day.</p>
                                ) : (
                                    <>
                                        {morningSlots.length > 0 && (
                                            <div className="mb-4">
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <Sun size={13} className="text-blue-700" />
                                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Morning</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {morningSlots.map(slot => (
                                                        <button key={slot.id} type="button"
                                                            onClick={() => setSelectedSlotId(slot.id)}
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
                                                    <Sunset size={13} className="text-blue-700" />
                                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Afternoon</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {afternoonSlots.map(slot => (
                                                        <button key={slot.id} type="button"
                                                            onClick={() => setSelectedSlotId(slot.id)}
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

                        {/* Summary */}
                        {selectedSlot && (
                            <section className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">New Appointment Time</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {format(new Date(selectedSlot.startTime), 'MMM d, yyyy')} at {format(new Date(selectedSlot.startTime), 'h:mm a')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-400">Duration</span>
                                    <p className="text-sm font-bold text-gray-900">30 Minutes</p>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                        <button onClick={onClose}
                            className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSubmit} disabled={!selectedSlotId || submitting}
                            className="px-6 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-bold hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                            {submitting ? 'Requesting…' : 'Request Reschedule'}
                            <ArrowRight size={15} />
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
