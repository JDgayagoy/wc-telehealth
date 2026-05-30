'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { format, isFuture, isAfter, subMinutes } from 'date-fns';
import {
    Video, Calendar as CalendarIcon, Clock, User, X, RefreshCw,
    FileText, ClipboardList, Pill, StickyNote,
    CheckCircle2, Timer, RotateCcw, Ban, ChevronLeft, ChevronRight,
    FlaskConical, Upload, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import RescheduleModal from '@/components/booking/RescheduleModal';

const PAGE_SIZE = 5;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    CONFIRMED:          { label: 'Confirmed',             color: 'bg-blue-100 text-blue-700' },
    PENDING:            { label: 'Awaiting Confirmation', color: 'bg-yellow-100 text-yellow-700' },
    RESCHEDULE_PENDING: { label: 'Reschedule Pending',    color: 'bg-orange-100 text-orange-700' },
    RESCHEDULED:        { label: 'Rescheduled',           color: 'bg-purple-100 text-purple-700' },
    COMPLETED:          { label: 'Completed',             color: 'bg-green-100 text-green-700' },
    CANCELLED:          { label: 'Cancelled',             color: 'bg-red-100 text-red-700' },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-gray-100 text-gray-600' };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${cfg.color}`}>
            {cfg.label}
        </span>
    );
}

function SpecDisplay({ spec }: { spec: string | string[] | undefined }) {
    if (!spec) return <>General Practitioner</>;
    return <>{Array.isArray(spec) ? spec.join(', ') : spec}</>;
}

