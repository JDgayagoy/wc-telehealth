'use client';

import { X, Star, Calendar, MessageSquare, Shield, Briefcase, GraduationCap } from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';

interface Doctor {
    id: string;
    profile: { firstName: string; lastName: string; profilePictureUrl?: string };
    doctorProfile: {
        specialization: string | string[];
        bio?: string;
        yearsOfExperience: number;
        licenseNumber?: string;
        education?: string;
    };
    consultationSlots: { id: string; startTime: string; endTime: string }[];
    avgRating: number | null;
    ratingCount: number;
}

interface Props {
    doctor: Doctor | null;
    onClose: () => void;
    onBook: () => void;
    onMessage?: () => void;
}

function getSpecDisplay(spec: string | string[]): string {
    if (Array.isArray(spec)) return spec.join(', ');
    return spec ?? 'General Practitioner';
}

function getSpecTags(spec: string | string[]): string[] {
    if (Array.isArray(spec)) return spec;
    if (!spec) return [];
    return spec.split(',').map(s => s.trim()).filter(Boolean);
}

export function DoctorProfileModal({ doctor, onClose, onBook, onMessage }: Props) {
    if (!doctor) return null;

    const specDisplay = getSpecDisplay(doctor.doctorProfile?.specialization);
    const specTags = getSpecTags(doctor.doctorProfile?.specialization);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white w-full max-w-[800px] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col relative animate-in fade-in zoom-in-95 duration-200">

                {/* Close */}
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Hero Header */}
                <div className="relative bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 h-44 flex items-end px-8 pb-0">
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
                    />
                    <div className="flex gap-6 items-end translate-y-14 relative z-10">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-28 h-28 rounded-xl border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                <ProfileAvatar src={doctor.profile?.profilePictureUrl} iconSize={44} />
                            </div>
                            <div className="absolute -bottom-1.5 -right-1.5 bg-blue-700 text-white p-1 rounded-full border-2 border-white">
                                <Shield size={13} />
                            </div>
                        </div>
                        {/* Name */}
                        <div className="mb-2">
                            <h1 className="text-2xl font-bold text-white leading-tight">
                                Dr. {doctor.profile?.firstName} {doctor.profile?.lastName}
                            </h1>
                            <p className="text-blue-200 text-sm font-medium mt-0.5">{specDisplay}</p>
                            {doctor.avgRating != null && (
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <Star size={13} className="fill-amber-400 text-amber-400" />
                                    <span className="text-white text-sm font-semibold">{doctor.avgRating.toFixed(1)}</span>
                                    <span className="text-blue-300 text-xs">({doctor.ratingCount} {doctor.ratingCount === 1 ? 'review' : 'reviews'})</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="pt-20 px-8 pb-8 overflow-y-auto max-h-[520px]">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                        {/* Left: Bio + Experience */}
                        <div className="md:col-span-7 space-y-6">
                            {doctor.doctorProfile?.bio && (
                                <section>
                                    <h2 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-2">Professional Summary</h2>
                                    <p className="text-sm text-gray-600 leading-relaxed">{doctor.doctorProfile.bio}</p>
                                </section>
                            )}

                            <section>
                                <h2 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-3">Experience</h2>
                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <Briefcase size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{doctor.doctorProfile?.yearsOfExperience}+ Years of Practice</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{specDisplay}</p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-3">Availability</h2>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <Calendar size={16} className="text-blue-700 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {doctor.consultationSlots?.length ?? 0} slot{(doctor.consultationSlots?.length ?? 0) !== 1 ? 's' : ''} available
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">Book a time that works for you</p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Right: Specializations + License */}
                        <div className="md:col-span-5 space-y-6">
                            {specTags.length > 0 && (
                                <section>
                                    <h2 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-3">Specializations</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {specTags.map(tag => (
                                            <span
                                                key={tag}
                                                className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {doctor.doctorProfile?.education && (
                                <section>
                                    <h2 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-3">Education</h2>
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <GraduationCap size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                        <p className="text-sm text-gray-700">{doctor.doctorProfile.education}</p>
                                    </div>
                                </section>
                            )}

                            {doctor.doctorProfile?.licenseNumber && (
                                <section>
                                    <h2 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-3">License</h2>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <Shield size={15} className="text-blue-700 shrink-0" />
                                        <p className="text-xs text-gray-600 font-mono">{doctor.doctorProfile.licenseNumber}</p>
                                    </div>
                                </section>
                            )}

                            {doctor.avgRating == null && (
                                <section>
                                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                        <p className="text-xs text-amber-700 font-semibold">New Doctor</p>
                                        <p className="text-xs text-amber-600 mt-0.5">No reviews yet. Be the first patient!</p>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-100 pt-6 mt-6 flex flex-col sm:flex-row gap-3 justify-end">
                        {onMessage && (
                            <button
                                onClick={onMessage}
                                className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <MessageSquare size={15} /> Message
                            </button>
                        )}
                        <button
                            onClick={onBook}
                            disabled={!doctor.consultationSlots?.length}
                            className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-700 text-white text-sm font-semibold rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                            <Calendar size={15} /> Book Appointment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
