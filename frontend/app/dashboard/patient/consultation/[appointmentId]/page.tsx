'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { format } from 'date-fns';
import Link from 'next/link';
import { io } from 'socket.io-client';
import {
    PhoneOff, ClipboardList, AlertTriangle, Menu, X,
    LayoutDashboard, Search, Calendar, FileText, User as UserIcon, LogOut, Activity, Star,
} from 'lucide-react';

type SideTab = 'records';

function RatingModal({
    doctorName,
    appointmentId,
    onDone,
}: {
    doctorName: string;
    appointmentId: string;
    onDone: () => void;
}) {
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submit = async () => {
        if (rating === 0) return;
        setSubmitting(true);
        try {
            await axios.post(`/appointments/${appointmentId}/rate`, { rating, review });
        } catch (e) {
            console.error(e);
        } finally {
            onDone();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 flex flex-col items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center">
                    <Star size={28} className="text-cyan-600" />
                </div>

                <div className="text-center">
                    <h2 className="text-xl font-bold text-slate-800">Rate {doctorName}</h2>
                    <p className="text-sm text-slate-500 mt-1">How was your consultation experience?</p>
                </div>

                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            onMouseEnter={() => setHovered(star)}
                            onMouseLeave={() => setHovered(0)}
                            onClick={() => setRating(star)}
                            className="transition-transform duration-100 hover:scale-110 cursor-pointer"
                        >
                            <Star
                                size={36}
                                className={`transition-colors duration-150 ${
                                    star <= (hovered || rating)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-200'
                                }`}
                            />
                        </button>
                    ))}
                </div>

                {rating > 0 && (
                    <p className="text-xs font-semibold text-amber-500 -mt-2">
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                    </p>
                )}

                <textarea
                    value={review}
                    onChange={e => setReview(e.target.value)}
                    placeholder="Share your experience (optional)..."
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder:text-slate-400"
                />

                <div className="flex gap-3 w-full">
                    <button
                        onClick={onDone}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                        Skip
                    </button>
                    <button
                        onClick={submit}
                        disabled={rating === 0 || submitting}
                        className="flex-1 py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {submitting ? 'Submitting…' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PatientConsultationPage() {
    const params = useParams();
    const router = useRouter();
    const appointmentId = params.appointmentId as string;

    const [sessionData, setSessionData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [records, setRecords] = useState<any[]>([]);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const [navOpen, setNavOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [showRating, setShowRating] = useState(false);

    useEffect(() => {
        axios.get(`/consultations/${appointmentId}/session`)
            .then(res => setSessionData(res.data))
            .catch(e => setError(e.response?.data?.message || 'Failed to load session'))
            .finally(() => setLoading(false));

        setRecordsLoading(true);
        axios.get('/patients/my/medical-records')
            .then(res => setRecords(res.data))
            .catch(() => {})
            .finally(() => setRecordsLoading(false));

        axios.get('/profile').then(res => setUserId(res.data.userId)).catch(() => {});
    }, [appointmentId]);

    useEffect(() => {
        if (!userId) return;
        const socket = io('http://localhost:3001');
        socket.on('connect', () => socket.emit('join', userId));
        socket.on('consultation:ended', (data: { appointmentId: string }) => {
            if (data.appointmentId === appointmentId) {
                setShowRating(true);
            }
        });
        return () => { socket.disconnect(); };
    }, [userId, appointmentId]);

    const patientName = sessionData?.appointment?.patient?.profile
        ? `${sessionData.appointment.patient.profile.firstName} ${sessionData.appointment.patient.profile.lastName}`
        : 'Patient';

    const doctorName = sessionData?.appointment?.slot?.doctor?.profile
        ? `Dr. ${sessionData.appointment.slot.doctor.profile.firstName} ${sessionData.appointment.slot.doctor.profile.lastName}`
        : 'Doctor';

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                <span className="text-sm text-gray-400">Connecting to session…</span>
            </div>
        </div>
    );

    if (error) return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white gap-4">
            <AlertTriangle size={40} className="text-red-400" />
            <p className="text-lg font-semibold">{error}</p>
            <button onClick={() => router.back()} className="px-5 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition-colors">Go Back</button>
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">

            {showRating && (
                <RatingModal
                    doctorName={doctorName}
                    appointmentId={appointmentId}
                    onDone={() => router.push('/dashboard/patient/appointments')}
                />
            )}

            {/* Top Bar */}
            <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => setNavOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                        <Menu size={18} />
                    </button>
                    <span className="text-lg font-bold text-blue-700">TeleHealth Pro</span>
                    <div className="w-px h-5 bg-gray-200" />
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                        </span>
                        <span className="text-sm text-gray-500 font-medium">Live Consultation</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                        {patientName[0]}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{patientName}</span>
                </div>
            </header>

            {/* Nav Drawer */}
            {navOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="fixed inset-0 bg-black/30" onClick={() => setNavOpen(false)} />
                    <aside className="relative w-64 bg-white h-full flex flex-col shadow-2xl z-10">
                        <div className="h-14 flex items-center justify-between px-5 border-b border-gray-100">
                            <div className="flex items-center gap-2 text-blue-600">
                                <Activity size={20} />
                                <span className="text-base font-bold text-gray-900">Telehealth</span>
                            </div>
                            <button onClick={() => setNavOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>
                        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                            {[
                                { name: 'Dashboard', href: '/dashboard/patient', icon: <LayoutDashboard size={18} /> },
                                { name: 'Find a Doctor', href: '/dashboard/patient/doctors', icon: <Search size={18} /> },
                                { name: 'My Appointments', href: '/dashboard/patient/appointments', icon: <Calendar size={18} /> },
                                { name: 'Medical Records', href: '/dashboard/patient/records', icon: <FileText size={18} /> },
                                { name: 'My Profile', href: '/dashboard/patient/profile', icon: <UserIcon size={18} /> },
                            ].map(item => (
                                <Link key={item.name} href={item.href} onClick={() => setNavOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                    <span className="text-gray-400">{item.icon}</span>
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                        <div className="p-4 border-t border-gray-100">
                            <button onClick={() => { localStorage.removeItem('access_token'); router.push('/login'); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors">
                                <LogOut size={18} /> Log out
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">

                {/* Sidebar */}
                <aside className="w-[420px] bg-white border-r border-gray-200 flex flex-col shrink-0 shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                        <ClipboardList size={15} className="text-blue-700" />
                        <div>
                            <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Medical Records</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{doctorName}</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                        {recordsLoading ? (
                            <div className="flex justify-center pt-6">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                            </div>
                        ) : records.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-6">No medical records on file.</p>
                        ) : (
                            records.map((r: any) => (
                                <div key={r.id} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="text-xs font-bold text-gray-900 leading-tight">{r.title || 'Medical Record'}</h4>
                                        <span className="text-[10px] text-gray-400 shrink-0">
                                            {r.createdAt ? format(new Date(r.createdAt), 'MMM d, yy') : ''}
                                        </span>
                                    </div>
                                    {r.diagnosis && (
                                        <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full">
                                            {r.diagnosis}
                                        </span>
                                    )}
                                    {r.notes && (
                                        <p className="text-[11px] text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{r.notes}</p>
                                    )}
                                    {r.doctor?.profile && (
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Dr. {r.doctor.profile.firstName} {r.doctor.profile.lastName}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                </aside>

                {/* Video */}
                <section className="flex-1 flex flex-col p-4 gap-4 bg-gray-200 overflow-hidden">
                    <div className="flex-1 relative bg-black rounded-xl overflow-hidden shadow-2xl">
                        {sessionData?.url ? (
                            <iframe
                                src={`${sessionData.url}#userInfo.displayName="${patientName}"`}
                                allow="camera; microphone; fullscreen; display-capture; autoplay"
                                className="w-full h-full border-0"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                Could not connect to session.
                            </div>
                        )}
                        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2 border border-white/10">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-white text-xs font-semibold">{doctorName}</span>
                        </div>
                    </div>

                    <div className="h-16 bg-white rounded-xl flex items-center justify-center px-8 shadow-sm border border-gray-200 shrink-0">
                        <button
                            onClick={() => router.back()}
                            className="px-6 h-11 rounded-full bg-red-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition-colors shadow-md"
                        >
                            <PhoneOff size={16} /> End Call
                        </button>
                    </div>
                </section>
            </div>

            <footer className="h-10 bg-gray-100 border-t border-gray-200 flex items-center justify-between px-6 shrink-0">
                <p className="text-xs text-gray-400">© 2024 TeleHealth Pro. Secure HIPAA Compliant Connection.</p>
                <div className="flex gap-6">
                    <span className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">Privacy Policy</span>
                    <span className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">Support</span>
                    <span className="text-xs text-red-500 font-semibold cursor-pointer">Emergency Contact</span>
                </div>
            </footer>
        </div>
    );
}
