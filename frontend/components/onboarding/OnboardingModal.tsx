'use client';

import { useState, useMemo, useEffect } from 'react';
import axios from '@/lib/axios';
import {
    User, Heart, Phone, MapPin, ChevronRight, ChevronLeft,
    X, Check, AlertTriangle, Plus, Droplets, Activity,
    ClipboardList, Shield,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const STEPS = [
    { id: 1, label: 'Personal Details', icon: User },
    { id: 2, label: 'Medical Vitals',   icon: Heart },
    { id: 3, label: 'Emergency Contact', icon: Phone },
    { id: 4, label: 'Medical History',  icon: ClipboardList },
];

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];
const GENDERS = ['Male', 'Female', 'Other'];
const RELATIONSHIPS = ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'];
const QUICK_CONDITIONS = ['Hypertension', 'Type 2 Diabetes', 'Asthma', 'High Cholesterol', 'Heart Disease', 'Arthritis'];

function bmiStatus(bmi: number) {
    if (bmi < 18.5) return { label: 'Underweight', cls: 'bg-orange-100 text-orange-700' };
    if (bmi < 25)   return { label: 'Normal',      cls: 'bg-green-100 text-green-700' };
    if (bmi < 30)   return { label: 'Overweight',  cls: 'bg-yellow-100 text-yellow-700' };
    return               { label: 'Obese',          cls: 'bg-red-100 text-red-700' };
}

interface Props {
    userId: string;
    initialProfile: any;
    onComplete: () => void;
}

