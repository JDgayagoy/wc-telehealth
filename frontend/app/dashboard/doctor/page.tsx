'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from '@/lib/axios';
import { Calendar, ClipboardList, Users, ChevronRight, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function DoctorDashboard() {
    const [upcoming, setUpcoming] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/appointments/doctor')
            .then(r => {
                // Show only the next 3 upcoming non-cancelled appointments
                const sorted = r.data
                    .filter((a: any) => a.status !== 'CANCELLED' && new Date(a.slot.startTime) > new Date())
                    .sort((a: any, b: any) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime())
                    .slice(0, 3);
                setUpcoming(sorted);
            })
            .finally(() => setLoading(false));
    }, []);

    const quickLinks = [
        {
            href: '/dashboard/doctor/appointments',
            icon: <Calendar size={24} className="text-blue-600" />,
            bg: 'bg-blue-50',
            title: 'My Appointments',
            desc: 'View all patient bookings and access medical history',
        },
        {
            href: '/dashboard/doctor/appointments',
            icon: <ClipboardList size={24} className="text-green-600" />,
            bg: 'bg-green-50',
            title: 'Patient Records',
            desc: 'Review consultation history, diagnoses, and prescriptions',
        },
        {
            href: '/dashboard/doctor/appointments',
            icon: <Users size={24} className="text-purple-600" />,
            bg: 'bg-purple-50',
            title: 'Prescriptions',
            desc: 'Issue and manage patient prescriptions',
        },
    ];

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
                <p className="text-gray-500 mt-1">Welcome back. Here's your overview for today.</p>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickLinks.map(l => (
                    <Link
                        key={l.title}
                        href={l.href}
                        className="group p-5 rounded-2xl border border-gray-100 bg-white hover:shadow-md hover:border-gray-200 transition-all"
                    >
                        <div className={`w-12 h-12 rounded-xl ${l.bg} flex items-center justify-center mb-4`}>
                            {l.icon}
                        </div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{l.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{l.desc}</p>
                        <ChevronRight size={16} className="text-gray-300 mt-3 group-hover:text-blue-500 transition-colors" />
                    </Link>
                ))}
            </div>

            {/* Upcoming Appointments */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
                    <Link href="/dashboard/doctor/appointments" className="text-sm text-blue-600 hover:underline">
                        View all
                    </Link>
                </div>

                {loading ? (
                    <p className="text-sm text-gray-400">Loading…</p>
                ) : upcoming.length === 0 ? (
                    <div className="text-center py-10 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm">
                        No upcoming appointments
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcoming.map(a => (
                            <Link
                                key={a.id}
                                href="/dashboard/doctor/appointments"
                                className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-sm hover:border-blue-100 transition-all"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                    <Users size={18} className="text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900">
                                        {a.patient.profile.firstName} {a.patient.profile.lastName}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={11} />
                                            {format(new Date(a.slot.startTime), 'MMM d, yyyy')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={11} />
                                            {format(new Date(a.slot.startTime), 'h:mm a')}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                                    {a.status}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}