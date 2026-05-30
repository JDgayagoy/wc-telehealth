'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { format, isFuture, isAfter, subMinutes } from 'date-fns';
import Link from 'next/link';
import {
    Video, Calendar, Clock, Heart, Activity,
    FileText, Eye, ChevronRight, Star,
    Search, User,
} from 'lucide-react';

export default function PatientDashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextDoctorRating, setNextDoctorRating] = useState<{ avgRating: number | null; ratingCount: number } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, apptsRes] = await Promise.all([
                    axios.get('/profile'),
                    axios.get('/appointments/mine'),
                ]);
                setProfile(profileRes.data);
                const appts = apptsRes.data;
                setAppointments(appts);

                const next = appts
                    .filter((a: any) => (a.status === 'CONFIRMED' || a.status === 'RESCHEDULED' || a.status === 'PENDING') && isFuture(new Date(a.slot.startTime)))
                    .sort((a: any, b: any) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime())[0];

                if (next?.slot?.doctor?.id) {
                    try {
                        const docRes = await axios.get(`/doctors/${next.slot.doctor.id}`);
                        setNextDoctorRating({ avgRating: docRes.data.avgRating ?? null, ratingCount: docRes.data.ratingCount ?? 0 });
                    } catch {}
                }

                try {
                    const recordsRes = await axios.get('/patients/my/medical-records');
                    setRecords(recordsRes.data);
                } catch {}
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
            </div>
        );
    }

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const upcomingAppointments = appointments
        .filter(a => (a.status === 'CONFIRMED' || a.status === 'RESCHEDULED' || a.status === 'PENDING') && isFuture(new Date(a.slot.startTime)))
        .sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime());

    const nextAppointment = upcomingAppointments[0];
    const completedCount = appointments.filter(a => a.status === 'COMPLETED').length;

    return (
        <div className="px-6 lg:px-16 py-12 max-w-[1440px] mx-auto">
            {/* Header */}
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        {greeting}, {profile?.firstName ?? 'there'}
                    </h2>
                    <p className="text-base text-gray-500 mt-1">Here is an overview of your health status today.</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <button className="p-2 text-gray-500 hover:text-blue-700 transition-colors">
                            <Activity size={22} />
                        </button>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                        {profile?.profilePictureUrl
                            ? <img src={profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                            : <User size={20} className="text-gray-400" />}
                    </div>
                </div>
            </header>

            {/* Bento Grid */}
            <div className="grid grid-cols-12 gap-6">

                {/* Upcoming Appointment — col 8 */}
                <section className="col-span-12 lg:col-span-8">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center h-full">
                        {nextAppointment ? (
                            <>
                                <div className="relative w-full md:w-48 h-48 rounded-lg overflow-hidden shrink-0 bg-blue-50 flex items-center justify-center">
                                    {nextAppointment.slot.doctor.profile?.profilePictureUrl
                                        ? <img src={nextAppointment.slot.doctor.profile.profilePictureUrl} alt="Doctor" className="w-full h-full object-cover" />
                                        : <User size={56} className="text-blue-200" />}
                                </div>
                                <div className="flex-1 space-y-2 text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full mb-2 text-xs font-semibold">
                                        <Video size={12} />
                                        Upcoming Telehealth Call
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        Dr. {nextAppointment.slot.doctor.profile.firstName} {nextAppointment.slot.doctor.profile.lastName}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <p className="text-gray-500">
                                            {Array.isArray(nextAppointment.slot.doctor.doctorProfile?.specialization)
                                                ? nextAppointment.slot.doctor.doctorProfile.specialization.join(', ')
                                                : nextAppointment.slot.doctor.doctorProfile?.specialization}
                                            {' • '}General Consultation
                                        </p>
                                        {nextDoctorRating?.avgRating !== null && nextDoctorRating !== null ? (
                                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                                <Star size={11} className="fill-amber-500 text-amber-500" />
                                                {nextDoctorRating.avgRating?.toFixed(1)}
                                                <span className="text-amber-400 font-normal">({nextDoctorRating.ratingCount})</span>
                                            </span>
                                        ) : nextDoctorRating !== null ? (
                                            <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-400 text-xs px-2.5 py-0.5 rounded-full">
                                                <Star size={11} /> New
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-6 pt-2">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Calendar size={16} className="text-blue-700" />
                                            <span className="text-sm">{format(new Date(nextAppointment.slot.startTime), 'MMM d, yyyy')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Clock size={16} className="text-blue-700" />
                                            <span className="text-sm">{format(new Date(nextAppointment.slot.startTime), 'h:mm a')} (45 mins)</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 flex gap-4 justify-center md:justify-start">
                                        {nextAppointment.status === 'PENDING' ? (
                                            <span className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg py-2 px-4">
                                                ⏳ Awaiting doctor confirmation
                                            </span>
                                        ) : isAfter(new Date(), subMinutes(new Date(nextAppointment.slot.startTime), 30)) ? (
                                            <Link href={`/dashboard/patient/consultation/${nextAppointment.id}`}>
                                                <button className="bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2">
                                                    <Video size={15} /> Join Call
                                                </button>
                                            </Link>
                                        ) : (
                                            <button disabled className="bg-gray-100 text-gray-400 px-6 py-2 rounded-lg text-sm font-semibold cursor-not-allowed flex items-center gap-2">
                                                <Video size={15} /> Available 30min before
                                            </button>
                                        )}
                                        <Link href="/dashboard/patient/appointments">
                                            <button className="border border-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                                                Reschedule
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full flex flex-col items-center justify-center py-12 text-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                                    <Calendar size={28} className="text-blue-700" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">No upcoming appointments</h3>
                                    <p className="text-gray-500 text-sm mt-1">Ready to see a doctor?</p>
                                </div>
                                <Link href="/dashboard/patient/doctors">
                                    <button className="bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors">
                                        Book Consultation
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Quick Actions — col 4 */}
                <section className="col-span-12 lg:col-span-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 h-full">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Find Doctor', icon: <Search size={22} className="text-blue-700" />, href: '/dashboard/patient/doctors' },
                                { label: 'Records', icon: <FileText size={22} className="text-blue-700" />, href: '/dashboard/patient/records' },
                                { label: 'Appointments', icon: <Calendar size={22} className="text-blue-700" />, href: '/dashboard/patient/appointments' },
                                { label: 'Profile', icon: <User size={22} className="text-blue-700" />, href: '/dashboard/patient/profile' },
                            ].map((item) => (
                                <Link key={item.label} href={item.href}>
                                    <div className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all group active:scale-95 cursor-pointer">
                                        <div className="mb-2 transition-transform group-hover:-translate-y-1">{item.icon}</div>
                                        <span className="text-xs font-medium text-gray-700">{item.label}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Health Summary Stats */}
                <section className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-400">Total Visits</p>
                            <h5 className="text-2xl font-bold text-gray-900 mt-1">
                                {completedCount} <span className="text-sm font-normal text-gray-400">completed</span>
                            </h5>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                            <Heart size={22} />
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-400">Upcoming</p>
                            <h5 className="text-2xl font-bold text-gray-900 mt-1">
                                {upcomingAppointments.length} <span className="text-sm font-normal text-gray-400">sessions</span>
                            </h5>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                            <Calendar size={22} />
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-400">Medical Records</p>
                            <h5 className="text-2xl font-bold text-gray-900 mt-1">
                                {records.length} <span className="text-sm font-normal text-gray-400">on file</span>
                            </h5>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-cyan-800 flex items-center justify-center text-white">
                            <FileText size={22} />
                        </div>
                    </div>
                </section>

                {/* Recent Records Table */}
                <section className="col-span-12">
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
                            <h4 className="text-xl font-bold text-gray-900">Recent Records</h4>
                            <Link href="/dashboard/patient/records" className="text-blue-700 text-sm font-semibold hover:underline flex items-center gap-1">
                                View All <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Document</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Doctor</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Diagnosis</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {records.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                                                No medical records yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        records.slice(0, 5).map((record: any, i: number) => (
                                            <tr key={record.id} className={`hover:bg-gray-50 transition-colors ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <FileText size={18} className="text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-900">{record.title || 'Medical Record'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {record.doctor?.profile
                                                        ? `Dr. ${record.doctor.profile.firstName} ${record.doctor.profile.lastName}`
                                                        : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {record.createdAt ? format(new Date(record.createdAt), 'MMM d, yyyy') : '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                                                        {record.diagnosis || 'On File'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link href="/dashboard/patient/records">
                                                        <button className="text-blue-700 hover:text-blue-900 transition-colors">
                                                            <Eye size={18} />
                                                        </button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
