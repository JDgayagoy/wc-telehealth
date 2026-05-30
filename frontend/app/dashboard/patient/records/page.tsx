'use client';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { format } from 'date-fns';
import { User, Plus, Loader2, CheckCircle2, Clock } from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface HistoryItem {
    id: string;
    condition: string;
    description?: string;
    isActive: boolean;
    diagnosedAt?: string;
    createdAt: string;
}

const EMPTY_FORM = { condition: '', description: '', isActive: true, diagnosedAt: '' };

const TIMELINE_COLORS = [
    'bg-blue-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-teal-500',
];

export default function MedicalRecordsPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);

    const fetchAll = async () => {
        try {
            const authRes = await axios.get('/auth/me');
            const patientId = authRes.data?.id;
            if (!patientId) { setLoading(false); return; }

            const [recRes, rxRes, histRes] = await Promise.all([
                axios.get(`/patients/${patientId}/medical-records`),
                axios.get(`/patients/${patientId}/prescriptions`),
                axios.get('/patients/history'),
            ]);

            setRecords(recRes.data);
            setPrescriptions(rxRes.data);
            setHistory(histRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleSubmit = async () => {
        if (!form.condition.trim()) return;
        setSubmitting(true);
        try {
            await axios.post('/patients/history', {
                condition: form.condition,
                description: form.description,
                isActive: form.isActive,
                diagnosedAt: form.diagnosedAt || undefined,
            });
            setModalOpen(false);
            setLoading(true);
            await fetchAll();
        } catch {
            toast.error('Failed to save record.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
        </div>
    );

    return (
        <div className="px-6 lg:px-10 py-10 max-w-[1400px] mx-auto">

            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Medical History</h1>
                <p className="text-gray-500 mt-1 text-sm">Review your clinical records, active prescriptions, and past consultations.</p>
            </header>

            <div className="grid grid-cols-12 gap-6">

                {/* ── Left Column (col-8) ── */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-10">

                    {/* Recent Consultations */}
                    <section>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold text-gray-900">Recent Consultations</h2>
                            <span className="text-sm text-gray-400">{records.length} records</span>
                        </div>

                        {records.length === 0 ? (
                            <div className="text-center p-12 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm">
                                No consultation records found.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {records.map(record => (
                                    <div key={record.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                        {/* Doctor header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {record.doctor?.profile?.profilePictureUrl
                                                        ? <img src={record.doctor.profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                        : <User size={20} className="text-blue-400" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                                                        Dr. {record.doctor?.profile?.firstName ?? 'Unknown'} {record.doctor?.profile?.lastName ?? ''}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {Array.isArray(record.doctor?.doctorProfile?.specialization)
                                                            ? record.doctor.doctorProfile.specialization[0]
                                                            : record.doctor?.doctorProfile?.specialization ?? 'General'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-400 shrink-0">
                                                {format(new Date(record.createdAt), 'MMM d, yyyy')}
                                            </span>
                                        </div>

                                        {/* Diagnosis */}
                                        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Diagnosis</p>
                                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line line-clamp-3">
                                                {record.diagnosis}
                                            </p>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">
                                                <CheckCircle2 size={11} /> Consultation
                                            </span>
                                            {record.consultationNotes && (
                                                <span className="text-xs text-gray-400 italic line-clamp-1 max-w-[140px]">
                                                    "{record.consultationNotes.slice(0, 40)}…"
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Prescriptions Table */}
                    <section>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold text-gray-900">Prescriptions</h2>
                            <span className="text-sm text-gray-400">{prescriptions.length} total</span>
                        </div>

                        {prescriptions.length === 0 ? (
                            <div className="text-center p-12 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm">
                                No prescriptions found.
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="px-6 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Medication</th>
                                            <th className="px-6 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Dosage</th>
                                            <th className="px-6 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Instructions</th>
                                            <th className="px-6 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Prescribed</th>
                                            <th className="px-6 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {prescriptions.map((rx, i) => (
                                            <tr key={rx.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-900">{rx.medication}</p>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{rx.dosage}</td>
                                                <td className="px-6 py-4 text-gray-500 text-xs max-w-[200px]">
                                                    <span className="line-clamp-2">{rx.instructions}</span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
                                                    {format(new Date(rx.createdAt), 'MMM d, yyyy')}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                                                    Dr. {rx.doctor?.profile?.firstName} {rx.doctor?.profile?.lastName}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>

                {/* ── Right Column (col-4): Timeline ── */}
                <div className="col-span-12 lg:col-span-4">
                    <div className="sticky top-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-gray-900">Timeline</h2>
                                <Clock size={16} className="text-gray-400" />
                            </div>
                            <button
                                onClick={() => { setForm(EMPTY_FORM); setModalOpen(true); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white text-xs font-semibold rounded-xl hover:bg-blue-800 transition-colors cursor-pointer"
                            >
                                <Plus size={13} /> Add
                            </button>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            {history.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-sm">
                                    <p>No medical history yet.</p>
                                    <button
                                        onClick={() => { setForm(EMPTY_FORM); setModalOpen(true); }}
                                        className="mt-3 text-blue-600 font-semibold hover:underline cursor-pointer"
                                    >
                                        Add your first record
                                    </button>
                                </div>
                            ) : (
                                <div className="relative flex flex-col gap-7 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                                    {history.map((item, i) => (
                                        <div key={item.id} className="relative pl-10">
                                            {/* Dot */}
                                            <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 ${
                                                item.isActive ? TIMELINE_COLORS[i % TIMELINE_COLORS.length] : 'bg-gray-300'
                                            }`} />

                                            {/* Content */}
                                            <p className="text-sm font-semibold text-gray-900 leading-tight">{item.condition}</p>
                                            <p className="text-xs text-gray-400 mt-0.5 mb-2">
                                                {item.diagnosedAt
                                                    ? format(new Date(item.diagnosedAt), 'MMMM d, yyyy')
                                                    : format(new Date(item.createdAt), 'MMMM d, yyyy')}
                                            </p>

                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                                                item.isActive
                                                    ? 'bg-red-50 text-red-600 border border-red-100'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {item.isActive ? (
                                                    <><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Active</>
                                                ) : (
                                                    <><CheckCircle2 size={10} /> Resolved</>
                                                )}
                                            </span>

                                            {item.description && (
                                                <p className="mt-1.5 text-xs text-gray-500 italic leading-relaxed line-clamp-2">
                                                    "{item.description}"
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {history.length > 0 && (
                                <button className="w-full mt-6 py-2.5 border border-gray-200 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                                    Download Full History
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Record Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add to Medical Timeline</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Condition <span className="text-red-500">*</span>
                            </label>
                            <Input
                                placeholder="e.g. Hypertension, Type 2 Diabetes"
                                className="rounded-xl"
                                value={form.condition}
                                onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                            <Textarea
                                placeholder="Symptoms, findings, notes..."
                                className="rounded-xl resize-none"
                                rows={3}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date Diagnosed</label>
                            <Input
                                type="date"
                                className="rounded-xl"
                                value={form.diagnosedAt}
                                onChange={e => setForm(f => ({ ...f, diagnosedAt: e.target.value }))}
                            />
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                            <input
                                id="isActive"
                                type="checkbox"
                                checked={form.isActive}
                                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                                className="rounded border-gray-300 text-blue-600 accent-blue-600"
                            />
                            <label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer">Mark as currently active condition</label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || !form.condition.trim()}
                            className="bg-blue-700 hover:bg-blue-800"
                        >
                            {submitting ? <><Loader2 size={15} className="mr-2 animate-spin" /> Saving…</> : 'Save to Timeline'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
