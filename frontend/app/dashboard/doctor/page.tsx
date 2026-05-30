'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from '@/lib/axios';
import { format, isFuture, isToday, isAfter, subMinutes, differenceInSeconds, isPast } from 'date-fns';
import { Video, Clock, User, ChevronRight, Search, ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function Countdown({ targetTime }: { targetTime: string }) {
    const [secs, setSecs] = useState(() => differenceInSeconds(new Date(targetTime), new Date()));

    useEffect(() => {
        const id = setInterval(() => setSecs(s => s - 1), 1000);
        return () => clearInterval(id);
    }, []);

    if (secs <= 0) return <span className="text-green-300 font-semibold text-xs">Starting now</span>;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-100">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            Starts in {m}:{s.toString().padStart(2, '0')}
        </span>
    );
}

function Initials({ name }: { name: string }) {
    const parts = name.trim().split(' ');
    return <>{parts[0]?.[0] ?? '?'}{parts[1]?.[0] ?? ''}</>;
}

const STATUS_BADGE: Record<string, string> = {
    CONFIRMED:  'bg-blue-100 text-blue-700',
    RESCHEDULED:'bg-purple-100 text-purple-700',
    PENDING:    'bg-yellow-100 text-yellow-700',
    COMPLETED:  'bg-green-100 text-green-700',
    CANCELLED:  'bg-red-100 text-red-600',
};

