'use client';

import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from '@/lib/axios';
import {
    format, differenceInYears, isAfter, isBefore, isToday, subMinutes,
    addDays, addWeeks, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay,
} from 'date-fns';
import {
    Calendar, Clock, User, X, FileText, Pill, ClipboardList,
    Activity, AlertCircle, CheckCircle2, RotateCcw, XCircle, Plus, Trash2,
    Video, Eye, CalendarDays, ChevronLeft, ChevronRight, FlaskConical, Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

interface PatientProfile {
    firstName: string; lastName: string;
    birthday?: string; contactNumber?: string; profilePictureUrl?: string;
}
interface Appointment {
    id: string; status: string; reason?: string; createdAt: string;
    slot: { startTime: string; endTime: string };
    patient: { id: string; profile: PatientProfile };
    notes?: string;
}

// ─── Appointment Summary Modal ────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <AlertCircle size={32} className="mb-2" />
            <p className="text-sm">{label}</p>
        </div>
    );
}

const TAB_ITEMS = [
    { key: 'summary',       label: 'Summary',       icon: FileText },
    { key: 'records',       label: 'Records',       icon: ClipboardList },
    { key: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { key: 'history',       label: 'History',       icon: Activity },
] as const;
type TabKey = typeof TAB_ITEMS[number]['key'];

function PatientHistoryModal({ appointment, onClose }: { appointment: Appointment | null; onClose: () => void }) {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('summary');
    const [history, setHistory] = useState<any[]>([]);
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [noteDiagnosis, setNoteDiagnosis] = useState('');
    const [noteTreatment, setNoteTreatment] = useState('');
    const [noteNotes, setNoteNotes] = useState('');
    const [rxList, setRxList] = useState([{ medication: '', dosage: '', frequency: '', duration: '', notes: '' }]);
    const [doctorSig, setDoctorSig] = useState<string | null>(null);
    const [localNotes, setLocalNotes] = useState('');
    const [editNotes, setEditNotes] = useState(false);
    const [savingNotes, setSavingNotes] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const fetchAll = () => {
        if (!appointment) return;
        setLoading(true);
        Promise.all([
            axios.get(`/patients/${appointment.patient.id}/history`),
            axios.get(`/appointments/${appointment.id}`),
            axios.get('/profile/doctor').catch(() => ({ data: null })),
        ]).then(([h, apptRes, docRes]) => {
            setHistory(h.data);
            setRecords(apptRes.data.medicalRecords ?? []);
            setPrescriptions(apptRes.data.prescriptions ?? []);
            setLocalNotes(apptRes.data.notes ?? appointment.notes ?? '');
            setDoctorSig(docRes.data?.signatureUrl ?? null);
        }).finally(() => setLoading(false));
    };

    const handleSaveNotes = async () => {
        if (!appointment) return;
        setSavingNotes(true);
        try {
            await axios.patch(`/appointments/${appointment.id}/notes`, { notes: localNotes });
            setEditNotes(false);
        } catch { alert('Failed to save notes'); }
        finally { setSavingNotes(false); }
    };

    useEffect(() => { if (appointment) { setActiveTab('summary'); fetchAll(); } }, [appointment]);

    const handleAddRecord = async () => {
        if (!noteDiagnosis || !appointment) return alert('Diagnosis is required');
        try {
            await axios.post(`/patients/by-appointment/${appointment.id}/medical-records`, {
                diagnosis: noteDiagnosis, treatment: noteTreatment, consultationNotes: noteNotes,
            });
            alert('Record added');
            setNoteDiagnosis(''); setNoteTreatment(''); setNoteNotes('');
            fetchAll();
        } catch { alert('Failed to add record'); }
    };

    const handleAddPrescription = async () => {
        if (!appointment) return;
        if (!rxList.every(rx => rx.medication.trim() && rx.dosage.trim())) return alert('Medication and Dosage required.');
        try {
            const dtos = rxList.map(rx => ({
                patientId: appointment.patient.id,
                appointmentId: appointment.id,
                medication: rx.medication, dosage: rx.dosage,
                instructions: [
                    rx.frequency ? `Frequency: ${rx.frequency}` : '',
                    rx.duration ? `Duration: ${rx.duration}` : '',
                    rx.notes ? `Notes: ${rx.notes}` : '',
                ].filter(Boolean).join(' | ') || 'No additional instructions',
            }));
            await axios.post('/prescriptions/batch', dtos);
            alert('Prescriptions added');
            setRxList([{ medication: '', dosage: '', frequency: '', duration: '', notes: '' }]);
            fetchAll();
        } catch { alert('Failed to add prescriptions'); }
    };

    const addRxRow = () => setRxList([...rxList, { medication: '', dosage: '', frequency: '', duration: '', notes: '' }]);
    const removeRxRow = (i: number) => { if (rxList.length > 1) setRxList(rxList.filter((_, idx) => idx !== i)); };
    const updateRxRow = (i: number, f: string, v: string) => {
        const n = [...rxList]; n[i] = { ...n[i], [f]: v }; setRxList(n);
    };

    if (!appointment || !mounted) return null;
    const { patient, slot, status, reason, notes } = appointment;
    const profile = patient?.profile;
    const age = profile?.birthday ? differenceInYears(new Date(), new Date(profile.birthday)) : null;
    const refId = `#VT-${appointment.id.slice(-6).toUpperCase()}`;
    const latestRecord = records[0] ?? null;

    return createPortal(
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-[55]"
                style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(2px)' }}
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div id="appointment-summary-print" className="bg-white w-full max-w-[860px] max-h-[92vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">

                    {/* ── Header ── */}
                    <div className="flex items-start justify-between px-8 py-5 border-b border-gray-200 shrink-0">
                        <div>
                            <h3 className="text-xl font-bold text-blue-700">Appointment Summary</h3>
                            <p className="text-sm text-gray-400 mt-0.5">Reference ID: {refId}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100 cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* ── Identity Grid ── */}
                    <div className="grid grid-cols-3 gap-0 bg-gray-50 border-b border-gray-200 shrink-0">
                        <div className="px-8 py-5 space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patient Name</p>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                                    {profile?.profilePictureUrl
                                        ? <img src={profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                        : <User size={18} className="text-blue-400" />}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm leading-tight">
                                        {profile?.firstName ?? 'Unknown'} {profile?.lastName ?? 'Patient'}
                                    </p>
                                    {age !== null && (
                                        <p className="text-xs text-gray-400">
                                            {profile?.birthday ? `DOB: ${format(new Date(profile.birthday), 'dd MMM yyyy')} (${age}y)` : `${age} yrs old`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="px-8 py-5 border-x border-gray-200 space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date &amp; Time</p>
                            <p className="font-semibold text-gray-900 text-sm mt-2">{format(new Date(slot.startTime), 'MMMM d, yyyy')}</p>
                            <p className="text-xs text-gray-400">
                                {format(new Date(slot.startTime), 'h:mm a')} — {format(new Date(slot.endTime), 'h:mm a')}
                            </p>
                        </div>
                        <div className="px-8 py-5 space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reason</p>
                            <p className="font-semibold text-gray-900 text-sm mt-2 leading-snug">
                                {reason || 'General Consultation'}
                            </p>
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                                status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                                'bg-gray-100 text-gray-500'
                            }`}>{status}</span>
                        </div>
                    </div>

                    {/* ── Tabs ── */}
                    <div className="flex items-center gap-0 border-b border-gray-200 bg-white shrink-0 px-8">
                        {TAB_ITEMS.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                                    activeTab === key
                                        ? 'border-blue-700 text-blue-700'
                                        : 'border-transparent text-gray-400 hover:text-gray-700'
                                }`}
                            >
                                <Icon size={13} />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* ── Scrollable Content ── */}
                    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-7" style={{ scrollbarWidth: 'thin' }}>
                        {loading ? (
                            <div className="flex items-center justify-center h-40 text-gray-400">
                                <Activity size={18} className="animate-pulse mr-2" /> Loading…
                            </div>
                        ) : (
                            <>
                                {/* ── Summary Tab ── */}
                                {activeTab === 'summary' && (
                                    <div className="space-y-7">
                                        {/* Primary Diagnosis */}
                                        <section className="space-y-3">
                                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                                <ClipboardList size={16} className="text-blue-700" />
                                                <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Primary Diagnosis</h4>
                                            </div>
                                            {latestRecord ? (
                                                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-5">
                                                    <p className="text-lg font-bold text-blue-900">{latestRecord.diagnosis}</p>
                                                    {latestRecord.treatment && (
                                                        <div className="mt-2">
                                                            <span className="inline-block bg-white border border-blue-200 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                                                Treatment: {latestRecord.treatment}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-2">{format(new Date(latestRecord.createdAt), 'MMM d, yyyy')}</p>
                                                </div>
                                            ) : (
                                                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-5 text-center text-sm text-gray-400">
                                                    No diagnosis on record.
                                                    <button onClick={() => setActiveTab('records')} className="ml-2 text-blue-600 hover:underline font-medium cursor-pointer">Add one</button>
                                                </div>
                                            )}
                                        </section>

                                                        {/* Clinical Notes */}
                                        <section className="space-y-3">
                                            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={16} className="text-gray-400" />
                                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Clinical Notes &amp; Observations</h4>
                                                </div>
                                                {!editNotes && (
                                                    <button onClick={() => setEditNotes(true)} className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">Edit</button>
                                                )}
                                            </div>
                                            {editNotes ? (
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={localNotes}
                                                        onChange={e => setLocalNotes(e.target.value)}
                                                        rows={5}
                                                        placeholder="Enter clinical notes and observations…"
                                                        className="w-full resize-none border border-gray-200 rounded-xl p-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                                                        autoFocus
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setEditNotes(false)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">Cancel</button>
                                                        <button onClick={handleSaveNotes} disabled={savingNotes} className="px-3 py-1.5 text-xs bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 cursor-pointer transition-colors">
                                                            {savingNotes ? 'Saving…' : 'Save'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : localNotes ? (
                                                <p className="text-sm text-gray-700 leading-relaxed">{localNotes}</p>
                                            ) : latestRecord?.consultationNotes ? (
                                                <p className="text-sm text-gray-700 leading-relaxed">{latestRecord.consultationNotes}</p>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">No clinical notes yet. <button onClick={() => setEditNotes(true)} className="text-blue-600 hover:underline cursor-pointer font-medium">Add one</button></p>
                                            )}
                                        </section>

                                        {/* Prescriptions summary */}
                                        <section className="space-y-3">
                                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                                <Pill size={16} className="text-gray-400" />
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prescribed Medications</h4>
                                            </div>
                                            {prescriptions.length === 0 ? (
                                                <div className="text-sm text-gray-400 italic">No prescriptions issued.
                                                    <button onClick={() => setActiveTab('prescriptions')} className="ml-2 text-blue-600 hover:underline font-medium cursor-pointer">Issue one</button>
                                                </div>
                                            ) : (
                                                <div className="rounded-xl border border-gray-200 overflow-hidden">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Medication &amp; Dosage</th>
                                                                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Instructions</th>
                                                                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {prescriptions.slice(0, 5).map((p: any) => (
                                                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                                                    <td className="px-5 py-4">
                                                                        <p className="font-semibold text-gray-900 text-sm">{p.medication}</p>
                                                                        <p className="text-xs text-gray-400">{p.dosage}</p>
                                                                    </td>
                                                                    <td className="px-5 py-4 text-xs text-gray-500 max-w-[220px]">{p.instructions}</td>
                                                                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{format(new Date(p.createdAt), 'MMM d, yyyy')}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </section>

                                        {/* Digital signature */}
                                        <div className="pt-5 border-t border-dashed border-gray-200 flex items-end justify-between">
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Electronically Signed</p>
                                                <p className="text-sm font-medium text-gray-700 italic">Attending Physician</p>
                                                <p className="text-[10px] text-gray-400">
                                                    Timestamp: {format(new Date(slot.startTime), 'yyyy-MM-dd HH:mm:ss')} UTC
                                                </p>
                                            </div>
                                            {doctorSig ? (
                                                <img
                                                    src={`http://localhost:3001${doctorSig}`}
                                                    alt="Doctor signature"
                                                    className="max-h-16 max-w-[180px] object-contain opacity-90"
                                                />
                                            ) : (
                                                <CheckCircle2 size={40} className="text-gray-100" />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── Records Tab ── */}
                                {activeTab === 'records' && (
                                    <div className="space-y-4">
                                        <section className="space-y-3">
                                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                                <ClipboardList size={16} className="text-blue-700" />
                                                <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Consultation Records ({records.length})</h4>
                                            </div>
                                            {records.length === 0 ? <EmptyState label="No records yet" /> : records.map((r: any) => (
                                                <div key={r.id} className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                                                    <div className="flex items-start justify-between">
                                                        <p className="font-semibold text-gray-900">{r.diagnosis}</p>
                                                        <p className="text-xs text-gray-400 shrink-0 ml-3">{format(new Date(r.createdAt), 'MMM d, yyyy')}</p>
                                                    </div>
                                                    {r.treatment && <p className="text-sm text-gray-600 mt-2"><span className="font-semibold">Treatment:</span> {r.treatment}</p>}
                                                    {r.consultationNotes && <p className="text-sm text-gray-500 mt-1 italic border-l-2 border-blue-200 pl-3">"{r.consultationNotes}"</p>}
                                                </div>
                                            ))}
                                        </section>

                                        <section className="pt-4 border-t border-gray-100 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Plus size={15} className="text-blue-700" />
                                                <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Add Consultation Record</h4>
                                            </div>
                                            <Input placeholder="Diagnosis *" value={noteDiagnosis} onChange={e => setNoteDiagnosis(e.target.value)} className="rounded-xl" />
                                            <Input placeholder="Treatment Plan" value={noteTreatment} onChange={e => setNoteTreatment(e.target.value)} className="rounded-xl" />
                                            <Textarea placeholder="Consultation Notes" value={noteNotes} onChange={e => setNoteNotes(e.target.value)} rows={4} className="rounded-xl resize-none" />
                                            <Button onClick={handleAddRecord} className="w-full bg-blue-700 hover:bg-blue-800 rounded-xl">Save Record</Button>
                                        </section>
                                    </div>
                                )}

                                {/* ── Prescriptions Tab ── */}
                                {activeTab === 'prescriptions' && (
                                    <div className="space-y-4">
                                        <section className="space-y-3">
                                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                                <Pill size={16} className="text-blue-700" />
                                                <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Prescribed Medications ({prescriptions.length})</h4>
                                            </div>
                                            {prescriptions.length === 0 ? <EmptyState label="No prescriptions issued" /> : (
                                                <div className="rounded-xl border border-gray-200 overflow-hidden">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Medication</th>
                                                                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Dosage</th>
                                                                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Instructions</th>
                                                                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {prescriptions.map((p: any) => (
                                                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                                                    <td className="px-5 py-4 font-semibold text-gray-900 text-sm">{p.medication}</td>
                                                                    <td className="px-5 py-4 text-sm text-gray-600">{p.dosage}</td>
                                                                    <td className="px-5 py-4 text-xs text-gray-500 max-w-[200px]">{p.instructions}</td>
                                                                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{format(new Date(p.createdAt), 'MMM d, yyyy')}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </section>

                                        <section className="pt-4 border-t border-gray-100 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Plus size={15} className="text-blue-700" />
                                                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Issue Prescription(s)</h4>
                                                </div>
                                                <button
                                                    onClick={addRxRow}
                                                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <Plus size={12} /> Add Row
                                                </button>
                                            </div>
                                            <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                                                {rxList.map((rx, idx) => (
                                                    <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Prescription {idx + 1}</span>
                                                            <button
                                                                onClick={() => removeRxRow(idx)}
                                                                disabled={rxList.length === 1}
                                                                className="p-1 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-30 cursor-pointer"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <Input placeholder="Medication *" value={rx.medication} onChange={e => updateRxRow(idx, 'medication', e.target.value)} className="bg-white rounded-xl" />
                                                            <Input placeholder="Dosage *" value={rx.dosage} onChange={e => updateRxRow(idx, 'dosage', e.target.value)} className="bg-white rounded-xl" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <Input placeholder="Frequency" value={rx.frequency} onChange={e => updateRxRow(idx, 'frequency', e.target.value)} className="bg-white rounded-xl text-sm" />
                                                            <Input placeholder="Duration" value={rx.duration} onChange={e => updateRxRow(idx, 'duration', e.target.value)} className="bg-white rounded-xl text-sm" />
                                                        </div>
                                                        <Textarea placeholder="Notes / Instructions" value={rx.notes} onChange={e => updateRxRow(idx, 'notes', e.target.value)} rows={2} className="bg-white rounded-xl text-sm resize-none" />
                                                    </div>
                                                ))}
                                            </div>
                                            <Button onClick={handleAddPrescription} className="w-full bg-blue-700 hover:bg-blue-800 rounded-xl">Submit Prescriptions</Button>
                                        </section>
                                    </div>
                                )}

                                {/* ── History Tab ── */}
                                {activeTab === 'history' && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                            <Activity size={16} className="text-blue-700" />
                                            <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Medical History ({history.length})</h4>
                                        </div>
                                        {history.length === 0 ? <EmptyState label="No medical history on file" /> : history.map((h: any) => (
                                            <div key={h.id} className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-gray-900">{h.condition}</span>
                                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${h.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                                        {h.isActive ? 'Active' : 'Resolved'}
                                                    </span>
                                                </div>
                                                {h.description && <p className="text-sm text-gray-600 mt-1.5">{h.description}</p>}
                                                {h.diagnosedAt && <p className="text-xs text-gray-400 mt-1">Diagnosed: {format(new Date(h.diagnosedAt), 'MMM d, yyyy')}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-end gap-3 px-8 py-4 bg-gray-50 border-t border-gray-200 shrink-0">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-5 h-11 border border-gray-300 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            <CheckCircle2 size={15} /> Print
                        </button>
                        <button
                            onClick={onClose}
                            className="px-7 h-11 bg-blue-700 text-white text-sm font-semibold rounded-xl hover:bg-blue-800 transition-colors shadow-sm cursor-pointer"
                        >
                            Close Summary
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}

// ─── Lab Request Modal ────────────────────────────────────────────────────

function LabRequestModal({
    appointment,
    onClose,
    onCreated,
}: {
    appointment: Appointment | null;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [mounted, setMounted] = useState(false);
    const [testName, setTestName] = useState('');
    const [instructions, setInstructions] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);
    const [loadingReqs, setLoadingReqs] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!appointment) return;
        setLoadingReqs(true);
        axios.get(`/lab-requests/appointment/${appointment.id}`)
            .then(r => setRequests(r.data))
            .catch(() => {})
            .finally(() => setLoadingReqs(false));
    }, [appointment]);

    const handleSubmit = async () => {
        if (!testName.trim() || !appointment) return;
        setSubmitting(true);
        try {
            await axios.post('/lab-requests', {
                appointmentId: appointment.id,
                testName: testName.trim(),
                instructions: instructions.trim() || undefined,
            });
            setTestName('');
            setInstructions('');
            const r = await axios.get(`/lab-requests/appointment/${appointment.id}`);
            setRequests(r.data);
            onCreated();
        } catch (e: any) {
            alert(e.response?.data?.message || 'Failed to create lab request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await axios.delete(`/lab-requests/${id}`);
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (e: any) {
            alert(e.response?.data?.message || 'Cannot delete');
        }
    };

    const handleMarkReviewed = async (id: string) => {
        try {
            const r = await axios.patch(`/lab-requests/${id}/reviewed`);
            setRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'REVIEWED' } : req));
        } catch {}
    };

    if (!appointment || !mounted) return null;

    const STATUS_COLORS: Record<string, string> = {
        PENDING:  'bg-yellow-100 text-yellow-700',
        UPLOADED: 'bg-blue-100 text-blue-700',
        REVIEWED: 'bg-green-100 text-green-700',
    };

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/55 z-[55] backdrop-blur-sm" onClick={onClose} />
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between p-5 border-b shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-cyan-100 flex items-center justify-center">
                                <FlaskConical size={18} className="text-cyan-700" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Request Lab Test</h2>
                                <p className="text-xs text-gray-400">
                                    {appointment.patient?.profile?.firstName} {appointment.patient?.profile?.lastName}
                                    {' · '}{format(new Date(appointment.slot.startTime), 'MMM d, h:mm a')}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={18} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                        {/* Existing requests */}
                        {loadingReqs ? (
                            <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
                        ) : requests.length > 0 && (
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Existing Requests</p>
                                <div className="space-y-2">
                                    {requests.map(req => (
                                        <div key={req.id} className="border border-gray-200 rounded-xl p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-semibold text-gray-900">{req.testName}</p>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[req.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                                            {req.status}
                                                        </span>
                                                    </div>
                                                    {req.instructions && (
                                                        <p className="text-xs text-gray-500 mt-0.5">{req.instructions}</p>
                                                    )}
                                                    {req.result && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <a
                                                                href={`http://localhost:3001${req.result.fileUrl}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                                                            >
                                                                <FileText size={12} /> View Result ({req.result.fileName})
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 shrink-0">
                                                    {req.status === 'UPLOADED' && (
                                                        <button
                                                            onClick={() => handleMarkReviewed(req.id)}
                                                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors cursor-pointer"
                                                        >
                                                            Mark Reviewed
                                                        </button>
                                                    )}
                                                    {req.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => handleDelete(req.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* New request form */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">New Lab Request</p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Test Name <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="e.g. Complete Blood Count, Urinalysis, X-Ray"
                                        className="rounded-xl"
                                        value={testName}
                                        onChange={e => setTestName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Instructions</label>
                                    <Textarea
                                        placeholder="Any preparation instructions for the patient (e.g. fasting required, bring original copy)..."
                                        className="rounded-xl resize-none"
                                        rows={3}
                                        value={instructions}
                                        onChange={e => setInstructions(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 border-t shrink-0">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !testName.trim()}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-700 text-white text-sm font-semibold rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <Send size={15} />
                            {submitting ? 'Sending Request…' : 'Send Lab Request to Patient'}
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function getSlotStatus(startTime: string, endTime: string, status: string) {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (status === 'COMPLETED') return 'completed';
    if (status === 'CANCELLED') return 'cancelled';
    if (status === 'CANCEL_PENDING') return 'cancel_pending';
    if (isAfter(now, start) && isBefore(now, end)) return 'inprogress';
    if (isAfter(now, end)) return 'delayed';
    return 'upcoming';
}

const SLOT_BADGE: Record<string, { label: string; class: string }> = {
    inprogress:     { label: 'In Progress',    class: 'bg-blue-700 text-white' },
    upcoming:       { label: 'Upcoming',       class: 'bg-gray-200 text-gray-600' },
    delayed:        { label: 'Delayed',        class: 'bg-red-100 text-red-700' },
    completed:      { label: 'Completed',      class: 'bg-green-100 text-green-700' },
    cancelled:      { label: 'Cancelled',      class: 'bg-red-100 text-red-600' },
    cancel_pending: { label: 'Cancel Pending', class: 'bg-orange-100 text-orange-700' },
};

// ─── Schedule Row ─────────────────────────────────────────────────────────

function ScheduleRow({
    appt,
    showDate,
    isJoinable,
    onViewRecords,
    onLabRequest,
}: {
    appt: Appointment;
    showDate: boolean;
    isJoinable: (t: string) => boolean;
    onViewRecords: () => void;
    onLabRequest: () => void;
}) {
    const profile = appt.patient?.profile;
    const slotStatus = getSlotStatus(appt.slot.startTime, appt.slot.endTime, appt.status);
    const badge = SLOT_BADGE[slotStatus];
    const isInProgress = slotStatus === 'inprogress';
    const joinable = isJoinable(appt.slot.startTime);

    return (
        <div className={`grid grid-cols-[96px_1fr] min-h-[130px] transition-colors ${isInProgress ? 'bg-blue-50/40' : 'hover:bg-gray-50/60'}`}>
            {/* Time / Date col */}
            <div className={`p-3 flex flex-col items-center justify-center border-r ${isInProgress ? 'border-blue-100 bg-blue-50' : 'border-gray-100'}`}>
                <span className={`text-xl font-bold leading-none ${isInProgress ? 'text-blue-700' : slotStatus === 'delayed' ? 'text-red-500' : 'text-gray-500'}`}>
                    {format(new Date(appt.slot.startTime), 'h:mm')}
                </span>
                <span className={`text-[10px] font-bold mt-0.5 ${isInProgress ? 'text-blue-500' : 'text-gray-400'}`}>
                    {format(new Date(appt.slot.startTime), 'a').toUpperCase()}
                </span>
            </div>

            {/* Content col */}
            <div className="p-4 flex items-center gap-5">
                <div className="relative shrink-0">
                    <div className={`w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center ${isInProgress ? 'ring-4 ring-blue-200' : 'bg-gray-100'} ${slotStatus === 'upcoming' ? 'grayscale opacity-75' : ''}`}>
                        {profile?.profilePictureUrl
                            ? <img src={profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                            : <User size={26} className="text-gray-300" />}
                    </div>
                    {isInProgress && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-700 rounded-full border-2 border-white" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`text-base font-bold leading-tight ${isInProgress ? 'text-gray-900' : 'text-gray-700'}`}>
                            {profile?.firstName} {profile?.lastName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.class}`}>
                            {badge.label}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                        {appt.reason || 'General Consultation'}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Video size={13} />
                        <span>Virtual Visit</span>
                        <span className="mx-1">·</span>
                        <Clock size={13} />
                        <span>{format(new Date(appt.slot.startTime), 'h:mm a')} – {format(new Date(appt.slot.endTime), 'h:mm a')}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                    {(appt.status === 'CONFIRMED' || appt.status === 'RESCHEDULED') && joinable ? (
                        <Link href={`/dashboard/doctor/consultation/${appt.id}`}>
                            <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-xl hover:bg-blue-800 transition-colors cursor-pointer">
                                <Video size={13} /> Join Call
                            </button>
                        </Link>
                    ) : null}
                    <button
                        onClick={onViewRecords}
                        className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <Eye size={13} /> View Records
                    </button>
                    {(appt.status === 'CONFIRMED' || appt.status === 'RESCHEDULED') && (
                        <button
                            onClick={onLabRequest}
                            className="flex items-center gap-1.5 px-4 py-2 border border-cyan-200 text-cyan-700 text-xs font-semibold rounded-xl hover:bg-cyan-50 transition-colors cursor-pointer"
                        >
                            <FlaskConical size={13} /> Lab Test
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function DoctorAppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selected, setSelected] = useState<Appointment | null>(null);
    const [labTarget, setLabTarget] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState<string | null>(null);
    const [scheduleFilter, setScheduleFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [scheduleDate, setScheduleDate] = useState(new Date());

    const handleConfirm = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setActioning(id);
        try {
            await axios.patch(`/appointments/${id}/confirm`);
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'CONFIRMED' } : a));
        } catch (err: any) { alert(err.response?.data?.message || 'Failed to confirm'); }
        finally { setActioning(null); }
    };

    const handleReject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Decline this appointment?')) return;
        setActioning(id);
        try {
            await axios.patch(`/appointments/${id}/reject`);
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a));
        } catch (err: any) { alert(err.response?.data?.message || 'Failed to decline'); }
        finally { setActioning(null); }
    };

    const handleApproveCancellation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Approve this cancellation request? The slot will be reopened.')) return;
        setActioning(id);
        try {
            await axios.patch(`/appointments/${id}/approve-cancellation`);
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a));
        } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
        finally { setActioning(null); }
    };

    const handleRejectCancellation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Decline this cancellation request? The appointment will remain confirmed.')) return;
        setActioning(id);
        try {
            await axios.patch(`/appointments/${id}/reject-cancellation`);
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'CONFIRMED' } : a));
        } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
        finally { setActioning(null); }
    };

    const handleApproveReschedule = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setActioning(id);
        try {
            await axios.patch(`/appointments/${id}/approve-reschedule`);
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'CONFIRMED' } : a));
        } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
        finally { setActioning(null); }
    };

    const handleRejectReschedule = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Decline reschedule request?')) return;
        setActioning(id);
        try {
            await axios.patch(`/appointments/${id}/reject-reschedule`);
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'CONFIRMED' } : a));
        } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
        finally { setActioning(null); }
    };

    const isJoinable = (startTime: string) => isAfter(new Date(), subMinutes(new Date(startTime), 30));

    useEffect(() => {
        axios.get('/appointments/doctor')
            .then(r => setAppointments(r.data))
            .finally(() => setLoading(false));
    }, []);

    // Derived data
    const pendingRequests = appointments.filter(a => a.status === 'PENDING' || a.status === 'RESCHEDULE_PENDING' || a.status === 'CANCEL_PENDING')
        .sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime());

    const todayCount = appointments.filter(a => isToday(new Date(a.slot.startTime)) && a.status !== 'CANCELLED' && a.status !== 'PENDING' && a.status !== 'RESCHEDULE_PENDING').length;

    const upcomingNotToday = appointments
        .filter(a => (a.status === 'CONFIRMED' || a.status === 'RESCHEDULED') && !isToday(new Date(a.slot.startTime)) && isAfter(new Date(a.slot.startTime), new Date()))
        .sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime())
        .slice(0, 3);

    const totalConfirmed = appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length;

    const navigateSchedule = (dir: 1 | -1) => {
        if (scheduleFilter === 'daily') setScheduleDate(d => addDays(d, dir));
        else if (scheduleFilter === 'weekly') setScheduleDate(d => addWeeks(d, dir));
        else setScheduleDate(d => addMonths(d, dir));
    };

    const scheduleAppointments = useMemo(() => {
        const excluded = new Set(['PENDING', 'RESCHEDULE_PENDING', 'CANCELLED']);
        return appointments
            .filter(a => !excluded.has(a.status))
            .filter(a => {
                const t = new Date(a.slot.startTime);
                if (scheduleFilter === 'daily') return isSameDay(t, scheduleDate);
                if (scheduleFilter === 'weekly') {
                    const s = startOfWeek(scheduleDate, { weekStartsOn: 1 });
                    const e = endOfWeek(scheduleDate, { weekStartsOn: 1 });
                    return t >= s && t <= e;
                }
                const s = startOfMonth(scheduleDate);
                const e = endOfMonth(scheduleDate);
                return t >= s && t <= e;
            })
            .sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime());
    }, [appointments, scheduleFilter, scheduleDate]);

    const groupedSchedule = useMemo(() => {
        if (scheduleFilter === 'daily') return null;
        const groups: Record<string, Appointment[]> = {};
        scheduleAppointments.forEach(a => {
            const key = format(new Date(a.slot.startTime), 'yyyy-MM-dd');
            if (!groups[key]) groups[key] = [];
            groups[key].push(a);
        });
        return groups;
    }, [scheduleAppointments, scheduleFilter]);

    const scheduleDateLabel = useMemo(() => {
        if (scheduleFilter === 'daily') {
            return isToday(scheduleDate) ? `Today, ${format(scheduleDate, 'MMMM d')}` : format(scheduleDate, 'EEEE, MMMM d');
        }
        if (scheduleFilter === 'weekly') {
            const s = startOfWeek(scheduleDate, { weekStartsOn: 1 });
            const e = endOfWeek(scheduleDate, { weekStartsOn: 1 });
            return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
        }
        return format(scheduleDate, 'MMMM yyyy');
    }, [scheduleFilter, scheduleDate]);

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
        </div>
    );

    return (
        <div className="px-6 lg:px-10 py-10 max-w-[1400px] mx-auto">

            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Doctor Dashboard</h1>
                <p className="text-gray-500 mt-1 text-sm">
                    You have {todayCount} patient{todayCount !== 1 ? 's' : ''} scheduled for today, {format(new Date(), 'MMMM d')}.
                </p>
            </header>

            <div className="grid grid-cols-12 gap-6">

                {/* ── Left Col (col-4): Requests + Stats ── */}
                <section className="col-span-12 lg:col-span-4 flex flex-col gap-5">

                    {/* Appointment Requests */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Appointment Requests</h2>
                            {pendingRequests.length > 0 && (
                                <span className="px-2 py-0.5 bg-blue-700 text-white text-[10px] rounded-full font-bold">
                                    {pendingRequests.length} NEW
                                </span>
                            )}
                        </div>

                        {pendingRequests.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-sm text-gray-400">
                                No pending requests.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {pendingRequests.map(appt => {
                                    const profile = appt.patient?.profile;
                                    const isReschedule = appt.status === 'RESCHEDULE_PENDING';
                                    const isCancelRequest = appt.status === 'CANCEL_PENDING';
                                    return (
                                        <div key={appt.id} className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow ${isCancelRequest ? 'border-orange-200' : 'border-gray-200'}`}>
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {profile?.profilePictureUrl
                                                        ? <img src={profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                        : <User size={22} className="text-gray-300" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                                                        {profile?.firstName} {profile?.lastName}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                                        {isCancelRequest ? '❌ Cancellation Request' : isReschedule ? '🔄 Reschedule Request' : appt.reason || 'General Consultation'}
                                                    </p>
                                                </div>
                                                <span className="text-[11px] font-bold text-blue-700 shrink-0">
                                                    {format(new Date(appt.slot.startTime), 'h:mm a')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-3">
                                                {format(new Date(appt.slot.startTime), 'MMM d, yyyy')}
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={e => isCancelRequest ? handleApproveCancellation(e, appt.id) : isReschedule ? handleApproveReschedule(e, appt.id) : handleConfirm(e, appt.id)}
                                                    disabled={actioning === appt.id}
                                                    className={`flex-1 py-2 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer ${isCancelRequest ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-700 hover:bg-blue-800'}`}
                                                >
                                                    {isCancelRequest ? 'Approve Cancel' : isReschedule ? 'Approve' : 'Accept'}
                                                </button>
                                                <button
                                                    onClick={e => isCancelRequest ? handleRejectCancellation(e, appt.id) : isReschedule ? handleRejectReschedule(e, appt.id) : handleReject(e, appt.id)}
                                                    disabled={actioning === appt.id}
                                                    className="flex-1 py-2 border border-gray-200 text-gray-500 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                                                >
                                                    {isCancelRequest ? 'Keep Appointment' : 'Decline'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Weekly Summary */}
                    <div className="bg-blue-700 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-xs font-semibold text-blue-200 uppercase tracking-widest">Weekly Summary</h4>
                            <div className="mt-3 flex items-end gap-2">
                                <span className="text-4xl font-bold text-white">{appointments.length}</span>
                                <span className="text-sm text-blue-200 pb-1">Appointments</span>
                            </div>
                            <div className="mt-1 flex gap-4">
                                <div>
                                    <p className="text-xs text-blue-300">Confirmed</p>
                                    <p className="text-lg font-bold text-white">{totalConfirmed}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-blue-300">Pending</p>
                                    <p className="text-lg font-bold text-white">{pendingRequests.length}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-blue-300">Today</p>
                                    <p className="text-lg font-bold text-white">{todayCount}</p>
                                </div>
                            </div>
                            {/* Mini bar chart */}
                            <div className="mt-5 flex items-end gap-1 h-10">
                                {[0.4, 0.6, 0.8, 0.5, 1, 0.7, 0.9].map((h, i) => (
                                    <div key={i} className="flex-1 bg-white/20 rounded-t transition-all" style={{ height: `${h * 100}%` }} />
                                ))}
                            </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
                    </div>

                    {/* Upcoming (not today) */}
                    {upcomingNotToday.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                                <CalendarDays size={13} /> Upcoming Appointments
                            </h2>
                            <div className="space-y-3">
                                {upcomingNotToday.map(appt => (
                                    <div key={appt.id} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex flex-col items-center justify-center shrink-0">
                                            <span className="text-[9px] text-gray-400 uppercase leading-none">{format(new Date(appt.slot.startTime), 'MMM')}</span>
                                            <span className="text-sm font-bold text-blue-700 leading-tight">{format(new Date(appt.slot.startTime), 'd')}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 leading-tight">
                                                {appt.patient?.profile?.firstName} {appt.patient?.profile?.lastName}
                                            </p>
                                            <p className="text-xs text-gray-400">{format(new Date(appt.slot.startTime), 'h:mm a')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* ── Right Col (col-8): Schedule ── */}
                <section className="col-span-12 lg:col-span-8 flex flex-col gap-5">

                    {/* Schedule header + filter + nav */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        {/* Filter pills */}
                        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
                            {(['daily', 'weekly', 'monthly'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => { setScheduleFilter(f); setScheduleDate(new Date()); }}
                                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize cursor-pointer ${
                                        scheduleFilter === f
                                            ? 'bg-white text-blue-700 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        {/* Date navigation */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => navigateSchedule(-1)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                <ChevronLeft size={16} className="text-gray-500" />
                            </button>
                            <span className="text-sm font-semibold text-gray-700 px-2 min-w-[160px] text-center">
                                {scheduleDateLabel}
                            </span>
                            <button
                                onClick={() => navigateSchedule(1)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                <ChevronRight size={16} className="text-gray-500" />
                            </button>
                            {!isSameDay(scheduleDate, new Date()) && (
                                <button
                                    onClick={() => setScheduleDate(new Date())}
                                    className="ml-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                                >
                                    Today
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-[96px_1fr] border-b border-gray-100">
                            <div className="p-3 text-center text-xs font-bold uppercase tracking-widest text-gray-400 border-r border-gray-100">
                                {scheduleFilter === 'daily' ? 'Time' : 'Date'}
                            </div>
                            <div className="p-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                                Patient Details & Actions
                                <span className="ml-2 text-gray-300 font-normal normal-case tracking-normal">
                                    {scheduleAppointments.length} appointment{scheduleAppointments.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        {scheduleAppointments.length === 0 ? (
                            <div className="py-16 text-center text-gray-400 text-sm">
                                No appointments for {scheduleFilter === 'daily' ? 'this day' : scheduleFilter === 'weekly' ? 'this week' : 'this month'}.
                            </div>
                        ) : scheduleFilter === 'daily' ? (
                            /* ─ Daily: flat list ─ */
                            <div className="divide-y divide-gray-100">
                                {scheduleAppointments.map(appt => (
                                    <ScheduleRow
                                        key={appt.id}
                                        appt={appt}
                                        showDate={false}
                                        isJoinable={isJoinable}
                                        onViewRecords={() => setSelected(appt)}
                                        onLabRequest={() => setLabTarget(appt)}
                                    />
                                ))}
                            </div>
                        ) : (
                            /* ─ Weekly / Monthly: grouped by day ─ */
                            <div>
                                {Object.entries(groupedSchedule ?? {}).map(([dateKey, dayAppts]) => (
                                    <div key={dateKey}>
                                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10">
                                            <span className="text-xs font-bold text-gray-700">
                                                {isSameDay(new Date(dateKey), new Date())
                                                    ? 'Today'
                                                    : format(new Date(dateKey), 'EEEE, MMMM d')}
                                            </span>
                                            <span className="text-[10px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                                                {dayAppts.length}
                                            </span>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {dayAppts.map(appt => (
                                                <ScheduleRow
                                                    key={appt.id}
                                                    appt={appt}
                                                    showDate={false}
                                                    isJoinable={isJoinable}
                                                    onViewRecords={() => setSelected(appt)}
                                                    onLabRequest={() => setLabTarget(appt)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </section>
            </div>

            <PatientHistoryModal appointment={selected} onClose={() => setSelected(null)} />
            <LabRequestModal
                appointment={labTarget}
                onClose={() => setLabTarget(null)}
                onCreated={() => {}}
            />
        </div>
    );
}
