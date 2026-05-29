'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from '@/lib/axios';
import { format, differenceInYears } from 'date-fns';
import {
    Calendar, Clock, User, X, FileText, Pill, ClipboardList, ChevronRight,
    Activity, AlertCircle, CheckCircle2, RotateCcw, XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- Types ---
interface PatientProfile {
    firstName: string;
    lastName: string;
    birthday?: string;
    contactNumber?: string;
    profilePictureUrl?: string;
}

interface Appointment {
    id: string;
    status: string;
    reason?: string;
    createdAt: string;
    slot: { startTime: string; endTime: string };
    patient: { id: string; profile: PatientProfile };
}

interface MedicalHistory {
    id: string;
    condition: string;
    description?: string;
    isActive: boolean;
    diagnosedAt?: string;
}

interface Prescription {
    id: string;
    medication: string;
    dosage: string;
    instructions: string;
    createdAt: string;
    doctor: { profile: { firstName: string; lastName: string }; doctorProfile: { specialization: string } };
}

interface MedicalRecord {
    id: string;
    diagnosis: string;
    treatment?: string;
    consultationNotes?: string;
    createdAt: string;
    doctor: { profile: { firstName: string; lastName: string }; doctorProfile: { specialization: string } };
}

// --- Status Badge ---
const STATUS_STYLES: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
    PENDING:     { label: 'Pending',     class: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock size={12} /> },
    CONFIRMED:   { label: 'Confirmed',   class: 'bg-green-100 text-green-800 border-green-200',   icon: <CheckCircle2 size={12} /> },
    CANCELLED:   { label: 'Cancelled',   class: 'bg-red-100 text-red-800 border-red-200',         icon: <XCircle size={12} /> },
    COMPLETED:   { label: 'Completed',   class: 'bg-blue-100 text-blue-800 border-blue-200',      icon: <CheckCircle2 size={12} /> },
    RESCHEDULED: { label: 'Rescheduled', class: 'bg-purple-100 text-purple-800 border-purple-200', icon: <RotateCcw size={12} /> },
};

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_STYLES[status] ?? { label: status, class: 'bg-gray-100 text-gray-700 border-gray-200', icon: null };
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${s.class}`}>
            {s.icon} {s.label}
        </span>
    );
}

// --- Patient History Modal ---
function PatientHistoryModal({ appointment, onClose }: { appointment: Appointment | null; onClose: () => void }) {
    const [mounted, setMounted] = useState(false);
    const [history, setHistory] = useState<MedicalHistory[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!appointment) return;
        const patientId = appointment.patient.id;
        setLoading(true);
        Promise.all([
            axios.get(`/patients/${patientId}/history`),
            axios.get(`/patients/${patientId}/prescriptions`),
            axios.get(`/patients/${patientId}/medical-records`),
        ]).then(([h, p, r]) => {
            setHistory(h.data);
            setPrescriptions(p.data);
            setRecords(r.data);
        }).finally(() => setLoading(false));
    }, [appointment]);

    if (!appointment || !mounted) return null;

    const { patient, slot, status, reason } = appointment;
    const profile = patient.profile;
    const age = profile.birthday
        ? differenceInYears(new Date(), new Date(profile.birthday))
        : null;

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

                    {/* Header */}
                    <div className="flex items-start justify-between p-6 border-b shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                                {profile.profilePictureUrl
                                    ? <img src={profile.profilePictureUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                    : <User size={26} className="text-gray-400" />}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {profile.firstName} {profile.lastName}
                                </h2>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                    {age !== null && <span>{age} yrs old</span>}
                                    {profile.contactNumber && <span>· {profile.contactNumber}</span>}
                                    <StatusBadge status={status} />
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                    <Calendar size={13} />
                                    <span>{format(new Date(slot.startTime), 'MMM d, yyyy')}</span>
                                    <Clock size={13} />
                                    <span>{format(new Date(slot.startTime), 'h:mm a')} – {format(new Date(slot.endTime), 'h:mm a')}</span>
                                </div>
                                {reason && (
                                    <p className="mt-1.5 text-sm text-gray-600 italic">"{reason}"</p>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-1">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-40 text-gray-400">
                                <Activity size={18} className="animate-pulse mr-2" /> Loading patient records…
                            </div>
                        ) : (
                            <Tabs defaultValue="history">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="history">
                                        <ClipboardList size={14} className="mr-1.5" /> History ({history.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="prescriptions">
                                        <Pill size={14} className="mr-1.5" /> Prescriptions ({prescriptions.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="records">
                                        <FileText size={14} className="mr-1.5" /> Records ({records.length})
                                    </TabsTrigger>
                                </TabsList>

                                {/* Medical History Tab */}
                                <TabsContent value="history" className="space-y-3">
                                    {history.length === 0 ? (
                                        <EmptyState label="No medical history on file" />
                                    ) : history.map(h => (
                                        <div key={h.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-gray-900">{h.condition}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${h.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                                    {h.isActive ? 'Active' : 'Resolved'}
                                                </span>
                                            </div>
                                            {h.description && <p className="text-sm text-gray-600 mt-1">{h.description}</p>}
                                            {h.diagnosedAt && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Diagnosed: {format(new Date(h.diagnosedAt), 'MMM d, yyyy')}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </TabsContent>

                                {/* Prescriptions Tab */}
                                <TabsContent value="prescriptions" className="space-y-3">
                                    {prescriptions.length === 0 ? (
                                        <EmptyState label="No prescriptions issued" />
                                    ) : prescriptions.map(p => (
                                        <div key={p.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{p.medication}</p>
                                                    <p className="text-sm text-gray-600">{p.dosage}</p>
                                                    <p className="text-sm text-gray-500 mt-1">{p.instructions}</p>
                                                </div>
                                                <p className="text-xs text-gray-400 shrink-0 ml-3">
                                                    {format(new Date(p.createdAt), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">
                                                Prescribed by Dr. {p.doctor.profile.firstName} {p.doctor.profile.lastName} · {p.doctor.doctorProfile.specialization}
                                            </p>
                                        </div>
                                    ))}
                                </TabsContent>

                                {/* Medical Records Tab */}
                                <TabsContent value="records" className="space-y-3">
                                    {records.length === 0 ? (
                                        <EmptyState label="No consultation records yet" />
                                    ) : records.map(r => (
                                        <div key={r.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                                            <div className="flex items-start justify-between">
                                                <p className="font-semibold text-gray-900">{r.diagnosis}</p>
                                                <p className="text-xs text-gray-400 shrink-0 ml-3">
                                                    {format(new Date(r.createdAt), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                            {r.treatment && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Treatment:</span> {r.treatment}</p>}
                                            {r.consultationNotes && <p className="text-sm text-gray-500 mt-1 italic">"{r.consultationNotes}"</p>}
                                            <p className="text-xs text-gray-400 mt-2">
                                                Dr. {r.doctor.profile.firstName} {r.doctor.profile.lastName} · {r.doctor.doctorProfile.specialization}
                                            </p>
                                        </div>
                                    ))}
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <AlertCircle size={32} className="mb-2" />
            <p className="text-sm">{label}</p>
        </div>
    );
}

// --- Main Doctor Appointments Page ---
export default function DoctorAppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selected, setSelected] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ALL');

    useEffect(() => {
        axios.get('/appointments/doctor')
            .then(r => setAppointments(r.data))
            .finally(() => setLoading(false));
    }, []);

    const statuses = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    const filtered = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
                <p className="text-gray-500 mt-1">Click an appointment to view the patient's full medical history</p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {statuses.map(s => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                            filter === s
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                    >
                        {s === 'ALL' ? 'All' : STATUS_STYLES[s]?.label ?? s}
                    </button>
                ))}
            </div>

            {/* Appointment List */}
            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading appointments…</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-400">No appointments found.</div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(appt => (
                        <button
                            key={appt.id}
                            onClick={() => setSelected(appt)}
                            className="w-full text-left p-5 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                        {appt.patient.profile.profilePictureUrl
                                            ? <img src={appt.patient.profile.profilePictureUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                            : <User size={20} className="text-gray-400" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {appt.patient.profile.firstName} {appt.patient.profile.lastName}
                                        </p>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={13} />
                                                {format(new Date(appt.slot.startTime), 'MMM d, yyyy')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={13} />
                                                {format(new Date(appt.slot.startTime), 'h:mm a')}
                                            </span>
                                        </div>
                                        {appt.reason && (
                                            <p className="text-xs text-gray-400 mt-0.5 italic">"{appt.reason}"</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <StatusBadge status={appt.status} />
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <PatientHistoryModal appointment={selected} onClose={() => setSelected(null)} />
        </div>
    );
}
