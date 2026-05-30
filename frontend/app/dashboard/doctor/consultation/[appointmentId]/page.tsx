'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { format } from 'date-fns';
import Link from 'next/link';
import {
    PhoneOff, ClipboardList, FileText, AlertTriangle,
    CheckCircle, Loader2, Save, Activity, Pill,
    Menu, X, LayoutDashboard, Calendar, Clock, User as UserIcon, LogOut,
    FlaskConical, ExternalLink, Plus, Trash2, Send,
} from 'lucide-react';
import { DiagnosisPanel } from '@/components/consultation/DiagnosisPanel';
import { PrescriptionPanel } from '@/components/consultation/PrescriptionPanel';

type SideTab = 'records' | 'notes' | 'diagnosis' | 'prescription' | 'lab-results';

export default function DoctorConsultationPage() {
    const params = useParams();
    const router = useRouter();
    const appointmentId = params.appointmentId as string;

    const [sessionData, setSessionData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [completing, setCompleting] = useState(false);
    const [activeTab, setActiveTab] = useState<SideTab>('records');
    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    const [diagnosisSaved, setDiagnosisSaved] = useState(false);
    const [records, setRecords] = useState<any[]>([]);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const [labRequests, setLabRequests] = useState<any[]>([]);
    const [labForms, setLabForms] = useState([{ testName: '', instructions: '' }]);
    const [submittingLab, setSubmittingLab] = useState(false);
    const [navOpen, setNavOpen] = useState(false);

    useEffect(() => {
        axios.get(`/consultations/${appointmentId}/session`)
            .then(res => {
                setSessionData(res.data);
                if (res.data?.appointment?.notes) setNotes(res.data.appointment.notes);
                const pid = res.data?.appointment?.patientId;
                if (pid) {
                    setRecordsLoading(true);
                    axios.get(`/patients/${pid}/medical-records`)
                        .then(r => setRecords(r.data))
                        .catch(() => {})
                        .finally(() => setRecordsLoading(false));
                }
                axios.get(`/lab-requests/appointment/${appointmentId}`)
                    .then(r => setLabRequests(r.data))
                    .catch(() => {});
            })
            .catch(e => setError(e.response?.data?.message || 'Failed to load session'))
            .finally(() => setLoading(false));
    }, [appointmentId]);

    const addLabRow = () => setLabForms(prev => [...prev, { testName: '', instructions: '' }]);
    const removeLabRow = (i: number) => { if (labForms.length > 1) setLabForms(prev => prev.filter((_, idx) => idx !== i)); };
    const updateLabForm = (i: number, field: 'testName' | 'instructions', val: string) =>
        setLabForms(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: val } : f));

    const handleCreateLabRequest = async () => {
        const valid = labForms.filter(f => f.testName.trim());
        if (valid.length === 0 || submittingLab) return;
        setSubmittingLab(true);
        try {
            await Promise.all(valid.map(f => axios.post('/lab-requests', {
                appointmentId,
                testName: f.testName.trim(),
                instructions: f.instructions.trim() || undefined,
            })));

            const lines = valid.map(f =>
                f.instructions.trim()
                    ? `• ${f.testName.trim()} — ${f.instructions.trim()}`
                    : `• ${f.testName.trim()}`
            ).join('\n');
            await axios.post('/messages', { appointmentId, content: `Lab Test Request:\n${lines}` });

            const res = await axios.get(`/lab-requests/appointment/${appointmentId}`);
            setLabRequests(res.data);
            setLabForms([{ testName: '', instructions: '' }]);
        } catch (e: any) {
            alert(e.response?.data?.message || 'Failed to send lab request');
        } finally {
            setSubmittingLab(false);
        }
    };

    const handleDeleteLabRequest = async (id: string) => {
        try {
            await axios.delete(`/lab-requests/${id}`);
            setLabRequests(prev => prev.filter(r => r.id !== id));
        } catch (e: any) {
            alert(e.response?.data?.message || 'Cannot delete');
        }
    };

    const saveNotes = async () => {
        if (savingNotes) return;
        setSavingNotes(true);
        try {
            await axios.patch(`/appointments/${appointmentId}/notes`, { notes });
        } catch (e) {
            console.error('Failed to save notes', e);
        } finally {
            setSavingNotes(false);
        }
    };

    const handleEndCall = async () => {
        if (!diagnosisSaved) {
            const confirmEnd = confirm('Diagnosis not saved. End call anyway?');
            if (!confirmEnd) { setActiveTab('diagnosis'); return; }
        }
        setCompleting(true);
        try {
            await saveNotes();
            await axios.patch(`/appointments/${appointmentId}/complete`);
        } catch (e) {
            console.error(e);
        } finally {
            router.push('/dashboard/doctor/appointments');
        }
    };

    const patientName = sessionData?.appointment?.patient?.profile
        ? `${sessionData.appointment.patient.profile.firstName} ${sessionData.appointment.patient.profile.lastName}`
        : 'Patient';

    const patientId = sessionData?.appointment?.patientId;

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

    const uploadedLabCount = labRequests.filter(r => r.status === 'UPLOADED').length;

    const TABS: { key: SideTab; label: string; icon: React.ReactNode; badge?: number }[] = [
        { key: 'records', label: 'Records', icon: <ClipboardList size={15} /> },
        { key: 'lab-results', label: 'Lab', icon: <FlaskConical size={15} />, badge: uploadedLabCount },
        { key: 'notes', label: 'Notes', icon: <FileText size={15} /> },
        { key: 'diagnosis', label: 'Diagnosis', icon: <Activity size={15} /> },
        { key: 'prescription', label: 'Rx', icon: <Pill size={15} /> },
    ];

    return (
        <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">

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
                    <span className="text-sm font-semibold text-gray-700">Patient: {patientName}</span>
                </div>
            </header>

            {/* Nav Drawer */}
            {navOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="fixed inset-0 bg-black/30" onClick={() => setNavOpen(false)} />
                    <aside className="relative w-64 bg-slate-900 text-white h-full flex flex-col shadow-2xl z-10">
                        <div className="h-14 flex items-center justify-between px-5 border-b border-slate-800">
                            <div className="flex items-center gap-2 text-blue-400">
                                <Activity size={20} />
                                <span className="text-base font-bold text-white">Telehealth Pro</span>
                            </div>
                            <button onClick={() => setNavOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Provider Menu</p>
                            {[
                                { name: 'Dashboard', href: '/dashboard/doctor', icon: <LayoutDashboard size={18} /> },
                                { name: 'Appointments', href: '/dashboard/doctor/appointments', icon: <Calendar size={18} /> },
                                { name: 'Schedule Slots', href: '/dashboard/doctor/schedule', icon: <Clock size={18} /> },
                                { name: 'My Profile', href: '/dashboard/doctor/profile', icon: <UserIcon size={18} /> },
                            ].map(item => (
                                <Link key={item.name} href={item.href} onClick={() => setNavOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                                    <span className="text-slate-400">{item.icon}</span>
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                        <div className="p-4 border-t border-slate-800">
                            <button onClick={() => { localStorage.removeItem('access_token'); router.push('/login'); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 rounded-xl hover:bg-red-400/10 transition-colors">
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
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Consultation Panel</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Patient: {patientName}</p>
                    </div>

                    {/* Tabs */}
                    <nav className="flex border-b border-gray-100">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-all border-b-2 relative
                                    ${activeTab === tab.key
                                        ? 'text-blue-700 border-blue-700 font-semibold'
                                        : 'text-gray-400 border-transparent hover:text-gray-600'}
                                `}
                            >
                                {tab.icon}
                                <span className="text-[10px]">{tab.label}</span>
                                {tab.badge != null && tab.badge > 0 && (
                                    <span className="absolute top-1 right-2 w-3.5 h-3.5 bg-cyan-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden flex flex-col">

                        {/* Medical Records */}
                        {activeTab === 'records' && (
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
                                                <p className="text-[11px] text-gray-500 mt-1.5 line-clamp-3 leading-relaxed">{r.notes}</p>
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
                        )}

                        {/* Notes */}
                        {activeTab === 'notes' && (
                            <>
                                <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                                    <span className="text-xs font-semibold text-gray-700">Session Notes</span>
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                        {savingNotes ? <><Loader2 size={10} className="animate-spin" /> Saving…</> : <><Save size={10} /> Saved</>}
                                    </span>
                                </div>
                                <textarea
                                    className="flex-1 w-full p-4 resize-none outline-none text-xs text-gray-700 focus:ring-inset focus:ring-2 focus:ring-blue-500"
                                    placeholder="Take notes during the consultation…"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    onBlur={saveNotes}
                                />
                            </>
                        )}

                        {/* Diagnosis */}
                        {activeTab === 'diagnosis' && (
                            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                                <DiagnosisPanel
                                    appointmentId={appointmentId}
                                    patientId={patientId}
                                    onClose={() => setActiveTab('records')}
                                    onSaveSuccess={() => setDiagnosisSaved(true)}
                                />
                            </div>
                        )}

                        {/* Prescription */}
                        {activeTab === 'prescription' && (
                            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                                <PrescriptionPanel
                                    appointmentId={appointmentId}
                                    patientId={patientId}
                                    onClose={() => setActiveTab('records')}
                                />
                            </div>
                        )}

                        {/* Lab Requests & Results */}
                        {activeTab === 'lab-results' && (
                            <div className="flex-1 overflow-y-auto flex flex-col" style={{ scrollbarWidth: 'thin' }}>

                                {/* Request form */}
                                <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Plus size={13} className="text-cyan-600" />
                                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Request Lab Tests</span>
                                        </div>
                                        <button
                                            onClick={addLabRow}
                                            className="flex items-center gap-1 text-[11px] font-semibold text-cyan-700 border border-cyan-200 hover:bg-cyan-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <Plus size={11} /> Add More
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5" style={{ scrollbarWidth: 'thin' }}>
                                        {labForms.map((f, i) => (
                                            <div key={i} className="bg-white border border-gray-200 rounded-lg p-2.5 space-y-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">#{i + 1}</span>
                                                    <input
                                                        type="text"
                                                        placeholder="Test name *"
                                                        value={f.testName}
                                                        onChange={e => updateLabForm(i, 'testName', e.target.value)}
                                                        className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder:text-gray-400"
                                                    />
                                                    <button
                                                        onClick={() => removeLabRow(i)}
                                                        disabled={labForms.length === 1}
                                                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-0 cursor-pointer"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Instructions (optional)"
                                                    value={f.instructions}
                                                    onChange={e => updateLabForm(i, 'instructions', e.target.value)}
                                                    className="w-full text-xs px-2 py-1.5 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder:text-gray-400"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleCreateLabRequest}
                                        disabled={!labForms.some(f => f.testName.trim()) || submittingLab}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-cyan-600 text-white text-xs font-semibold rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {submittingLab
                                            ? <><Loader2 size={12} className="animate-spin" /> Sending…</>
                                            : <><Send size={12} /> Send to Patient</>
                                        }
                                    </button>
                                </div>

                                {/* Requests list */}
                                <div className="flex-1 p-4 space-y-3">
                                    {labRequests.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                            <FlaskConical size={28} className="mb-2 text-gray-200" />
                                            <p className="text-xs text-center">No lab tests requested yet.</p>
                                        </div>
                                    ) : labRequests.map(req => (
                                        <div key={req.id} className="border border-gray-100 rounded-xl overflow-hidden">
                                            {/* Request header */}
                                            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-gray-800 truncate">{req.testName}</p>
                                                    {req.instructions && (
                                                        <p className="text-[10px] text-gray-500 truncate">{req.instructions}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        req.status === 'PENDING'  ? 'bg-yellow-100 text-yellow-700' :
                                                        req.status === 'UPLOADED' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                        {req.status}
                                                    </span>
                                                    {req.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => handleDeleteLabRequest(req.id)}
                                                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                                            title="Delete request"
                                                        >
                                                            <Trash2 size={11} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Result viewer */}
                                            {req.result ? (
                                                <div className="bg-white">
                                                    {req.result.fileType === 'image' ? (
                                                        <div className="relative">
                                                            <img
                                                                src={`http://localhost:3001${req.result.fileUrl}`}
                                                                alt={req.result.fileName}
                                                                className="w-full object-contain max-h-72 bg-gray-900"
                                                            />
                                                            <a
                                                                href={`http://localhost:3001${req.result.fileUrl}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/60 text-white text-[10px] rounded-lg hover:bg-black/80 transition-colors"
                                                            >
                                                                <ExternalLink size={10} /> Open Full
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col">
                                                            <iframe
                                                                src={`http://localhost:3001${req.result.fileUrl}`}
                                                                className="w-full h-64 border-0"
                                                                title={req.result.fileName}
                                                            />
                                                            <a
                                                                href={`http://localhost:3001${req.result.fileUrl}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-center gap-1.5 py-2 bg-gray-50 text-blue-600 text-xs font-medium hover:bg-gray-100 transition-colors border-t border-gray-100"
                                                            >
                                                                <ExternalLink size={11} /> Open PDF in new tab
                                                            </a>
                                                        </div>
                                                    )}
                                                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                                        <span className="text-[10px] text-gray-500 truncate">{req.result.fileName}</span>
                                                        {req.status === 'UPLOADED' && (
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await axios.patch(`/lab-requests/${req.id}/reviewed`);
                                                                        setLabRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'REVIEWED' } : r));
                                                                    } catch {}
                                                                }}
                                                                className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors cursor-pointer"
                                                            >
                                                                Mark Reviewed
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="px-3 py-5 text-center">
                                                    <p className="text-[11px] text-gray-400">Awaiting patient upload…</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </aside>

                {/* Video */}
                <section className="flex-1 flex flex-col p-4 gap-4 bg-gray-200 overflow-hidden">
                    <div className="flex-1 relative bg-black rounded-xl overflow-hidden shadow-2xl">
                        {sessionData?.url ? (
                            <iframe
                                src={`${sessionData.url}#userInfo.displayName="Doctor"`}
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
                            <span className="text-white text-xs font-semibold">{patientName}</span>
                        </div>
                    </div>

                    <div className="h-16 bg-white rounded-xl flex items-center justify-center gap-4 px-8 shadow-sm border border-gray-200 shrink-0">
                        <button
                            onClick={handleEndCall}
                            disabled={completing}
                            className="px-5 h-11 rounded-full border border-green-500 text-green-600 text-sm font-semibold flex items-center gap-2 hover:bg-green-50 transition-colors disabled:opacity-50"
                        >
                            {completing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                            {completing ? 'Ending…' : 'End & Complete'}
                        </button>
                        <button
                            onClick={() => router.back()}
                            className="px-5 h-11 rounded-full bg-red-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition-colors shadow-md"
                        >
                            <PhoneOff size={15} /> Leave
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