export default function PatientAppointmentsPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [rescheduleTarget, setRescheduleTarget] = useState<any>(null);
    const [cancelling, setCancelling] = useState(false);
    const [pastPage, setPastPage] = useState(0);

    // Summary for selected completed appointment
    const [summary, setSummary] = useState<{ medicalRecord: any; prescriptions: any[] } | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);

    // Lab requests for selected upcoming appointment
    const [labRequests, setLabRequests] = useState<any[]>([]);
    const [labLoading, setLabLoading] = useState(false);
    const [uploadingLabId, setUploadingLabId] = useState<string | null>(null);

    const fetchAppointments = async () => {
        try {
            const res = await axios.get('/appointments/mine');
            const data = res.data;
            setAppointments(data);
            if (!selectedId && data.length > 0) {
                const first = [...data].sort((a: any, b: any) =>
                    new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
                )[0];
                setSelectedId(first.id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAppointments(); }, []);

    // Fetch summary whenever a completed appointment is selected
    useEffect(() => {
        if (!selectedId) { setSummary(null); return; }
        const appt = appointments.find(a => a.id === selectedId);
        if (!appt || appt.status !== 'COMPLETED') { setSummary(null); return; }
        setSummaryLoading(true);
        axios.get(`/patients/my/appointments/${selectedId}/summary`)
            .then(res => setSummary(res.data))
            .catch(() => setSummary(null))
            .finally(() => setSummaryLoading(false));
    }, [selectedId, appointments]);

    // Fetch lab requests for upcoming appointments
    useEffect(() => {
        if (!selectedId) { setLabRequests([]); return; }
        const appt = appointments.find(a => a.id === selectedId);
        if (!appt || appt.status === 'COMPLETED' || appt.status === 'CANCELLED') { setLabRequests([]); return; }
        setLabLoading(true);
        axios.get(`/lab-requests/appointment/${selectedId}`)
            .then(res => setLabRequests(res.data))
            .catch(() => setLabRequests([]))
            .finally(() => setLabLoading(false));
    }, [selectedId, appointments]);

    const handleLabUpload = async (labRequestId: string, file: File) => {
        setUploadingLabId(labRequestId);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await axios.post(`/lab-requests/${labRequestId}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setLabRequests(prev => prev.map(r => r.id === labRequestId ? { ...r, status: 'UPLOADED', result: res.data.result } : r));
        } catch (e: any) {
            alert(e.response?.data?.message || 'Upload failed');
        } finally {
            setUploadingLabId(null);
        }
    };

    const cancelAppointment = async (id: string) => {
        if (!confirm('Cancel this appointment?')) return;
        setCancelling(true);
        try {
            await axios.patch(`/appointments/${id}/cancel`);
            await fetchAppointments();
            setSelectedId(null);
        } catch (e: any) {
            alert(e.response?.data?.message || 'Failed to cancel');
        } finally {
            setCancelling(false);
        }
    };

    const upcoming = appointments.filter(a =>
        (a.status === 'CONFIRMED' || a.status === 'RESCHEDULED' || a.status === 'PENDING' || a.status === 'RESCHEDULE_PENDING') &&
        isFuture(new Date(a.slot.startTime))
    ).sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime());

    const past = appointments.filter(a =>
        a.status === 'COMPLETED' || a.status === 'CANCELLED' ||
        (!isFuture(new Date(a.slot.startTime)) && a.status !== 'PENDING')
    ).sort((a, b) => new Date(b.slot.startTime).getTime() - new Date(a.slot.startTime).getTime());

    const totalPastPages = Math.ceil(past.length / PAGE_SIZE);
    const pagedPast = past.slice(pastPage * PAGE_SIZE, (pastPage + 1) * PAGE_SIZE);

    const selected = appointments.find(a => a.id === selectedId) ?? null;
    const isUpcomingAppt = selected ? upcoming.some(a => a.id === selected.id) : false;
    const isJoinable = (startTime: string) => isAfter(new Date(), subMinutes(new Date(startTime), 30));

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
        </div>
    );

    return (
        <div className="px-6 lg:px-10 py-10 max-w-[1400px] mx-auto">

            <header className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Appointments</h1>
                    <p className="text-gray-500 mt-1 text-sm">Manage your upcoming and past consultations.</p>
                </div>
                <Link href="/dashboard/patient/doctors">
                    <button className="px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-xl hover:bg-blue-800 transition-colors cursor-pointer">
                        + Book New
                    </button>
                </Link>
            </header>

            <div className="grid grid-cols-12 gap-6 items-start">

                {/* ── Left Pane ── */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">

                    {/* Upcoming */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Upcoming</h2>
                            {upcoming.length > 0 && (
                                <span className="px-2 py-0.5 bg-blue-700 text-white text-[10px] rounded-full font-bold">
                                    {upcoming.length} NEW
                                </span>
                            )}
                        </div>
                        {upcoming.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">No upcoming appointments.</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {upcoming.map(a => (
                                    <button
                                        key={a.id}
                                        onClick={() => setSelectedId(a.id)}
                                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                                            selectedId === a.id
                                                ? 'bg-blue-50 border-blue-300 border-l-4 border-l-blue-700'
                                                : 'bg-gray-50 border-gray-100 hover:border-blue-200 hover:bg-blue-50/40'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-semibold ${selectedId === a.id ? 'text-blue-700' : 'text-gray-500'}`}>
                                                {format(new Date(a.slot.startTime), 'MMM d, yyyy')}
                                            </span>
                                            <CalendarIcon size={13} className="text-blue-400 shrink-0" />
                                        </div>
                                        <p className="font-semibold text-sm text-gray-900 leading-tight">
                                            {a.reason || 'General Consultation'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Dr. {a.slot.doctor?.profile?.firstName} {a.slot.doctor?.profile?.lastName}
                                            {' · '}{format(new Date(a.slot.startTime), 'h:mm a')}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Past — paginated */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Past Appointments</h2>
                        {past.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">No past appointments.</p>
                        ) : (
                            <>
                                <div className="flex flex-col gap-1">
                                    {pagedPast.map(a => (
                                        <button
                                            key={a.id}
                                            onClick={() => setSelectedId(a.id)}
                                            className={`w-full text-left p-3 rounded-xl transition-all group cursor-pointer ${
                                                selectedId === a.id
                                                    ? 'bg-gray-100 border-l-4 border-l-blue-700 pl-2.5'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-1">
                                                <span className="text-xs text-gray-400">{format(new Date(a.slot.startTime), 'MMM d, yyyy')}</span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                                    a.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                                                }`}>
                                                    {a.status === 'COMPLETED' ? 'Done' : 'Cancelled'}
                                                </span>
                                            </div>
                                            <p className={`text-sm font-semibold leading-tight transition-colors ${
                                                selectedId === a.id ? 'text-blue-700' : 'text-gray-800 group-hover:text-blue-700'
                                            }`}>
                                                {a.reason || 'General Consultation'}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Dr. {a.slot.doctor?.profile?.firstName} {a.slot.doctor?.profile?.lastName}
                                            </p>
                                        </button>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPastPages > 1 && (
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                                        <button
                                            onClick={() => setPastPage(p => Math.max(0, p - 1))}
                                            disabled={pastPage === 0}
                                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                        >
                                            <ChevronLeft size={14} /> Prev
                                        </button>
                                        <span className="text-xs text-gray-400">
                                            {pastPage + 1} / {totalPastPages}
                                        </span>
                                        <button
                                            onClick={() => setPastPage(p => Math.min(totalPastPages - 1, p + 1))}
                                            disabled={pastPage >= totalPastPages - 1}
                                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                        >
                                            Next <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ── Right Pane ── */}
                <div className="col-span-12 lg:col-span-8">
                    {!selected ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-16 flex flex-col items-center justify-center text-center gap-4 shadow-sm">
                            <ClipboardList size={40} className="text-gray-200" />
                            <p className="text-gray-400 text-sm">Select an appointment to view details.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

                            {/* Header */}
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Consultation Summary</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        <SpecDisplay spec={selected.slot.doctor?.doctorProfile?.specialization} />
                                        {' · '}Ref #{selected.id.slice(-8).toUpperCase()}
                                    </p>
                                </div>
                                <StatusBadge status={selected.status} />
                            </div>

                            <div className="p-6 space-y-7">

                                {/* Doctor Info */}
                                <section className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                                        {selected.slot.doctor?.profile?.profilePictureUrl
                                            ? <img src={selected.slot.doctor.profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                            : <User size={26} className="text-blue-400" />}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900">
                                            Dr. {selected.slot.doctor?.profile?.firstName} {selected.slot.doctor?.profile?.lastName}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            <SpecDisplay spec={selected.slot.doctor?.doctorProfile?.specialization} />
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="flex items-center gap-1.5 text-sm text-gray-600 justify-end">
                                            <CalendarIcon size={14} className="text-blue-600" />
                                            {format(new Date(selected.slot.startTime), 'MMM d, yyyy')}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm text-gray-600 justify-end mt-1">
                                            <Clock size={14} className="text-blue-600" />
                                            {format(new Date(selected.slot.startTime), 'h:mm a')}
                                        </div>
                                    </div>
                                </section>

                                {/* Reason */}
                                {selected.reason && (
                                    <section>
                                        <div className="flex items-center gap-2 mb-3">
                                            <ClipboardList size={15} className="text-blue-700" />
                                            <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest">Reason for Visit</h3>
                                        </div>
                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                            <p className="text-sm text-gray-700 leading-relaxed">{selected.reason}</p>
                                        </div>
                                    </section>
                                )}

                                {/* ── Lab Requests (upcoming appointments) ── */}
                                {selected.status !== 'COMPLETED' && selected.status !== 'CANCELLED' && (
                                    labLoading ? (
                                        <div className="flex justify-center py-4">
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
                                        </div>
                                    ) : labRequests.length > 0 ? (
                                        <section>
                                            <div className="flex items-center gap-2 mb-3">
                                                <FlaskConical size={15} className="text-cyan-700" />
                                                <h3 className="text-xs font-bold text-cyan-700 uppercase tracking-widest">Lab Tests Required</h3>
                                                <span className="ml-auto text-[10px] font-bold bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">
                                                    {labRequests.filter(r => r.status === 'PENDING').length} pending
                                                </span>
                                            </div>
                                            <div className="space-y-3">
                                                {labRequests.map(req => (
                                                    <div key={req.id} className={`border rounded-xl p-4 ${req.status === 'PENDING' ? 'border-cyan-200 bg-cyan-50/40' : req.status === 'UPLOADED' ? 'border-blue-200 bg-blue-50/30' : 'border-green-200 bg-green-50/30'}`}>
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">{req.testName}</p>
                                                                {req.instructions && (
                                                                    <p className="text-xs text-gray-500 mt-0.5">{req.instructions}</p>
                                                                )}
                                                            </div>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                                                req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                                req.status === 'UPLOADED' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-green-100 text-green-700'
                                                            }`}>
                                                                {req.status === 'PENDING' ? 'Awaiting Upload' : req.status === 'UPLOADED' ? 'Uploaded' : 'Reviewed'}
                                                            </span>
                                                        </div>

                                                        {req.result ? (
                                                            <a
                                                                href={`http://localhost:3001${req.result.fileUrl}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium"
                                                            >
                                                                <ExternalLink size={12} /> View uploaded result ({req.result.fileName})
                                                            </a>
                                                        ) : (
                                                            <label className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white text-xs font-semibold rounded-xl hover:bg-cyan-700 transition-colors cursor-pointer">
                                                                {uploadingLabId === req.id ? (
                                                                    <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> Uploading…</>
                                                                ) : (
                                                                    <><Upload size={13} /> Upload Result</>
                                                                )}
                                                                <input
                                                                    type="file"
                                                                    accept=".pdf,image/jpeg,image/png,image/webp,image/jpg"
                                                                    className="hidden"
                                                                    disabled={uploadingLabId === req.id}
                                                                    onChange={e => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) handleLabUpload(req.id, file);
                                                                        e.target.value = '';
                                                                    }}
                                                                />
                                                            </label>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    ) : null
                                )}

                                {/* ── COMPLETED: Diagnosis + Notes + Prescriptions ── */}
                                {selected.status === 'COMPLETED' && (
                                    summaryLoading ? (
                                        <div className="flex justify-center py-8">
                                            <div className="h-6 w-6 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                                        </div>
                                    ) : (
                                        <>
                                            {/* Diagnosis */}
                                            {summary?.medicalRecord ? (
                                                <section>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <CheckCircle2 size={15} className="text-blue-700" />
                                                        <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest">Diagnosis</h3>
                                                    </div>
                                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Findings</p>
                                                            <p className="text-sm text-gray-800 font-medium leading-relaxed whitespace-pre-line">
                                                                {summary.medicalRecord.diagnosis}
                                                            </p>
                                                        </div>
                                                        {summary.medicalRecord.treatment && summary.medicalRecord.treatment !== 'See Clinical Notes' && (
                                                            <div className="pt-3 border-t border-gray-200">
                                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Treatment</p>
                                                                <p className="text-sm text-gray-700 leading-relaxed">{summary.medicalRecord.treatment}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </section>
                                            ) : null}

                                            {/* Clinical Notes */}
                                            {summary?.medicalRecord?.consultationNotes && (
                                                <section>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <StickyNote size={15} className="text-blue-700" />
                                                        <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest">Clinical Notes</h3>
                                                    </div>
                                                    <div className="relative">
                                                        <textarea
                                                            readOnly
                                                            rows={5}
                                                            value={summary.medicalRecord.consultationNotes}
                                                            className="w-full p-4 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none leading-relaxed"
                                                        />
                                                        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-gray-200 rounded text-[10px] text-gray-500 font-bold">
                                                            <CheckCircle2 size={10} />
                                                            SIGNED BY DR. {selected.slot.doctor?.profile?.lastName?.toUpperCase()}
                                                        </div>
                                                    </div>
                                                </section>
                                            )}

                                            {/* Prescriptions Table */}
                                            {summary?.prescriptions && summary.prescriptions.length > 0 && (
                                                <section>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Pill size={15} className="text-blue-700" />
                                                        <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest">Prescriptions</h3>
                                                    </div>
                                                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                                                        <table className="w-full text-left text-sm">
                                                            <thead>
                                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                                    <th className="px-4 py-3 font-semibold text-gray-700">Medication</th>
                                                                    <th className="px-4 py-3 font-semibold text-gray-700">Dosage</th>
                                                                    <th className="px-4 py-3 font-semibold text-gray-700">Instructions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {summary.prescriptions.map((rx: any, i: number) => (
                                                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                                        <td className="px-4 py-3 font-semibold text-gray-900">{rx.medication}</td>
                                                                        <td className="px-4 py-3 text-gray-600">{rx.dosage}</td>
                                                                        <td className="px-4 py-3 text-gray-500 text-xs leading-relaxed">{rx.instructions}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </section>
                                            )}

                                            {/* No summary yet */}
                                            {!summary?.medicalRecord && !summary?.prescriptions?.length && (
                                                <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                                    <FileText size={16} className="text-gray-400 shrink-0" />
                                                    <p className="text-sm text-gray-400">No diagnosis or prescriptions recorded for this session.</p>
                                                </div>
                                            )}

                                            {/* Link to full records */}
                                            <Link href="/dashboard/patient/records">
                                                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer group">
                                                    <div className="flex items-center gap-3">
                                                        <FileText size={17} className="text-blue-700" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-blue-800">View All Medical Records</p>
                                                            <p className="text-xs text-blue-400">Full history, lab results, and more</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
                                                </div>
                                            </Link>
                                        </>
                                    )
                                )}

                                {/* Status banners */}
                                {selected.status === 'PENDING' && (
                                    <section className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                        <Timer size={18} className="text-yellow-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-yellow-800">Awaiting Doctor Confirmation</p>
                                            <p className="text-xs text-yellow-600 mt-0.5">The doctor will confirm or decline your appointment request.</p>
                                        </div>
                                    </section>
                                )}
                                {selected.status === 'RESCHEDULE_PENDING' && (
                                    <section className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                        <RotateCcw size={18} className="text-orange-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-orange-800">Reschedule Request Pending</p>
                                            <p className="text-xs text-orange-600 mt-0.5">Awaiting doctor approval for the new time slot.</p>
                                        </div>
                                    </section>
                                )}
                                {selected.status === 'CANCELLED' && (
                                    <section className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                        <Ban size={18} className="text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-red-700">Appointment Cancelled</p>
                                            <p className="text-xs text-red-500 mt-0.5">This appointment was cancelled.</p>
                                        </div>
                                    </section>
                                )}

                                {/* Action Buttons (upcoming only) */}
                                {isUpcomingAppt && (
                                    <section className="flex gap-3 pt-2 border-t border-gray-100">
                                        {(selected.status === 'CONFIRMED' || selected.status === 'RESCHEDULED') && (
                                            isJoinable(selected.slot.startTime) ? (
                                                <Link href={`/dashboard/patient/consultation/${selected.id}`} className="flex-1">
                                                    <button className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold py-3 rounded-xl transition-colors cursor-pointer">
                                                        <Video size={16} /> Join Call
                                                    </button>
                                                </Link>
                                            ) : (
                                                <button disabled className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-400 text-sm font-semibold py-3 rounded-xl cursor-not-allowed">
                                                    <Video size={16} /> Available 30min before
                                                </button>
                                            )
                                        )}
                                        {(selected.status === 'CONFIRMED' || selected.status === 'RESCHEDULED') && (
                                            <button
                                                onClick={() => setRescheduleTarget(selected)}
                                                className="flex items-center gap-2 px-5 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                                            >
                                                <RefreshCw size={15} /> Reschedule
                                            </button>
                                        )}
                                        {selected.status !== 'CANCELLED' && (
                                            <button
                                                onClick={() => cancelAppointment(selected.id)}
                                                disabled={cancelling}
                                                className="flex items-center gap-2 px-5 py-3 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                                            >
                                                <X size={15} /> Cancel
                                            </button>
                                        )}
                                    </section>
                                )}

                            </div>
                        </div>
                    )}
                </div>
            </div>

            <RescheduleModal
                appointment={rescheduleTarget}
                onClose={() => setRescheduleTarget(null)}
                onRequested={() => { setRescheduleTarget(null); fetchAppointments(); }}
            />
        </div>
    );
}
