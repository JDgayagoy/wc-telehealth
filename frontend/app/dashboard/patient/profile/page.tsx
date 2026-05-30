'use client';

import { toast } from 'sonner';
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from '@/lib/axios';
import { apiUrl } from '@/lib/api-url';
import { format, differenceInYears } from 'date-fns';
import {
    User, Mail, Phone, MapPin, Download, Edit2, X, Save,
    Heart, AlertTriangle, Activity,
    Plus, Fingerprint, Camera, Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

function SectionHeader({ title, icon, editing, onEdit, onSave, onCancel, saving }: {
    title: string; icon: React.ReactNode;
    editing: boolean; saving?: boolean;
    onEdit: () => void; onSave: () => void; onCancel: () => void;
}) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">{icon}{title}</h3>
            {editing ? (
                <div className="flex gap-1.5">
                    <button onClick={onCancel} className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                        <X size={12} /> Cancel
                    </button>
                    <button onClick={onSave} disabled={saving} className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 cursor-pointer transition-colors">
                        {saving ? <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3 h-3" /> : <Save size={12} />}
                        Save
                    </button>
                </div>
            ) : (
                <button onClick={onEdit} className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                    <Edit2 size={12} /> Edit
                </button>
            )}
        </div>
    );
}

export default function PatientProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingPicture, setUploadingPicture] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Section edit states
    const [editPersonal, setEditPersonal] = useState(false);
    const [editMedical, setEditMedical] = useState(false);
    const [editEmergency, setEditEmergency] = useState(false);
    const [editStats, setEditStats] = useState(false);

    // Section saving states
    const [savingPersonal, setSavingPersonal] = useState(false);
    const [savingMedical, setSavingMedical] = useState(false);
    const [savingEmergency, setSavingEmergency] = useState(false);
    const [savingStats, setSavingStats] = useState(false);

    // Form drafts
    const [personalDraft, setPersonalDraft] = useState<any>({});
    const [medicalDraft, setMedicalDraft] = useState<any>({});
    const [emergencyDraft, setEmergencyDraft] = useState<any>({});
    const [statsDraft, setStatsDraft] = useState<any>({});

    // Condition / allergy add
    const [newCondition, setNewCondition] = useState('');
    const [newAllergy, setNewAllergy] = useState('');
    const [addingCondition, setAddingCondition] = useState(false);
    const [addingAllergy, setAddingAllergy] = useState(false);

    const fetchAll = useCallback(async () => {
        const [prof, st, hist] = await Promise.all([
            axios.get('/profile'),
            axios.get('/patients/my/stats').catch(() => ({ data: null })),
            axios.get('/patients/history').catch(() => ({ data: [] })),
        ]);
        setProfile(prof.data);
        setStats(st.data);
        setHistory(hist.data);
    }, []);

    useEffect(() => { fetchAll().finally(() => setLoading(false)); }, [fetchAll]);

    const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingPicture(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await axios.post('/profile/upload-picture', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setProfile((p: any) => ({ ...p, profilePictureUrl: res.data.profilePictureUrl }));
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Upload failed');
        } finally {
            setUploadingPicture(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // ── Personal ──
    const startPersonal = () => {
        setPersonalDraft({
            firstName: profile?.firstName ?? '',
            lastName: profile?.lastName ?? '',
            contactNumber: profile?.contactNumber ?? '',
            birthday: profile?.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : '',
            gender: profile?.gender ?? '',
            address: profile?.address ?? '',
        });
        setEditPersonal(true);
    };
    const savePersonal = async () => {
        setSavingPersonal(true);
        try {
            const res = await axios.patch('/profile', personalDraft);
            // preserve profilePictureUrl — managed separately via upload
            setProfile((p: any) => ({ ...p, ...res.data, profilePictureUrl: p.profilePictureUrl }));
            setEditPersonal(false);
        } catch { toast.error('Failed to save'); }
        finally { setSavingPersonal(false); }
    };

    // ── Medical Summary (blood type) ──
    const startMedical = () => {
        setMedicalDraft({ bloodType: profile?.bloodType ?? '' });
        setEditMedical(true);
    };
    const saveMedical = async () => {
        setSavingMedical(true);
        try {
            const res = await axios.patch('/profile', { bloodType: medicalDraft.bloodType });
            setProfile((p: any) => ({ ...p, ...res.data }));
            setEditMedical(false);
        } catch { toast.error('Failed to save'); }
        finally { setSavingMedical(false); }
    };

    // ── Stats (weight / height) ──
    const startStats = () => {
        setStatsDraft({ weight: stats?.weight ?? '', height: stats?.height ?? '' });
        setEditStats(true);
    };
    const saveStats = async () => {
        const w = parseFloat(statsDraft.weight);
        const h = parseFloat(statsDraft.height);
        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) { toast.error('Enter valid weight and height'); return; }
        setSavingStats(true);
        try {
            const res = await axios.patch('/patients/my/stats', { weight: w, height: h });
            setStats(res.data);
            setEditStats(false);
        } catch { toast.error('Failed to save'); }
        finally { setSavingStats(false); }
    };

    // ── Emergency ──
    const startEmergency = () => {
        setEmergencyDraft({
            emergencyContactName: profile?.emergencyContactName ?? '',
            emergencyContactRelation: profile?.emergencyContactRelation ?? '',
            emergencyContactPhone: profile?.emergencyContactPhone ?? '',
        });
        setEditEmergency(true);
    };
    const saveEmergency = async () => {
        setSavingEmergency(true);
        try {
            const res = await axios.patch('/profile', emergencyDraft);
            setProfile((p: any) => ({ ...p, ...res.data }));
            setEditEmergency(false);
        } catch { toast.error('Failed to save'); }
        finally { setSavingEmergency(false); }
    };

    // ── Conditions ──
    const addCondition = async () => {
        if (!newCondition.trim()) return;
        setAddingCondition(true);
        try {
            await axios.post('/patients/history', { condition: newCondition.trim(), isAllergy: false, isActive: true });
            setNewCondition('');
            const res = await axios.get('/patients/history');
            setHistory(res.data);
        } catch { toast.error('Failed to add'); }
        finally { setAddingCondition(false); }
    };

    const removeHistory = async (id: string) => {
        try {
            await axios.delete(`/patients/history/${id}`);
            setHistory(prev => prev.filter(h => h.id !== id));
        } catch { toast.error('Failed to remove'); }
    };

    // ── Allergies ──
    const addAllergy = async () => {
        if (!newAllergy.trim()) return;
        setAddingAllergy(true);
        try {
            await axios.post('/patients/history', { condition: newAllergy.trim(), isAllergy: true, isActive: true });
            setNewAllergy('');
            const res = await axios.get('/patients/history');
            setHistory(res.data);
        } catch { toast.error('Failed to add'); }
        finally { setAddingAllergy(false); }
    };

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
        </div>
    );

    const conditions = history.filter(h => !h.isAllergy);
    const allergies = history.filter(h => h.isAllergy);
    const age = profile?.birthday ? differenceInYears(new Date(), new Date(profile.birthday)) : null;
    const dob = profile?.birthday ? format(new Date(profile.birthday), 'MMMM d, yyyy') : '—';
    const patientId = profile?.userId ? profile.userId.slice(-8).toUpperCase() : '——';
    const bmi = stats?.weight && stats?.height
        ? (stats.weight / Math.pow(stats.height / 100, 2)).toFixed(1)
        : '—';

    return (
        <div className="px-6 lg:px-10 py-8 max-w-[1440px] mx-auto">

            {/* ── Profile Header ── */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
                <div className="relative shrink-0">
                    <div
                        onClick={() => !uploadingPicture && fileInputRef.current?.click()}
                        className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-gray-100 flex items-center justify-center cursor-pointer group"
                    >
                        {profile?.profilePictureUrl
                            ? <img src={apiUrl(profile.profilePictureUrl)} alt="" className="w-full h-full object-cover" />
                            : <User size={52} className="text-gray-300" />}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                            {uploadingPicture
                                ? <Loader2 size={28} className="text-white animate-spin" />
                                : <Camera size={28} className="text-white" />}
                        </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePictureUpload} />
                    <button onClick={startPersonal} className="absolute bottom-2 right-2 bg-blue-700 text-white p-2 rounded-xl cursor-pointer shadow-lg hover:bg-blue-800 transition-colors">
                        <Edit2 size={15} />
                    </button>
                </div>
                <div className="flex-1 text-center md:text-left w-full">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">{profile?.firstName} {profile?.lastName}</h2>
                            <p className="text-sm text-gray-500 flex items-center justify-center md:justify-start gap-1.5 mt-1">
                                <Fingerprint size={14} /> Patient ID: #{patientId}
                            </p>
                        </div>
                        <div className="flex gap-2 justify-center md:justify-start shrink-0">
                            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold flex items-center gap-1.5 hover:bg-gray-50 transition-colors cursor-pointer">
                                <Download size={15} /> Export Data
                            </button>
                            <button onClick={startPersonal} className="px-4 py-2 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer">
                                Edit Profile
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 border-t border-gray-100 pt-5">
                        <div className="flex items-center gap-3 min-w-0">
                            <Mail size={18} className="text-blue-700 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Email</p>
                                <p className="text-sm font-medium text-gray-900">Not linked</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 min-w-0">
                            <Phone size={18} className="text-blue-700 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Phone</p>
                                <p className="text-sm font-medium text-gray-900 truncate">{profile?.contactNumber || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 min-w-0">
                            <MapPin size={18} className="text-blue-700 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Address</p>
                                <p className="text-sm font-medium text-gray-900 line-clamp-2 break-words">{profile?.address || '—'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 3-col Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Personal Details */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <SectionHeader
                        title="Personal Details" icon={<User size={18} className="text-blue-700" />}
                        editing={editPersonal} saving={savingPersonal}
                        onEdit={startPersonal} onSave={savePersonal} onCancel={() => setEditPersonal(false)}
                    />
                    {editPersonal ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">First Name</label>
                                    <Input value={personalDraft.firstName} onChange={e => setPersonalDraft((d: any) => ({ ...d, firstName: e.target.value }))} className="h-8 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Last Name</label>
                                    <Input value={personalDraft.lastName} onChange={e => setPersonalDraft((d: any) => ({ ...d, lastName: e.target.value }))} className="h-8 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Date of Birth</label>
                                <Input type="date" value={personalDraft.birthday} onChange={e => setPersonalDraft((d: any) => ({ ...d, birthday: e.target.value }))} className="h-8 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Gender</label>
                                <select value={personalDraft.gender} onChange={e => setPersonalDraft((d: any) => ({ ...d, gender: e.target.value }))}
                                    className="w-full h-8 text-sm border border-gray-200 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                                    <option value="">Select gender</option>
                                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Contact Number</label>
                                <Input value={personalDraft.contactNumber} onChange={e => setPersonalDraft((d: any) => ({ ...d, contactNumber: e.target.value }))} className="h-8 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Address</label>
                                <Input value={personalDraft.address} onChange={e => setPersonalDraft((d: any) => ({ ...d, address: e.target.value }))} placeholder="Street, City, State, ZIP" className="h-8 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Profile Picture</label>
                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-8 text-sm border border-dashed border-gray-300 rounded-md text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                                    <Camera size={13} /> Upload new photo
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {[
                                { label: 'Full Name', value: `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim() },
                                { label: 'Date of Birth', value: dob },
                                { label: 'Age', value: age !== null ? `${age} years old` : '—' },
                                { label: 'Gender', value: profile?.gender || '—' },
                                { label: 'Contact Number', value: profile?.contactNumber || '—' },
                                { label: 'Address', value: profile?.address || '—' },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between items-center py-2 px-3 rounded-xl bg-gray-50">
                                    <span className="text-sm text-gray-500 shrink-0">{item.label}</span>
                                    <span className="text-sm font-medium text-gray-900 text-right ml-2 truncate max-w-[55%]">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Medical Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col gap-5">

                    {/* Blood Type */}
                    <div>
                        <SectionHeader
                            title="Medical Summary" icon={<Heart size={18} className="text-blue-700" />}
                            editing={editMedical} saving={savingMedical}
                            onEdit={startMedical} onSave={saveMedical} onCancel={() => setEditMedical(false)}
                        />
                        {editMedical ? (
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Blood Type</label>
                                <select value={medicalDraft.bloodType} onChange={e => setMedicalDraft((d: any) => ({ ...d, bloodType: e.target.value }))}
                                    className="w-full h-8 text-sm border border-gray-200 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                                    <option value="">Unknown</option>
                                    {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50 col-span-1">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Blood Type</p>
                                    <p className="text-2xl font-bold text-blue-700 mt-0.5">{profile?.bloodType || '—'}</p>
                                </div>
                                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50 col-span-1 flex flex-col justify-center">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">BMI</p>
                                    <p className="text-2xl font-bold text-blue-700 mt-0.5">{bmi}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div>
                        <SectionHeader
                            title="Physical Stats" icon={<Activity size={18} className="text-blue-700" />}
                            editing={editStats} saving={savingStats}
                            onEdit={startStats} onSave={saveStats} onCancel={() => setEditStats(false)}
                        />
                        {editStats ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Weight (kg)</label>
                                    <Input type="number" min="1" step="0.1" value={statsDraft.weight} onChange={e => setStatsDraft((d: any) => ({ ...d, weight: e.target.value }))} className="h-8 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Height (cm)</label>
                                    <Input type="number" min="1" step="0.1" value={statsDraft.height} onChange={e => setStatsDraft((d: any) => ({ ...d, height: e.target.value }))} className="h-8 text-sm" />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Weight</p>
                                    <p className="text-xl font-bold text-blue-700 mt-0.5">{stats?.weight != null ? `${stats.weight} kg` : '—'}</p>
                                </div>
                                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Height</p>
                                    <p className="text-xl font-bold text-blue-700 mt-0.5">{stats?.height != null ? `${stats.height} cm` : '—'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Allergies */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <AlertTriangle size={12} className="text-red-500" /> Allergies
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {allergies.length === 0
                                ? <span className="text-sm text-gray-400">None on file</span>
                                : allergies.map((h: any) => (
                                    <span key={h.id} className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1.5">
                                        <AlertTriangle size={10} /> {h.condition}
                                        <button onClick={() => removeHistory(h.id)} className="hover:text-red-900 transition-colors cursor-pointer"><X size={10} /></button>
                                    </span>
                                ))
                            }
                        </div>
                        <div className="flex gap-1.5">
                            <Input
                                value={newAllergy} onChange={e => setNewAllergy(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') addAllergy(); }}
                                placeholder="Add allergy…" className="h-7 text-xs"
                            />
                            <button onClick={addAllergy} disabled={!newAllergy.trim() || addingAllergy}
                                className="px-2 h-7 bg-red-50 text-red-700 border border-red-200 rounded-md text-xs font-semibold hover:bg-red-100 disabled:opacity-50 cursor-pointer transition-colors shrink-0">
                                <Plus size={13} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Emergency + Activity */}
                <div className="flex flex-col gap-6">
                    {/* Emergency Contact */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <SectionHeader
                            title="Emergency Contact" icon={<Activity size={18} className="text-red-500" />}
                            editing={editEmergency} saving={savingEmergency}
                            onEdit={startEmergency} onSave={saveEmergency} onCancel={() => setEditEmergency(false)}
                        />
                        {editEmergency ? (
                            <div className="space-y-2">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Name</label>
                                    <Input value={emergencyDraft.emergencyContactName} onChange={e => setEmergencyDraft((d: any) => ({ ...d, emergencyContactName: e.target.value }))} placeholder="Full name" className="h-8 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Relationship</label>
                                    <Input value={emergencyDraft.emergencyContactRelation} onChange={e => setEmergencyDraft((d: any) => ({ ...d, emergencyContactRelation: e.target.value }))} placeholder="e.g. Spouse, Parent" className="h-8 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                                    <Input value={emergencyDraft.emergencyContactPhone} onChange={e => setEmergencyDraft((d: any) => ({ ...d, emergencyContactPhone: e.target.value }))} placeholder="+1 (555) 000-0000" className="h-8 text-sm" />
                                </div>
                            </div>
                        ) : profile?.emergencyContactName ? (
                            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                    <User size={20} className="text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{profile.emergencyContactName}</p>
                                    <p className="text-xs text-gray-500">
                                        {profile.emergencyContactRelation && <span>{profile.emergencyContactRelation} · </span>}
                                        {profile.emergencyContactPhone || '—'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-4 rounded-xl text-center text-sm text-gray-400">
                                No emergency contact set
                            </div>
                        )}
                    </div>

                    {/* Known Conditions */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <Heart size={18} className="text-blue-700" /> Known Conditions
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {conditions.length === 0
                                ? <span className="text-sm text-gray-400">No conditions on file</span>
                                : conditions.map((h: any) => (
                                    <span key={h.id} className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${h.isActive ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${h.isActive ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                        {h.condition}
                                        {h.diagnosedAt && <span className="text-xs opacity-60">{format(new Date(h.diagnosedAt), 'MMM yyyy')}</span>}
                                        <button onClick={() => removeHistory(h.id)} className="hover:opacity-70 transition-opacity cursor-pointer ml-0.5"><X size={12} /></button>
                                    </span>
                                ))
                            }
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={newCondition} onChange={e => setNewCondition(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') addCondition(); }}
                                placeholder="Add condition…"
                                className="h-8 text-sm"
                            />
                            <button onClick={addCondition} disabled={!newCondition.trim() || addingCondition}
                                className="px-2.5 h-8 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 cursor-pointer transition-colors shrink-0 flex items-center gap-1">
                                {addingCondition ? <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3 h-3" /> : <Plus size={13} />}
                            </button>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}