export default function DoctorDashboard() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [patientSearch, setPatientSearch] = useState('');
    const [patientPage, setPatientPage] = useState(0);

    const PATIENTS_PER_PAGE = 5;

    useEffect(() => {
        Promise.all([
            axios.get('/appointments/doctor'),
            axios.get('/profile'),
        ]).then(([apptRes, profRes]) => {
            setAppointments(apptRes.data);
            setProfile(profRes.data);
        }).catch(console.error)
          .finally(() => setLoading(false));
    }, []);

    const todayCount = useMemo(() =>
        appointments.filter(a => isToday(new Date(a.slot.startTime)) &&
            (a.status === 'CONFIRMED' || a.status === 'RESCHEDULED')).length,
    [appointments]);

    const pendingCount = useMemo(() =>
        appointments.filter(a => a.status === 'PENDING' || a.status === 'RESCHEDULE_PENDING').length,
    [appointments]);

    const nextAppointment = useMemo(() =>
        appointments
            .filter(a => (a.status === 'CONFIRMED' || a.status === 'RESCHEDULED') && isFuture(new Date(a.slot.startTime)))
            .sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime())[0] ?? null,
    [appointments]);

    const todaySchedule = useMemo(() =>
        appointments
            .filter(a => isToday(new Date(a.slot.startTime)) && a.status !== 'CANCELLED')
            .sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime()),
    [appointments]);

    // Unique patients with last visit
    const uniquePatients = useMemo(() => {
        const map = new Map<string, any>();
        [...appointments]
            .sort((a, b) => new Date(b.slot.startTime).getTime() - new Date(a.slot.startTime).getTime())
            .forEach(a => {
                const pid = a.patient?.id;
                if (pid && !map.has(pid)) {
                    map.set(pid, {
                        id: pid,
                        profile: a.patient?.profile,
                        lastVisit: a.slot.startTime,
                        status: a.status,
                        appointmentId: a.id,
                    });
                }
            });
        return Array.from(map.values());
    }, [appointments]);

    const filteredPatients = useMemo(() =>
        uniquePatients.filter(p => {
            const name = `${p.profile?.firstName ?? ''} ${p.profile?.lastName ?? ''}`.toLowerCase();
            return name.includes(patientSearch.toLowerCase());
        }),
    [uniquePatients, patientSearch]);

    const pagedPatients = filteredPatients.slice(patientPage * PATIENTS_PER_PAGE, (patientPage + 1) * PATIENTS_PER_PAGE);
    const totalPatientPages = Math.ceil(filteredPatients.length / PATIENTS_PER_PAGE);

    const isJoinable = (t: string) => isAfter(new Date(), subMinutes(new Date(t), 30));

    const doctorName = profile
        ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
        : 'Doctor';

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
        </div>
    );

    const nextProfile = nextAppointment?.patient?.profile;
    const nextPatientName = nextProfile ? `${nextProfile.firstName} ${nextProfile.lastName}` : 'Patient';

    return (
        <div className="px-6 lg:px-10 py-10 max-w-[1400px] mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Physician Dashboard</h1>
                <p className="text-gray-500 mt-1 text-sm">
                    Welcome back, Dr. {doctorName}. You have {todayCount} appointment{todayCount !== 1 ? 's' : ''} scheduled for today.
                </p>
            </header>

            <div className="grid grid-cols-12 gap-6">

                {/* ── Left col-8 ── */}
                <section className="col-span-12 lg:col-span-8 flex flex-col gap-6">

                    {/* Featured — Next Session */}
                    {nextAppointment ? (
                        <div className="bg-blue-700 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg group">
                            {/* BG icon */}
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                <Video size={120} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest backdrop-blur-md">
                                        Next Session
                                    </span>
                                    <Countdown targetTime={nextAppointment.slot.startTime} />
                                </div>

                                <div className="flex items-end justify-between gap-4">
                                    <div>
                                        <h2 className="text-4xl font-bold leading-tight mb-2">{nextPatientName}</h2>
                                        <p className="text-blue-200 flex items-center gap-2 text-base">
                                            <Clock size={16} />
                                            {format(new Date(nextAppointment.slot.startTime), 'h:mm a')}
                                            {' · '}
                                            {nextAppointment.reason || 'General Consultation'}
                                        </p>
                                    </div>
                                    {isJoinable(nextAppointment.slot.startTime) ? (
                                        <Link href={`/dashboard/doctor/consultation/${nextAppointment.id}`}>
                                            <button className="bg-white text-blue-700 px-7 py-3.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-xl shrink-0 cursor-pointer">
                                                <Video size={18} /> Join Call
                                            </button>
                                        </Link>
                                    ) : (
                                        <button disabled className="bg-white/20 text-white/70 px-7 py-3.5 rounded-xl font-semibold flex items-center gap-2 shrink-0 cursor-not-allowed">
                                            <Video size={18} /> Available 30min before
                                        </button>
                                    )}
                                </div>

                                <div className="mt-7 pt-7 border-t border-white/10 grid grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-1">Date</p>
                                        <p className="text-white font-semibold">{format(new Date(nextAppointment.slot.startTime), 'MMM d, yyyy')}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-1">Consultation</p>
                                        <p className="text-white font-semibold">{nextAppointment.reason || 'General'}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-1">Status</p>
                                        <p className="text-white font-semibold capitalize">{nextAppointment.status.toLowerCase()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-100 border border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3">
                            <Calendar size={36} className="text-gray-300" />
                            <p className="text-gray-500 font-medium">No upcoming appointments</p>
                            <Link href="/dashboard/doctor/schedule">
                                <button className="mt-1 px-5 py-2 bg-blue-700 text-white text-sm font-semibold rounded-xl hover:bg-blue-800 transition-colors cursor-pointer">
                                    Manage Schedule
                                </button>
                            </Link>
                        </div>
                    )}

                    {/* Today's Schedule */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Daily Schedule</h3>
                            <Link href="/dashboard/doctor/appointments" className="flex items-center gap-1 text-sm text-blue-700 font-semibold hover:underline">
                                View Full Calendar <ArrowRight size={14} />
                            </Link>
                        </div>

                        {todaySchedule.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
                                No appointments today.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {todaySchedule.map(appt => {
                                    const p = appt.patient?.profile;
                                    const name = p ? `${p.firstName} ${p.lastName}` : 'Patient';
                                    const joinable = isJoinable(appt.slot.startTime);
                                    const badgeClass = STATUS_BADGE[appt.status] ?? 'bg-gray-100 text-gray-600';

                                    return (
                                        <div key={appt.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center gap-4 hover:shadow-md transition-shadow group">
                                            {/* Time */}
                                            <div className="w-14 text-center border-r border-gray-100 pr-4 shrink-0">
                                                <p className="text-sm font-bold text-blue-700 leading-tight">{format(new Date(appt.slot.startTime), 'h:mm')}</p>
                                                <p className="text-[9px] text-gray-400 uppercase font-semibold">{format(new Date(appt.slot.startTime), 'a')}</p>
                                            </div>

                                            {/* Avatar + info */}
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0 overflow-hidden">
                                                    {p?.profilePictureUrl
                                                        ? <img src={p.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                        : <Initials name={name} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                                                    <p className="text-xs text-gray-400 truncate">{appt.reason || 'General Consultation'} · Virtual</p>
                                                </div>
                                            </div>

                                            {/* Status + action */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${badgeClass}`}>
                                                    {appt.status === 'RESCHEDULE_PENDING' ? 'Reschedule' : appt.status.toLowerCase()}
                                                </span>
                                                {joinable && (appt.status === 'CONFIRMED' || appt.status === 'RESCHEDULED') ? (
                                                    <Link href={`/dashboard/doctor/consultation/${appt.id}`}>
                                                        <button className="text-xs font-semibold px-3 py-1.5 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors cursor-pointer">
                                                            Join
                                                        </button>
                                                    </Link>
                                                ) : (
                                                    <Link href="/dashboard/doctor/appointments">
                                                        <button className="text-xs font-semibold px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors group-hover:border-blue-300 cursor-pointer">
                                                            View Chart
                                                        </button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Right col-4 ── */}
                <aside className="col-span-12 lg:col-span-4 flex flex-col gap-5">

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Patients Today</p>
                            <h4 className="text-4xl font-bold text-blue-700 mt-1">{String(todayCount).padStart(2, '0')}</h4>
                            <p className="text-xs text-gray-400 mt-2">confirmed sessions</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Requests</p>
                            <h4 className="text-4xl font-bold text-cyan-600 mt-1">{String(pendingCount).padStart(2, '0')}</h4>
                            <p className="text-xs text-gray-400 mt-2">awaiting action</p>
                        </div>
                    </div>

                    {/* Patient Directory */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h4 className="text-sm font-bold text-gray-900 mb-3">Patient Directory</h4>
                            <div className="relative">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Filter by name…"
                                    value={patientSearch}
                                    onChange={e => { setPatientSearch(e.target.value); setPatientPage(0); }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-3 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto" style={{ maxHeight: '380px', scrollbarWidth: 'thin' }}>
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Patient</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Visit</th>
                                        <th className="px-4 py-2.5" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pagedPatients.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-xs text-gray-400">
                                                No patients found.
                                            </td>
                                        </tr>
                                    ) : pagedPatients.map(patient => {
                                        const name = patient.profile
                                            ? `${patient.profile.firstName ?? ''} ${patient.profile.lastName ?? ''}`.trim()
                                            : 'Unknown Patient';
                                        const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                                        return (
                                            <tr
                                                key={patient.id}
                                                onClick={() => router.push(`/dashboard/doctor/messages?appointmentId=${patient.appointmentId}`)}
                                                className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold shrink-0 overflow-hidden">
                                                            {patient.profile?.profilePictureUrl
                                                                ? <img src={patient.profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                                : initials}
                                                        </div>
                                                        <p className="text-xs font-semibold text-gray-900 leading-tight">{name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-[11px] text-gray-400">
                                                        {format(new Date(patient.lastVisit), 'MMM d, yyyy')}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <ChevronRight size={15} className="text-gray-300 group-hover:text-blue-700 transition-colors ml-auto" />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-[10px] text-gray-400">
                                Showing {Math.min(pagedPatients.length, PATIENTS_PER_PAGE)} of {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
                            </p>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setPatientPage(p => Math.max(0, p - 1))}
                                    disabled={patientPage === 0}
                                    className="p-1 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={14} className="rotate-180 text-gray-500" />
                                </button>
                                <button
                                    onClick={() => setPatientPage(p => Math.min(totalPatientPages - 1, p + 1))}
                                    disabled={patientPage >= totalPatientPages - 1}
                                    className="p-1 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={14} className="text-gray-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