export function OnboardingModal({ userId, initialProfile, onComplete }: Props) {
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        document.body.classList.add('modal-open');
        return () => document.body.classList.remove('modal-open');
    }, []);

    // Step 1
    const [s1, setS1] = useState({
        firstName: initialProfile?.firstName ?? '',
        lastName: initialProfile?.lastName ?? '',
        birthday: initialProfile?.birthday ? new Date(initialProfile.birthday).toISOString().split('T')[0] : '',
        contactNumber: initialProfile?.contactNumber ?? '',
        gender: initialProfile?.gender ?? '',
        address: initialProfile?.address ?? '',
    });

    // Step 2
    const [bloodType, setBloodType] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [allergies, setAllergies] = useState<string[]>([]);
    const [allergyInput, setAllergyInput] = useState('');

    // Step 3
    const [s3, setS3] = useState({
        emergencyContactName: '',
        emergencyContactRelation: '',
        emergencyContactPhone: '',
    });

    // Step 4
    const [conditions, setConditions] = useState<string[]>([]);
    const [conditionInput, setConditionInput] = useState('');

    const bmi = useMemo(() => {
        const h = parseFloat(height), w = parseFloat(weight);
        if (h > 0 && w > 0) return (w / Math.pow(h / 100, 2));
        return null;
    }, [height, weight]);

    const addAllergy = (val: string) => {
        const v = val.trim();
        if (v && !allergies.includes(v)) setAllergies(prev => [...prev, v]);
        setAllergyInput('');
    };

    const addCondition = (val: string) => {
        const v = val.trim();
        if (v && !conditions.includes(v)) setConditions(prev => [...prev, v]);
        setConditionInput('');
    };

    const saveStep = async (s: number) => {
        if (s === 1) {
            await axios.patch('/profile', s1);
        } else if (s === 2) {
            const patches: Promise<any>[] = [];
            if (bloodType) patches.push(axios.patch('/profile', { bloodType }));
            const h = parseFloat(height), w = parseFloat(weight);
            if (h > 0 && w > 0) patches.push(axios.patch('/patients/my/stats', { height: h, weight: w }));
            if (allergies.length) patches.push(
                ...allergies.map(a => axios.post('/patients/history', { condition: a, isAllergy: true, isActive: true }))
            );
            await Promise.all(patches);
        } else if (s === 3) {
            if (s3.emergencyContactName) await axios.patch('/profile', s3);
        } else if (s === 4) {
            if (conditions.length) {
                await Promise.all(conditions.map(c => axios.post('/patients/history', { condition: c, isAllergy: false, isActive: true })));
            }
        }
    };

    const handleNext = async () => {
        setSaving(true);
        try { await saveStep(step); } catch {}
        finally { setSaving(false); }
        setStep(s => s + 1);
    };

    const handleFinish = async () => {
        setSaving(true);
        try { await saveStep(4); } catch {}
        finally { setSaving(false); }
        localStorage.setItem(`telehealth_onboarding_${userId}`, '1');
        onComplete();
    };

    const handleSkip = () => {
        localStorage.setItem(`telehealth_onboarding_${userId}`, '1');
        onComplete();
    };

    const progress = ((step - 1) / STEPS.length) * 100;

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex overflow-hidden" style={{ maxHeight: '88vh' }}>

                {/* Sidebar */}
                <aside className="w-52 bg-gray-50 border-r border-gray-200 flex flex-col py-6 shrink-0">
                    <div className="px-5 mb-5">
                        <div className="flex items-center gap-2 mb-1">
                            <Shield size={14} className="text-blue-700" />
                            <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Onboarding</h2>
                        </div>
                    </div>
                    <nav className="flex-1">
                        {STEPS.map(s => {
                            const Icon = s.icon;
                            const isActive = step === s.id;
                            const isDone = step > s.id;
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
                                <div className="bg-blue-700 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-[10px] font-semibold text-blue-700">Step {step} of {STEPS.length}</p>
                        </div>
                    </div>
                </aside>

                {/* Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Modal header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                        <div>
                            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Step {step} of {STEPS.length}</span>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">{STEPS[step - 1].label}</h2>
                        </div>
                        <button onClick={handleSkip} className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                            Skip
                        </button>
                    </div>

                    <main className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: 'thin' }}>
                        <p className="text-sm text-gray-500 mb-5">
                            {step === 1 && 'Provide your basic contact and identity information.'}
                            {step === 2 && 'Enter your clinical metrics to help us tailor your care.'}
                            {step === 3 && 'Add a primary emergency contact for urgent situations.'}
                            {step === 4 && 'Share your medical history so we can personalize your care plan.'}
                        </p>

                        {/* ── Step 1: Personal Details ── */}
                        {step === 1 && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">First Name</label>
                                        <Input value={s1.firstName} onChange={e => setS1(d => ({ ...d, firstName: e.target.value }))} placeholder="John" className="h-11" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Last Name</label>
                                        <Input value={s1.lastName} onChange={e => setS1(d => ({ ...d, lastName: e.target.value }))} placeholder="Doe" className="h-11" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Date of Birth</label>
                                        <Input type="date" value={s1.birthday} onChange={e => setS1(d => ({ ...d, birthday: e.target.value }))} className="h-11" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Gender</label>
                                        <div className="flex h-11 p-1 bg-gray-100 border border-gray-200 rounded-xl gap-1">
                                            {GENDERS.map(g => (
                                                <button key={g} type="button" onClick={() => setS1(d => ({ ...d, gender: g }))}
                                                    className={`flex-1 rounded-lg text-sm font-medium transition-all cursor-pointer ${s1.gender === g ? 'bg-white shadow text-blue-700 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Phone Number</label>
                                    <Input value={s1.contactNumber} onChange={e => setS1(d => ({ ...d, contactNumber: e.target.value }))} placeholder="+1 (555) 000-0000" className="h-11" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Home Address</label>
                                    <textarea
                                        value={s1.address}
                                        onChange={e => setS1(d => ({ ...d, address: e.target.value }))}
                                        placeholder="Street, City, State, ZIP"
                                        rows={3}
                                        className="w-full resize-none border border-gray-200 rounded-xl p-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Medical Vitals ── */}
                        {step === 2 && (
                            <div className="space-y-5">
                                {/* Blood type */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Droplets size={18} className="text-red-500" />
                                        <h3 className="text-base font-bold text-gray-900">Blood Type</h3>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3">
                                        {BLOOD_TYPES.map(bt => (
                                            <button key={bt} type="button" onClick={() => setBloodType(bloodType === bt ? '' : bt)}
                                                className={`border-2 rounded-xl py-3 flex flex-col items-center transition-all cursor-pointer ${bloodType === bt ? 'border-blue-700 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300 text-gray-700'}`}>
                                                <span className="text-xl font-bold">{bt}</span>
                                                <span className="text-[10px] text-gray-400 mt-0.5">{bt.includes('+') ? 'Positive' : 'Negative'}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Height / Weight / BMI */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Height (cm)</label>
                                        <Input type="number" min="1" value={height} onChange={e => setHeight(e.target.value)} placeholder="180" className="h-11 text-lg font-bold border-0 border-b-2 border-gray-300 focus:border-blue-700 rounded-none px-0 focus-visible:ring-0" />
                                    </div>
                                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Weight (kg)</label>
                                        <Input type="number" min="1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="75" className="h-11 text-lg font-bold border-0 border-b-2 border-gray-300 focus:border-blue-700 rounded-none px-0 focus-visible:ring-0" />
                                    </div>
                                    <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5 shadow-sm flex flex-col justify-center">
                                        <label className="text-xs font-bold text-blue-500 uppercase tracking-wider block mb-1">BMI</label>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-bold text-blue-700">{bmi ? bmi.toFixed(1) : '—'}</span>
                                            {bmi && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 uppercase ${bmiStatus(bmi).cls}`}>
                                                    {bmiStatus(bmi).label}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Allergies */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <AlertTriangle size={16} className="text-red-500" />
                                        <h3 className="text-base font-bold text-gray-900">Known Allergies</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {allergies.map(a => (
                                            <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
                                                {a}
                                                <button onClick={() => setAllergies(prev => prev.filter(x => x !== a))} className="hover:text-red-900 cursor-pointer"><X size={11} /></button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input value={allergyInput} onChange={e => setAllergyInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(allergyInput); } }}
                                            placeholder="Type and press Enter to add…" className="h-9 text-sm" />
                                        <button onClick={() => addAllergy(allergyInput)} disabled={!allergyInput.trim()}
                                            className="px-3 h-9 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50 cursor-pointer transition-colors">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Leave blank if you have no known allergies.</p>
                                </div>
                            </div>
                        )}

                        {/* ── Step 3: Emergency Contact ── */}
                        {step === 3 && (
                            <div className="space-y-5">
                                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
                                    <Shield size={18} className="text-blue-700 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-blue-800">Privacy & Security</p>
                                        <p className="text-xs text-blue-600 mt-0.5">Emergency contact details are encrypted and only accessible by authorized medical personnel in acute situations.</p>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Contact Name</label>
                                            <Input value={s3.emergencyContactName} onChange={e => setS3(d => ({ ...d, emergencyContactName: e.target.value }))} placeholder="Full name" className="h-11" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Relationship</label>
                                            <select value={s3.emergencyContactRelation} onChange={e => setS3(d => ({ ...d, emergencyContactRelation: e.target.value }))}
                                                className="w-full h-11 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800">
                                                <option value="">Select relationship</option>
                                                {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Phone Number</label>
                                        <Input value={s3.emergencyContactPhone} onChange={e => setS3(d => ({ ...d, emergencyContactPhone: e.target.value }))} placeholder="+1 (555) 000-0000" className="h-11" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Step 4: Medical History ── */}
                        {step === 4 && (
                            <div className="space-y-5">
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <ClipboardList size={16} className="text-blue-700" />
                                        <h3 className="text-base font-bold text-gray-900">Known Conditions</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {conditions.map(c => (
                                            <span key={c} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
                                                {c}
                                                <button onClick={() => setConditions(prev => prev.filter(x => x !== c))} className="hover:text-blue-900 cursor-pointer"><X size={11} /></button>
                                            </span>
                                        ))}
                                        {conditions.length === 0 && <span className="text-sm text-gray-400">No conditions added yet.</span>}
                                    </div>

                                    {/* Quick add */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="text-xs text-gray-400 self-center font-semibold">Quick add:</span>
                                        {QUICK_CONDITIONS.map(qc => (
                                            <button key={qc} onClick={() => addCondition(qc)} disabled={conditions.includes(qc)}
                                                className="px-3 py-1 border border-gray-200 rounded-full text-xs hover:border-blue-400 hover:text-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                                                {qc}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        <Input value={conditionInput} onChange={e => setConditionInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCondition(conditionInput); } }}
                                            placeholder="Add a condition and press Enter…" className="h-9 text-sm" />
                                        <button onClick={() => addCondition(conditionInput)} disabled={!conditionInput.trim()}
                                            className="px-3 h-9 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 cursor-pointer transition-colors">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-2xl flex gap-3">
                                    <Check size={18} className="text-green-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-green-800">Almost done!</p>
                                        <p className="text-xs text-green-700 mt-0.5">You can always update your medical history later from your profile page.</p>
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
                                <button onClick={() => setStep(s => s - 1)} disabled={saving}
                                    className="flex items-center gap-1 px-4 h-9 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50">
                                    <ChevronLeft size={14} /> Back
                                </button>
                            )}
                            {step < 4 ? (
                                <button onClick={handleNext} disabled={saving}
                                    className="flex items-center gap-1 px-5 h-9 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer disabled:opacity-50 shadow-sm">
                                    {saving ? 'Saving…' : <>Next <ChevronRight size={14} /></>}
                                </button>
                            ) : (
                                <button onClick={handleFinish} disabled={saving}
                                    className="flex items-center gap-1 px-5 h-9 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer disabled:opacity-50 shadow-sm">
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
