'use client';

import { toast } from 'sonner';
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from '@/lib/axios';
import { apiUrl } from '@/lib/api-url';
import { format, differenceInYears } from 'date-fns';
import {
    User, Phone, Edit2, X, Save, Stethoscope,
    Award, Camera, Loader2, Check, Upload, Trash2,
    FileSignature, Fingerprint, Star, Briefcase, Plus, CalendarDays,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const GENDERS = ['Male', 'Female', 'Other'];

function getUserIdFromToken(): string | null {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) return null;
        return JSON.parse(atob(token.split('.')[1])).sub ?? null;
    } catch { return null; }
}

const SPECIALIZATIONS = [
    'General Practitioner', 'Cardiologist', 'Dermatologist', 'Neurologist',
    'Psychiatrist', 'Orthopedist', 'Pulmonologist', 'Gastroenterologist',
    'Endocrinologist', 'Pediatrician', 'OB-GYN', 'Urologist', 'Ophthalmologist',
    'ENT Specialist', 'Oncologist',
];

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

export default function DoctorProfilePage() {
    const [profile,       setProfile]       = useState<any>(null);
    const [doctorProfile, setDoctorProfile] = useState<any>(null);
    const [ratings,       setRatings]       = useState<any[]>([]);
    const [avgRating,     setAvgRating]     = useState<number | null>(null);
    const [ratingCount,   setRatingCount]   = useState(0);
    const [workExp,       setWorkExp]       = useState<any[]>([]);
    const [addingWork,    setAddingWork]    = useState(false);
    const [savingWork,    setSavingWork]    = useState(false);
    const [newWork,       setNewWork]       = useState({ jobTitle: '', hospital: '', startDate: '', endDate: '', isCurrent: false });
    const [loading,       setLoading]       = useState(true);
    const [uploadingPic,  setUploadingPic]  = useState(false);
    const [uploadingSig,  setUploadingSig]  = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sigInputRef  = useRef<HTMLInputElement>(null);

    // Section edit states
    const [editPersonal,     setEditPersonal]     = useState(false);
    const [editCredentials,  setEditCredentials]  = useState(false);

    // Saving states
    const [savingPersonal,    setSavingPersonal]    = useState(false);
    const [savingCredentials, setSavingCredentials] = useState(false);

    // Drafts
    const [personalDraft,    setPersonalDraft]    = useState<any>({});
    const [credentialsDraft, setCredentialsDraft] = useState<any>({});

    const fetchAll = useCallback(async () => {
        const userId = getUserIdFromToken();
        const [pRes, dRes, docRes] = await Promise.all([
            axios.get('/profile'),
            axios.get('/profile/doctor').catch(() => ({ data: null })),
            userId ? axios.get(`/doctors/${userId}`).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        ]);
        setProfile(pRes.data);
        setDoctorProfile(dRes.data);
        setWorkExp(Array.isArray(dRes.data?.workExperience)
            ? dRes.data.workExperience.map((e: any, i: number) => ({ id: e.id ?? `we-${i}`, ...e }))
            : []);
        if (docRes.data) {
            setAvgRating(docRes.data.avgRating ?? null);
            setRatingCount(docRes.data.ratingCount ?? 0);
            setRatings(docRes.data.recentReviews ?? []);
        }
    }, []);

    useEffect(() => { fetchAll().finally(() => setLoading(false)); }, [fetchAll]);

    // ── Profile picture upload ──
    const handlePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be under 5MB');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        setUploadingPic(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await axios.post('/profile/upload-picture', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setProfile((p: any) => ({ ...p, profilePictureUrl: res.data.profilePictureUrl }));
        } catch (e: any) { toast.error(e.response?.data?.message || 'Upload failed'); }
        finally { setUploadingPic(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    // ── Signature upload ──
    const handleSigUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingSig(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await axios.post('/profile/doctor/upload-signature', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setDoctorProfile((d: any) => ({ ...d, signatureUrl: res.data?.signatureUrl }));
        } catch (e: any) { toast.error(e.response?.data?.message || 'Upload failed'); }
        finally { setUploadingSig(false); if (sigInputRef.current) sigInputRef.current.value = ''; }
    };

    const handleRemoveSig = async () => {
        try {
            await axios.patch('/profile/doctor', { signatureUrl: null });
            setDoctorProfile((d: any) => ({ ...d, signatureUrl: null }));
        } catch { toast.error('Failed to remove signature'); }
    };

    // ── Personal ──
    const startPersonal = () => {
        setPersonalDraft({
            firstName:     profile?.firstName     ?? '',
            lastName:      profile?.lastName      ?? '',
            contactNumber: profile?.contactNumber ?? '',
            birthday:      profile?.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : '',
            gender:        profile?.gender        ?? '',
        });
        setEditPersonal(true);
    };
    const savePersonal = async () => {
        setSavingPersonal(true);
        try {
            const res = await axios.patch('/profile', personalDraft);
            setProfile((p: any) => ({ ...p, ...res.data, profilePictureUrl: p.profilePictureUrl }));
            setEditPersonal(false);
        } catch { toast.error('Failed to save'); }
        finally { setSavingPersonal(false); }
    };

    // ── Credentials ──
    const startCredentials = () => {
        setCredentialsDraft({
            bio:               doctorProfile?.bio               ?? '',
            specialization:    doctorProfile?.specialization    ?? [],
            licenseNumber:     doctorProfile?.licenseNumber     ?? '',
            yearsOfExperience: doctorProfile?.yearsOfExperience != null ? String(doctorProfile.yearsOfExperience) : '',
        });
        setEditCredentials(true);
    };
    const saveCredentials = async () => {
        setSavingCredentials(true);
        try {
            const payload: any = {
                bio:            credentialsDraft.bio,
                specialization: credentialsDraft.specialization,
                licenseNumber:  credentialsDraft.licenseNumber,
            };
            if (credentialsDraft.yearsOfExperience)
                payload.yearsOfExperience = parseInt(credentialsDraft.yearsOfExperience, 10);
            const res = await axios.patch('/profile/doctor', payload);
            setDoctorProfile((d: any) => ({ ...d, ...res.data }));
            setEditCredentials(false);
        } catch { toast.error('Failed to save'); }
        finally { setSavingCredentials(false); }
    };

    const saveWorkExp = async (updated: any[]) => {
        setSavingWork(true);
        try {
            await axios.patch('/profile/doctor', { workExperience: updated });
            setWorkExp(updated);
        } catch { toast.error('Failed to save'); }
        finally { setSavingWork(false); }
    };

    const handleAddWork = async () => {
        if (!newWork.jobTitle.trim() || !newWork.hospital.trim() || !newWork.startDate) {
            toast.error('Job title, hospital, and start date are required.');
            return;
        }
        const updated = [...workExp, { ...newWork, id: Date.now().toString() }];
        await saveWorkExp(updated);
        setNewWork({ jobTitle: '', hospital: '', startDate: '', endDate: '', isCurrent: false });
        setAddingWork(false);
    };

    const handleRemoveWork = (id: string) =>
        saveWorkExp(workExp.filter((e: any) => e.id !== id));

    const toggleSpec = (s: string) =>
        setCredentialsDraft((d: any) => ({
            ...d,
            specialization: d.specialization.includes(s)
                ? d.specialization.filter((x: string) => x !== s)
                : [...d.specialization, s],
        }));

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
        </div>
    );

    const age = profile?.birthday ? differenceInYears(new Date(), new Date(profile.birthday)) : null;
    const dob = profile?.birthday ? format(new Date(profile.birthday), 'MMMM d, yyyy') : '—';
    const doctorId = profile?.userId ? profile.userId.slice(-8).toUpperCase() : '——';
    const picUrl = profile?.profilePictureUrl
        ? apiUrl(profile.profilePictureUrl)
        : null;
    const sigUrl = doctorProfile?.signatureUrl ? apiUrl(doctorProfile.signatureUrl) : null;
    const specs: string[] = Array.isArray(doctorProfile?.specialization) ? doctorProfile.specialization : [];

    return (
        <div className="px-6 lg:px-10 py-8 max-w-[1440px] mx-auto">

            {/* ── Profile Header ── */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
                <div className="relative shrink-0">
                    <div
                        onClick={() => !uploadingPic && fileInputRef.current?.click()}
                        className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-gray-100 flex items-center justify-center cursor-pointer group relative"
                    >
                        {picUrl
                            ? <img src={picUrl} alt="" className="w-full h-full object-cover" />
                            : <User size={52} className="text-gray-300" />}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                            {uploadingPic
                                ? <Loader2 size={28} className="text-white animate-spin" />
                                : <Camera size={28} className="text-white" />}
                        </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePicUpload} />
                    <button onClick={startPersonal} className="absolute bottom-2 right-2 bg-blue-700 text-white p-2 rounded-xl cursor-pointer shadow-lg hover:bg-blue-800 transition-colors">
                        <Edit2 size={15} />
                    </button>
                </div>

                <div className="flex-1 text-center md:text-left w-full">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">
                                Dr. {profile?.firstName} {profile?.lastName}
                            </h2>
                            <p className="text-sm text-gray-500 flex items-center justify-center md:justify-start gap-1.5 mt-1">
                                <Fingerprint size={14} /> Doctor ID: #{doctorId}
                            </p>
                            {/* Rating */}
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-0.5">
                                    {[1,2,3,4,5].map(i => (
                                        <Star key={i} size={15} className={
                                            avgRating !== null && i <= Math.round(avgRating)
                                                ? 'text-amber-400 fill-amber-400'
                                                : 'text-gray-200 fill-gray-200'
                                        } />
                                    ))}
                                </div>
                                <span className="text-sm font-semibold text-gray-900">
                                    {avgRating !== null ? avgRating.toFixed(1) : '—'}
                                </span>
                                <span className="text-sm text-gray-400">
                                    ({ratingCount} review{ratingCount !== 1 ? 's' : ''})
                                </span>
                            </div>
                        </div>
                        <button onClick={startPersonal} className="px-4 py-2 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer self-start">
                            Edit Profile
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 border-t border-gray-100 pt-5">
                        <div className="flex items-center gap-3 min-w-0">
                            <Phone size={18} className="text-blue-700 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Phone</p>
                                <p className="text-sm font-medium text-gray-900 truncate">{profile?.contactNumber || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 min-w-0">
                            <Stethoscope size={18} className="text-blue-700 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Specialization</p>
                                <p className="text-sm font-medium text-gray-900 truncate">{specs[0] || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 min-w-0">
                            <Award size={18} className="text-blue-700 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">License</p>
                                <p className="text-sm font-medium text-gray-900 truncate">{doctorProfile?.licenseNumber || '—'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 3-col Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Col 1 — Personal Details */}
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
                                { label: 'Full Name', value: `Dr. ${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim() },
                                { label: 'Date of Birth', value: dob },
                                { label: 'Age', value: age !== null ? `${age} years old` : '—' },
                                { label: 'Gender', value: profile?.gender || '—' },
                                { label: 'Contact', value: profile?.contactNumber || '—' },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between items-center py-2 px-3 rounded-xl bg-gray-50">
                                    <span className="text-sm text-gray-500 shrink-0">{item.label}</span>
                                    <span className="text-sm font-medium text-gray-900 text-right ml-2 truncate max-w-[55%]">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Col 2 — Professional Credentials */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <SectionHeader
                        title="Professional Credentials" icon={<Stethoscope size={18} className="text-blue-700" />}
                        editing={editCredentials} saving={savingCredentials}
                        onEdit={startCredentials} onSave={saveCredentials} onCancel={() => setEditCredentials(false)}
                    />
                    {editCredentials ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Professional Summary</label>
                                <textarea
                                    value={credentialsDraft.bio}
                                    onChange={e => setCredentialsDraft((d: any) => ({ ...d, bio: e.target.value }))}
                                    rows={3}
                                    placeholder="Describe your clinical focus…"
                                    className="w-full resize-none border border-gray-200 rounded-lg p-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-2 block">Specializations</label>
                                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                                    {SPECIALIZATIONS.map(s => {
                                        const sel = credentialsDraft.specialization?.includes(s);
                                        return (
                                            <button key={s} type="button" onClick={() => toggleSpec(s)}
                                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                                                    sel ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700'
                                                }`}>
                                                {sel && <Check size={10} />}{s}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">License #</label>
                                    <Input value={credentialsDraft.licenseNumber} onChange={e => setCredentialsDraft((d: any) => ({ ...d, licenseNumber: e.target.value }))} className="h-8 text-sm" placeholder="State License #" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Years of Exp.</label>
                                    <Input type="number" min="0" max="60" value={credentialsDraft.yearsOfExperience} onChange={e => setCredentialsDraft((d: any) => ({ ...d, yearsOfExperience: e.target.value }))} className="h-8 text-sm" placeholder="e.g. 8" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="py-2 px-3 rounded-xl bg-gray-50">
                                <p className="text-xs text-gray-400 mb-1">Summary</p>
                                <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">{doctorProfile?.bio || '—'}</p>
                            </div>
                            <div className="py-2 px-3 rounded-xl bg-gray-50">
                                <p className="text-xs text-gray-400 mb-2">Specializations</p>
                                {specs.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {specs.map(s => (
                                            <span key={s} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">{s}</span>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-gray-400">None added</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="py-2 px-3 rounded-xl bg-gray-50">
                                    <p className="text-xs text-gray-400">License #</p>
                                    <p className="text-sm font-medium text-gray-900 mt-0.5">{doctorProfile?.licenseNumber || '—'}</p>
                                </div>
                                <div className="py-2 px-3 rounded-xl bg-gray-50">
                                    <p className="text-xs text-gray-400">Experience</p>
                                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                                        {doctorProfile?.yearsOfExperience != null ? `${doctorProfile.yearsOfExperience} yrs` : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Col 3 — Digital Signature */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <FileSignature size={18} className="text-blue-700" /> Digital Signature
                        </h3>
                    </div>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                        Appears on appointment summaries and consultation records. Use a clean image on a white or transparent background.
                    </p>

                    {sigUrl ? (
                        <div className="space-y-3">
                            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 flex items-center justify-center min-h-[120px]">
                                <img src={sigUrl} alt="Signature" className="max-h-24 max-w-full object-contain" />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => sigInputRef.current?.click()}
                                    disabled={uploadingSig}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors"
                                >
                                    <Upload size={13} />{uploadingSig ? 'Uploading…' : 'Replace'}
                                </button>
                                <button
                                    onClick={handleRemoveSig}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => sigInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                        >
                            {uploadingSig ? (
                                <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                        <Upload size={22} className="text-blue-600" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-gray-700">Upload signature</p>
                                        <p className="text-xs text-gray-400 mt-0.5">PNG recommended · Max 5MB</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <input ref={sigInputRef} type="file" accept="image/*" className="hidden" onChange={handleSigUpload} />
                </div>

            </div>

            {/* ── Clinical Experience ── */}
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Briefcase size={18} className="text-blue-700" /> Clinical Experience
                    </h3>
                    {!addingWork && (
                        <button
                            onClick={() => setAddingWork(true)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-700 text-white rounded-lg hover:bg-blue-800 cursor-pointer transition-colors"
                        >
                            <Plus size={12} /> Add Experience
                        </button>
                    )}
                </div>

                {/* Existing entries */}
                {workExp.length > 0 && (
                    <div className="space-y-3 mb-5">
                        {workExp.map((e: any, idx: number) => (
                            <div key={e.id ?? idx} className="flex items-start justify-between gap-4 py-3 px-4 rounded-xl bg-gray-50 border border-gray-200 group">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <Briefcase size={16} className="text-blue-700" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 leading-tight">{e.jobTitle}</p>
                                        <p className="text-sm text-gray-600 mt-0.5">{e.hospital}</p>
                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                                            <CalendarDays size={11} />
                                            <span>{e.startDate}</span>
                                            <span>—</span>
                                            <span>{e.isCurrent ? <span className="text-green-600 font-semibold">Present</span> : e.endDate || '—'}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveWork(e.id)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100 shrink-0"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {workExp.length === 0 && !addingWork && (
                    <div className="text-center py-8 text-gray-400">
                        <Briefcase size={32} className="mx-auto mb-2 text-gray-200" />
                        <p className="text-sm">No work experience added yet.</p>
                    </div>
                )}

                {/* Add form */}
                {addingWork && (
                    <div className="border border-blue-200 rounded-xl p-5 bg-blue-50/30 space-y-3">
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">New Entry</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Job Title *</label>
                                <Input
                                    value={newWork.jobTitle}
                                    onChange={e => setNewWork(d => ({ ...d, jobTitle: e.target.value }))}
                                    placeholder="e.g. Attending Physician"
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Hospital / Clinic *</label>
                                <Input
                                    value={newWork.hospital}
                                    onChange={e => setNewWork(d => ({ ...d, hospital: e.target.value }))}
                                    placeholder="e.g. Mayo Clinic"
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Start Date *</label>
                                <Input
                                    type="month"
                                    value={newWork.startDate}
                                    onChange={e => setNewWork(d => ({ ...d, startDate: e.target.value }))}
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                                <Input
                                    type="month"
                                    value={newWork.endDate}
                                    onChange={e => setNewWork(d => ({ ...d, endDate: e.target.value }))}
                                    disabled={newWork.isCurrent}
                                    className="h-9 text-sm disabled:opacity-40"
                                />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={newWork.isCurrent}
                                onChange={e => setNewWork(d => ({ ...d, isCurrent: e.target.checked, endDate: e.target.checked ? '' : d.endDate }))}
                                className="rounded accent-blue-700"
                            />
                            <span className="text-xs text-gray-600 font-medium">Currently working here</span>
                        </label>
                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                onClick={() => { setAddingWork(false); setNewWork({ jobTitle: '', hospital: '', startDate: '', endDate: '', isCurrent: false }); }}
                                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddWork}
                                disabled={savingWork}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 cursor-pointer transition-colors"
                            >
                                {savingWork ? <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3 h-3" /> : <Check size={12} />}
                                Save
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Patient Reviews ── */}
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Star size={18} className="text-amber-400 fill-amber-400" /> Patient Reviews
                    </h3>
                    {avgRating !== null && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                            <span className="text-lg font-bold text-amber-600">{avgRating.toFixed(1)}</span>
                            <div className="flex items-center gap-0.5">
                                {[1,2,3,4,5].map(i => (
                                    <Star key={i} size={12} className={i <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                                ))}
                            </div>
                            <span className="text-xs text-gray-500">{ratingCount} total</span>
                        </div>
                    )}
                </div>

                {ratings.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <Star size={32} className="mx-auto mb-2 text-gray-200" />
                        <p className="text-sm">No reviews yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ratings.map((r: any) => {
                            const pName = r.patient?.profile
                                ? `${r.patient.profile.firstName ?? ''} ${r.patient.profile.lastName ?? ''}`.trim()
                                : 'Patient';
                            const initials = pName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
                            return (
                                <div key={r.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0 overflow-hidden">
                                                {r.patient?.profile?.profilePictureUrl
                                                    ? <img src={apiUrl(r.patient.profile.profilePictureUrl)} alt="" className="w-full h-full object-cover" />
                                                    : initials}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 leading-tight">{pName}</p>
                                                {r.createdAt && <p className="text-[10px] text-gray-400">{format(new Date(r.createdAt), 'MMM d, yyyy')}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            {[1,2,3,4,5].map(i => (
                                                <Star key={i} size={12} className={i <= (r.rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                                            ))}
                                        </div>
                                    </div>
                                    {r.review && (
                                        <p className="text-xs text-gray-600 leading-relaxed italic">"{r.review}"</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}
