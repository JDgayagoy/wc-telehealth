'use client';

import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import axios from '@/lib/axios';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    getDay, isSameDay, addMonths, subMonths, isSameMonth,
    isToday, isFuture,
} from 'date-fns';
import {
    Calendar, ChevronLeft, ChevronRight, Clock, Plus,
    Trash2, Power, TrendingUp, Users, XCircle, Timer, Sparkles,
} from 'lucide-react';
import { AddScheduleModal } from '@/components/AddScheduleModal';

export default function DoctorSchedulePage() {
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchSlots = useCallback(async () => {
        try {
            const res = await axios.get('/schedules/slots');
            setSlots(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSlots(); }, [fetchSlots]);

    useEffect(() => {
        window.addEventListener('focus', fetchSlots);
        return () => window.removeEventListener('focus', fetchSlots);
    }, [fetchSlots]);

    const generateSlots = async () => {
        if (!confirm('Generate default 9AM–5PM slots for the next 30 days (weekdays only)? Existing slots are kept.')) return;
        try {
            setLoading(true);
            await axios.post('/schedules/generate');
            await fetchSlots();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to generate slots.');
            setLoading(false);
        }
    };

    const toggleSlot = async (slotId: string) => {
        try {
            await axios.patch(`/schedules/slots/${slotId}/toggle`);
            setSlots(prev => prev.map(s => s.id === slotId ? { ...s, isAvailable: !s.isAvailable } : s));
        } catch { toast.error('Failed to toggle slot.'); }
    };

    const deleteSlot = async (slotId: string) => {
        if (!confirm('Delete this slot?')) return;
        try {
            await axios.delete(`/schedules/slots/${slotId}`);
            setSlots(prev => prev.filter(s => s.id !== slotId));
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to delete slot.');
        }
    };

    // --- Derived stats ---
    const totalSlots = slots.length;
    const bookedSlots = slots.filter(s => s.appointments?.some((a: any) => a.status !== 'CANCELLED')).length;
    const bookingRate = totalSlots > 0 ? ((bookedSlots / totalSlots) * 100).toFixed(1) : '0';
    const cancelledSlots = slots.filter(s =>
        s.appointments?.some((a: any) => a.status === 'CANCELLED')
    ).length;

    // --- Calendar ---
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPadding = getDay(monthStart); // 0=Sun

    const selectedDaySlots = slots
        .filter(s => isSameDay(new Date(s.startTime), selectedDate))
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const getSlotsForDay = (day: Date) => slots.filter(s => isSameDay(new Date(s.startTime), day));

    if (loading && slots.length === 0) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="px-6 lg:px-10 py-8 max-w-[1440px] mx-auto">

            {/* Stats Bento */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {[
                    {
                        label: 'Total Slots', value: totalSlots,
                        icon: <Calendar size={20} className="text-blue-700" />,
                        sub: 'All generated slots', subColor: 'text-green-600',
                        subIcon: <TrendingUp size={12} />,
                    },
                    {
                        label: 'Booking Rate', value: `${bookingRate}%`,
                        icon: <Users size={20} className="text-cyan-700" />,
                        sub: bookedSlots > 0 ? 'Optimal capacity' : 'No bookings yet', subColor: 'text-green-600',
                        subIcon: <TrendingUp size={12} />,
                    },
                    {
                        label: 'Cancellations', value: cancelledSlots,
                        icon: <XCircle size={20} className="text-red-500" />,
                        sub: 'Total cancelled', subColor: 'text-gray-500',
                    },
                    {
                        label: 'Slot Duration', value: '30m',
                        icon: <Timer size={20} className="text-gray-500" />,
                        sub: 'Per consultation', subColor: 'text-gray-500',
                    },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between gap-3">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</span>
                            {stat.icon}
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                            <div className={`text-xs font-medium flex items-center gap-1 mt-1 ${stat.subColor}`}>
                                {stat.subIcon}
                                {stat.sub}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-12 gap-6">

                {/* Calendar — col 8 */}
                <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Calendar Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xl font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h3>
                            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => {
                                        const m = subMonths(currentMonth, 1);
                                        setCurrentMonth(m);
                                        setSelectedDate(isSameMonth(m, new Date()) ? new Date() : startOfMonth(m));
                                    }}
                                    className="p-2 hover:bg-gray-50 border-r border-gray-200 transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        const m = addMonths(currentMonth, 1);
                                        setCurrentMonth(m);
                                        setSelectedDate(isSameMonth(m, new Date()) ? new Date() : startOfMonth(m));
                                    }}
                                    className="p-2 hover:bg-gray-50 transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={generateSlots}
                                className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Auto-Generate
                            </button>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="px-4 py-2 text-xs font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-1"
                            >
                                <Plus size={14} /> Add Slot
                            </button>
                        </div>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 text-center bg-gray-50 border-b border-gray-100">
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                            <div key={d} className="py-3 text-xs font-semibold text-gray-400 tracking-wider">{d}</div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-px bg-gray-100 p-px">
                        {/* Padding cells */}
                        {Array.from({ length: startPadding }).map((_, i) => (
                            <div key={`pad-${i}`} className="h-24 bg-gray-50/60 p-2" />
                        ))}

                        {daysInMonth.map(day => {
                            const daySlots = getSlotsForDay(day);
                            const booked = daySlots.filter(s => s.appointments?.some((a: any) => a.status !== 'CANCELLED')).length;
                            const available = daySlots.filter(s => s.isAvailable && !s.appointments?.some((a: any) => a.status !== 'CANCELLED')).length;
                            const isSelected = isSameDay(day, selectedDate);
                            const todayDay = isToday(day);

                            return (
                                <div
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={`h-24 bg-white p-2 flex flex-col justify-between cursor-pointer transition-all border-2
                                        ${isSelected ? 'border-blue-700 bg-blue-50/30' : 'border-transparent hover:border-blue-200'}
                                    `}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                                            ${todayDay ? 'bg-blue-700 text-white' : 'text-gray-700'}
                                        `}>
                                            {format(day, 'd')}
                                        </span>
                                        {daySlots.length > 0 && (
                                            <div className="w-2 h-2 rounded-full bg-cyan-600" />
                                        )}
                                    </div>
                                    {daySlots.length > 0 && (
                                        <div className="space-y-1">
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-700 rounded-full"
                                                    style={{ width: `${Math.min((booked / Math.max(daySlots.length, 1)) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-medium">{available} open</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Panel */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

                    {/* Day Slots */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-gray-100 bg-white flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-900">
                                Time Slots — {format(selectedDate, 'MMM d')}
                            </h3>
                            <span className="text-xs text-gray-400">{selectedDaySlots.length} slots</span>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[520px] p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                            {selectedDaySlots.length === 0 ? (
                                <div className="h-32 flex flex-col items-center justify-center text-gray-400 gap-2">
                                    <Clock size={24} className="text-gray-300" />
                                    <p className="text-sm">No slots on this day</p>
                                </div>
                            ) : (
                                selectedDaySlots.map(slot => {
                                    const activeAppts = (slot.appointments ?? []).filter((a: any) => a.status !== 'CANCELLED');
                                    const hasAppt = activeAppts.length > 0;
                                    const patient = hasAppt ? activeAppts[0].patient?.profile : null;

                                    return (
                                        <div
                                            key={slot.id}
                                            className={`flex items-center gap-4 p-3 rounded-lg border group transition-colors
                                                ${hasAppt ? 'bg-gray-50 border-gray-200' :
                                                  slot.isAvailable ? 'border-gray-200 hover:bg-gray-50' :
                                                  'bg-gray-50/50 border-gray-100 opacity-60'}
                                            `}
                                        >
                                            {/* Time */}
                                            <div className="w-14 text-center shrink-0">
                                                <div className="text-sm font-bold text-gray-900">{format(new Date(slot.startTime), 'hh:mm')}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">{format(new Date(slot.startTime), 'a').toUpperCase()}</div>
                                            </div>

                                            {/* Content */}
                                            <div className={`flex-1 border-l-2 pl-3
                                                ${hasAppt ? 'border-blue-700' :
                                                  slot.isAvailable ? 'border-green-400' : 'border-gray-200'}
                                            `}>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {hasAppt && patient
                                                            ? `${patient.firstName} ${patient.lastName}`
                                                            : slot.isAvailable ? 'Empty Slot' : 'Blocked'}
                                                    </p>
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full
                                                        ${hasAppt ? 'bg-blue-100 text-blue-700' :
                                                          slot.isAvailable ? 'bg-green-100 text-green-700' :
                                                          'bg-gray-100 text-gray-500'}
                                                    `}>
                                                        {hasAppt ? 'Booked' : slot.isAvailable ? 'Available' : 'Blocked'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {hasAppt ? activeAppts[0].status : slot.isAvailable ? 'Open for booking' : 'System blocked'}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            {!hasAppt && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    <button
                                                        onClick={() => toggleSlot(slot.id)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                                        title={slot.isAvailable ? 'Block slot' : 'Unblock slot'}
                                                    >
                                                        <Power size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteSlot(slot.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete slot"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}

                            {/* Footer */}
                            <div className="pt-2 border-t border-gray-100 text-center">
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="text-blue-700 text-sm font-semibold hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                                >
                                    + Add Custom Slot
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Smart Optimizer card */}
                    <div className="bg-blue-700 text-white rounded-xl p-5 shadow-lg relative overflow-hidden">
                        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-3xl" />
                        <h4 className="text-sm font-bold mb-1 flex items-center gap-2">
                            <Sparkles size={16} /> Smart Optimizer
                        </h4>
                        <p className="text-xs text-blue-100 mb-4 leading-relaxed">
                            {slots.filter(s => !s.isAvailable && s.appointments?.length === 0).length} blocked slots detected.
                            Generate a fresh schedule to maximize availability.
                        </p>
                        <button
                            onClick={generateSlots}
                            className="bg-white text-blue-700 text-xs font-bold px-4 py-2 rounded-lg w-full hover:bg-blue-50 transition-colors"
                        >
                            Reorganize Schedule
                        </button>
                    </div>
                </div>
            </div>

            <AddScheduleModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                onSuccess={() => { fetchSlots(); }}
                selectedDate={selectedDate}
            />

            {/* FAB */}
            <div className="fixed bottom-8 right-8 z-50">
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-100 text-blue-700 h-14 px-6 rounded-full shadow-lg flex items-center gap-3 hover:scale-105 active:scale-95 transition-all font-semibold text-sm"
                >
                    <Plus size={20} /> New Schedule Block
                </button>
            </div>
        </div>
    );
}
