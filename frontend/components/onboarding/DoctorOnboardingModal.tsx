'use client';

import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import axios from '@/lib/axios';
import {
    User, Stethoscope, ChevronRight, ChevronLeft,
    Check, Shield, X, Plus, Award, FileSignature, Upload, Trash2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const STEPS = [
    { id: 1, label: 'Personal Info',  icon: User },
    { id: 2, label: 'Credentials',   icon: Award },
    { id: 3, label: 'Signature',     icon: FileSignature },
];

const GENDERS = ['Male', 'Female', 'Other'];

const SPECIALIZATIONS = [
    'General Practitioner', 'Cardiologist', 'Dermatologist', 'Neurologist',
    'Psychiatrist', 'Orthopedist', 'Pulmonologist', 'Gastroenterologist',
    'Endocrinologist', 'Pediatrician', 'OB-GYN', 'Urologist', 'Ophthalmologist',
    'ENT Specialist', 'Oncologist',
];

interface Props {
    userId: string;
    initialProfile: any;
    onComplete: () => void;
}

export function DoctorOnboardingModal({ userId, initialProfile, onComplete }: Props) {
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        document.body.classList.add('modal-open');
        return () => document.body.classList.remove('modal-open');
    }, []);

    // Step 3 — signature
    const [sigPreview,   setSigPreview]   = useState<string | null>(null);
    const [sigUploading, setSigUploading] = useState(false);
    const sigInputRef = useRef<HTMLInputElement>(null);

    // Step 1 — personal info
    const [s1, setS1] = useState({
        firstName:     initialProfile?.firstName     ?? '',
        lastName:      initialProfile?.lastName      ?? '',
        birthday:      initialProfile?.birthday
            ? new Date(initialProfile.birthday).toISOString().split('T')[0]
            : '',
        contactNumber: initialProfile?.contactNumber ?? '',
        gender:        initialProfile?.gender        ?? '',
    });

    // Step 2 — professional credentials
    const [bio,               setBio]               = useState(initialProfile?.bio               ?? '');
    const [specializations,   setSpecializations]   = useState<string[]>(initialProfile?.specialization ?? []);
    const [licenseNumber,     setLicenseNumber]     = useState(initialProfile?.licenseNumber     ?? '');
    const [yearsOfExperience, setYearsOfExperience] = useState(
        initialProfile?.yearsOfExperience ? String(initialProfile.yearsOfExperience) : ''
    );

    const toggleSpec = (s: string) =>
        setSpecializations(prev =>
            prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
        );

    const saveStep = async (s: number) => {
        if (s === 1) {
            await axios.patch('/profile', s1);
        } else if (s === 2) {
            const payload: Record<string, any> = { bio, specialization: specializations };
            if (licenseNumber)     payload.licenseNumber     = licenseNumber;
            if (yearsOfExperience) payload.yearsOfExperience = parseInt(yearsOfExperience, 10);
            await axios.patch('/profile/doctor', payload);
        }
        // step 3 signature is uploaded immediately on file select — no deferred save
    };

    const handleSigSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSigUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            await axios.post('/profile/doctor/upload-signature', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSigPreview(URL.createObjectURL(file));
        } catch { toast.error('Signature upload failed'); }
        finally { setSigUploading(false); e.target.value = ''; }
    };

    const handleNext = async () => {
        setSaving(true);
        try { await saveStep(step); } catch {}
        finally { setSaving(false); }
        setStep(s => s + 1);
    };

    const handleFinish = async () => {
        localStorage.setItem(`telehealth_doctor_onboarding_${userId}`, '1');
        onComplete();
    };

    const handleSkip = () => {
        localStorage.setItem(`telehealth_doctor_onboarding_${userId}`, '1');
        onComplete();
    };

    const progress = ((step - 1) / STEPS.length) * 100;

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col sm:flex-row overflow-hidden" style={{ maxHeight: '95vh' }}>

                {/* Mobile step bar */}
                <div className="flex sm:hidden items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 shrink-0">
                    {STEPS.map(s => {
                        const isActive = step === s.id;
                        const isDone   = step > s.id;
                        return (
                            <div key={s.id} className="flex items-center gap-1.5 flex-1">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                                    isDone ? 'bg-green-500 text-white' : isActive ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-400'
                                }`}>
                                    {isDone ? <Check size={10} /> : s.id}
                                </div>
                                <span className={`text-[10px] font-semibold hidden xs:block ${isActive ? 'text-blue-700' : isDone ? 'text-gray-400' : 'text-gray-400'}`}>{s.label}</span>
                                {s.id < STEPS.length && <div className={`h-px flex-1 ${isDone ? 'bg-green-300' : 'bg-gray-200'}`} />}
                            </div>
                        );
                    })}
                </div>

                {/* Sidebar — desktop only */}
                <aside className="hidden sm:flex w-52 bg-gray-50 border-r border-gray-200 flex-col py-6 shrink-0">
                    <div className="px-5 mb-5">
                        <div className="flex items-center gap-2 mb-1">
                            <Stethoscope size={14} className="text-blue-700" />
                            <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Enrollment</h2>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">Practitioner onboarding</p>
                    </div>
                    <nav className="flex-1">
                        {STEPS.map(s => {
                            const Icon = s.icon;
                            const isActive = step === s.id;
                            const isDone   = step > s.id;
                            return (
                                <div key={s.id} className={`flex items-center gap-3 px-5 py-2.5 transition-all ${
                                    isActive
                                        ? 'bg-blue-50 border-l-4 border-blue-700 text-blue-700 font-semibold'
                                        : isDone
                                        ? 'text-gray-400'
                                        : 'text-gray-500'
                                }`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                        isDone ? 'bg-green-100' : isActive ? 'bg-blue-100' : 'bg-gray-200'
                                    }`}>
                                        {isDone
                                            ? <Check size={12} className="text-green-600" />
                                            : <Icon size={12} className={isActive ? 'text-blue-700' : 'text-gray-400'} />
                                        }
                                    </div>
                                    <span className="text-xs leading-tight">{s.label}</span>
                                </div>
                            );
                        })}
                    </nav>
                    <div className="px-5 pb-2">
                        <div className="bg-white rounded-xl p-3 border border-gray-200">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Progress</p>
                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-1.5">
                                <div
                                    className="bg-blue-700 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-[10px] font-semibold text-blue-700">Step {step} of {STEPS.length}</p>
                        </div>
                    </div>
                </aside>

                {/* Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                        <div>
                            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                                Step {step} of {STEPS.length}
                            </span>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">
                                {STEPS[step - 1].label}
                            </h2>
                        </div>
                        <button
                            onClick={handleSkip}
                            className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        >
                            Skip
                        </button>
                    </div>

                    <main className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: 'thin' }}>
                        <p className="text-sm text-gray-500 mb-5">
                            {step === 1 && 'Provide your legal personal information. Used only for administrative verification.'}
                            {step === 2 && 'Verify your medical qualifications. Accuracy is required for clinical compliance.'}
                            {step === 3 && 'Upload your digital signature. It will appear on appointment summaries and consultation records.'}
                        </p>

                        {/* ── Step 1: Personal Info ── */}
                        {step === 1 && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">First Name</label>
                                        <Input
                                            value={s1.firstName}
                                            onChange={e => setS1(d => ({ ...d, firstName: e.target.value }))}
                                            placeholder="Jonathan"
                                            className="h-11"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Last Name</label>
                                        <Input
                                            value={s1.lastName}
                                            onChange={e => setS1(d => ({ ...d, lastName: e.target.value }))}
                                            placeholder="Smith"
                                            className="h-11"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Date of Birth</label>
                                        <Input
                                            type="date"
                                            value={s1.birthday}
                                            onChange={e => setS1(d => ({ ...d, birthday: e.target.value }))}
                                            className="h-11"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Gender</label>
                                        <div className="flex h-11 p-1 bg-gray-100 border border-gray-200 rounded-xl gap-1">
                                            {GENDERS.map(g => (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    onClick={() => setS1(d => ({ ...d, gender: g }))}
                                                    className={`flex-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                                        s1.gender === g
                                                            ? 'bg-white shadow text-blue-700 font-semibold'
                                                            : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Mobile Number</label>
                                    <Input
                                        value={s1.contactNumber}
                                        onChange={e => setS1(d => ({ ...d, contactNumber: e.target.value }))}
                                        placeholder="+1 (555) 000-0000"
                                        className="h-11"
                                    />
                                </div>

                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex gap-2.5">
                                    <Shield size={16} className="text-blue-700 shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700">
                                        Your information is encrypted and used only for credential verification. Name must match your official medical license.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── Step 3: Digital Signature ── */}
                        {step === 3 && (
                            <div className="space-y-5">
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
                                    {sigPreview ? (
                                        <>
                                            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 flex items-center justify-center min-h-[140px]">
                                                <img src={sigPreview} alt="Signature preview" className="max-h-28 max-w-full object-contain" />
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => sigInputRef.current?.click()}
                                                    disabled={sigUploading}
                                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-blue-200 text-blue-700 text-xs font-semibold rounded-xl hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
                                                >
                                                    <Upload size={13} /> Replace Signature
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSigPreview(null)}
                                                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                            <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded-r-2xl flex gap-2.5">
                                                <Check size={16} className="text-green-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-semibold text-green-800">Signature uploaded!</p>
                                                    <p className="text-xs text-green-700 mt-0.5">You can replace it anytime from your profile page.</p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div
                                            onClick={() => !sigUploading && sigInputRef.current?.click()}
                                            className="border-2 border-dashed border-gray-200 rounded-xl p-12 flex flex-col items-center gap-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                                        >
                                            {sigUploading ? (
                                                <div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                                        <Upload size={28} className="text-blue-600" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-semibold text-gray-700">Click to upload your signature</p>
                                                        <p className="text-xs text-gray-400 mt-1">PNG recommended · White or transparent background · Max 5MB</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <input
                                        ref={sigInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleSigSelect}
                                    />
                                </div>

                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex gap-2.5">
                                    <Shield size={16} className="text-blue-700 shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700">
                                        Your signature is stored securely. You can skip this step and add it later from your profile settings.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Professional Credentials ── */}
                        {step === 2 && (
                            <div className="space-y-4">
                                {/* Bio */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                                        Professional Summary
                                    </label>
                                    <textarea
                                        value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        rows={3}
                                        placeholder="Describe your clinical focus and experience…"
                                        className="w-full resize-none border border-gray-200 rounded-xl p-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                                    />
                                </div>

                                {/* Specializations */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-3">
                                        Specializations
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {SPECIALIZATIONS.map(s => {
                                            const selected = specializations.includes(s);
                                            return (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => toggleSpec(s)}
                                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                                                        selected
                                                            ? 'bg-blue-700 text-white border-blue-700'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700'
                                                    }`}
                                                >
                                                    {selected && <Check size={11} />}
                                                    {s}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* License + Experience */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-3">
                                        Medical Licensing
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">License Number</label>
                                            <Input
                                                value={licenseNumber}
                                                onChange={e => setLicenseNumber(e.target.value)}
                                                placeholder="State License #"
                                                className="h-11"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Years of Experience</label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="60"
                                                value={yearsOfExperience}
                                                onChange={e => setYearsOfExperience(e.target.value)}
                                                placeholder="e.g. 8"
                                                className="h-11"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded-r-2xl flex gap-2.5">
                                    <Check size={16} className="text-green-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-semibold text-green-800">Almost done!</p>
                                        <p className="text-xs text-green-700 mt-0.5">You can update credentials anytime from your profile page.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <Shield size={12} className="text-blue-700" />
                            HIPAA encrypted
                        </div>
                        <div className="flex gap-2">
                            {step > 1 && (
                                <button
                                    onClick={() => setStep(s => s - 1)}
                                    disabled={saving}
                                    className="flex items-center gap-1 px-4 h-9 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    <ChevronLeft size={14} /> Back
                                </button>
                            )}
                            {step < STEPS.length ? (
                                <button
                                    onClick={handleNext}
                                    disabled={saving}
                                    className="flex items-center gap-1 px-5 h-9 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                                >
                                    {saving ? 'Saving…' : <>Next <ChevronRight size={14} /></>}
                                </button>
                            ) : (
                                <button
                                    onClick={handleFinish}
                                    disabled={saving}
                                    className="flex items-center gap-1 px-5 h-9 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                                >
                                    {saving ? 'Saving…' : <><Check size={14} /> Finish</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
