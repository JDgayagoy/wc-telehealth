'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Sparkles, Search, Star, ChevronRight, Calendar, User, ArrowRight } from 'lucide-react';
import BookingModal from '@/components/booking/BookingModal';
import Link from 'next/link';

const SPECIALIZATIONS = [
    'General Practitioner', 'Cardiologist', 'Dermatologist', 'Neurologist',
    'Psychiatrist', 'Orthopedist', 'Pulmonologist', 'Gastroenterologist',
    'Endocrinologist', 'Pediatrician', 'OB-GYN', 'Urologist', 'Ophthalmologist',
    'ENT Specialist', 'Oncologist',
];

interface Doctor {
    id: string;
    profile: { firstName: string; lastName: string; profilePictureUrl?: string };
    doctorProfile: { specialization: string | string[]; bio: string; yearsOfExperience: number };
    consultationSlots: { id: string; startTime: string; endTime: string }[];
    avgRating: number | null;
    ratingCount: number;
}

function getSpecDisplay(spec: string | string[]): string {
    if (Array.isArray(spec)) return spec.join(', ');
    return spec;
}

export default function DoctorDiscoveryPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [recommendedSpecs, setRecommendedSpecs] = useState<string[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [showAiPanel, setShowAiPanel] = useState(false);

    const fetchDoctors = async (specialization?: string) => {
        setLoading(true);
        try {
            const res = await axios.get('/doctors', {
                params: specialization ? { specialization } : {},
            });
            setDoctors(res.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDoctors(); }, []);

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        setActiveFilter('');
        setRecommendedSpecs([]);
        fetchDoctors(search || undefined);
    };

    const handleFilterChip = (spec: string) => {
        const next = activeFilter === spec ? '' : spec;
        setActiveFilter(next);
        setSearch('');
        setRecommendedSpecs([]);
        fetchDoctors(next || undefined);
    };

    const handleAiRecommend = async () => {
        if (!symptoms.trim()) return;
        setAiLoading(true);
        try {
            const res = await axios.post('/ai/recommend', { symptoms });
            setRecommendedSpecs(res.data.recommendedSpecializations);
            setDoctors(res.data.doctors);
            setActiveFilter('');
            setShowAiPanel(false);
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="px-6 lg:px-16 py-10 max-w-[1440px] mx-auto">

            {/* Header & Search */}
            <header className="flex justify-between items-center mb-10">
                <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search doctors, specialties, or symptoms..."
                        className="w-full h-12 pl-12 pr-4 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-700 transition-colors text-sm"
                    />
                </form>
                <div className="flex items-center gap-6 ml-8">
                    <button className="p-2 text-gray-500 hover:text-blue-700 transition-colors">
                        <Sparkles size={20} onClick={() => setShowAiPanel(v => !v)} />
                    </button>
                    <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                        <User size={18} className="text-gray-400" />
                    </div>
                </div>
            </header>

            {/* Filter Chips */}
            <section className="mb-10">
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <button
                        onClick={() => { setActiveFilter(''); setSearch(''); setRecommendedSpecs([]); fetchDoctors(); }}
                        className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                            activeFilter === '' && recommendedSpecs.length === 0
                                ? 'bg-blue-700 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-700 hover:text-blue-700'
                        }`}
                    >
                        All Doctors
                    </button>
                    {SPECIALIZATIONS.map(spec => (
                        <button
                            key={spec}
                            onClick={() => handleFilterChip(spec)}
                            className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                                activeFilter === spec
                                    ? 'bg-blue-700 text-white'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-700 hover:text-blue-700'
                            }`}
                        >
                            {spec}
                        </button>
                    ))}
                </div>
            </section>

            {/* AI Banner */}
            <section className="mb-10">
                <div className="relative w-full h-56 rounded-xl overflow-hidden shadow-sm group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-700/80 to-transparent z-10" />
                    <div className="absolute inset-0 bg-blue-900 z-0" />
                    <div className="relative z-20 h-full flex flex-col justify-center px-12 max-w-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={16} className="text-blue-200" />
                            <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">AI-Powered Suggestion</span>
                        </div>
                        <h2 className="text-white text-2xl font-bold leading-tight mb-2">
                            Find your perfect specialist match in seconds.
                        </h2>
                        <p className="text-blue-100/80 text-sm mb-5 leading-relaxed">
                            Describe your symptoms and our AI will identify the best specialists for your needs.
                        </p>
                        <button
                            onClick={() => setShowAiPanel(v => !v)}
                            className="w-fit px-6 py-2.5 bg-white text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors flex items-center gap-2"
                        >
                            {showAiPanel ? 'Hide' : 'View Matches'} <ArrowRight size={14} />
                        </button>
                    </div>
                </div>

                {/* AI Symptom Panel */}
                {showAiPanel && (
                    <div className="mt-4 bg-white border border-blue-100 rounded-xl p-6 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Sparkles size={16} className="text-blue-700" /> Describe your symptoms
                        </h4>
                        <textarea
                            rows={3}
                            value={symptoms}
                            onChange={e => setSymptoms(e.target.value)}
                            placeholder="e.g. I've been having chest pain and shortness of breath..."
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-700 transition-colors resize-none"
                        />
                        <div className="flex items-center justify-between mt-3">
                            <div className="flex flex-wrap gap-2">
                                {recommendedSpecs.map(s => (
                                    <span key={s} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{s}</span>
                                ))}
                            </div>
                            <button
                                onClick={handleAiRecommend}
                                disabled={aiLoading || !symptoms.trim()}
                                className="px-5 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Sparkles size={14} />
                                {aiLoading ? 'Analyzing...' : 'Get Recommendations'}
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* Doctors Grid */}
            <section>
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {recommendedSpecs.length > 0 ? 'AI-Recommended Specialists' : 'Top Rated Specialists'}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">
                            {recommendedSpecs.length > 0
                                ? `Matched for: ${recommendedSpecs.join(', ')}`
                                : 'Highly recommended by patients like you'}
                        </p>
                    </div>
                    <span className="text-sm text-gray-400">{doctors.length} found</span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
                    </div>
                ) : doctors.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <User size={40} className="mx-auto mb-3 text-gray-200" />
                        <p className="font-medium">No doctors found.</p>
                        <p className="text-sm mt-1">Try a different specialization or clear filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {doctors.map(doc => (
                            <div
                                key={doc.id}
                                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow group"
                            >
                                {/* Doctor Header */}
                                <div className="flex gap-5 mb-5">
                                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                                        {doc.profile?.profilePictureUrl ? (
                                            <img src={doc.profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={32} className="text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors leading-tight">
                                                Dr. {doc.profile?.firstName} {doc.profile?.lastName}
                                            </h4>
                                            {doc.avgRating !== null ? (
                                                <span className="flex items-center gap-0.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ml-2">
                                                    <Star size={11} className="fill-amber-500 text-amber-500" /> {doc.avgRating.toFixed(1)}
                                                    <span className="text-amber-400 font-normal ml-0.5">({doc.ratingCount})</span>
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-0.5 text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full text-xs shrink-0 ml-2">
                                                    <Star size={11} /> New
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                                            {getSpecDisplay(doc.doctorProfile?.specialization)}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {doc.doctorProfile?.yearsOfExperience} yrs experience
                                        </p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                                        <p className="text-xs text-gray-400 font-medium">Experience</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5">{doc.doctorProfile?.yearsOfExperience}+ Yrs</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                                        <p className="text-xs text-gray-400 font-medium">Available Slots</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5">{doc.consultationSlots?.length ?? 0}</p>
                                    </div>
                                </div>

                                {/* Bio */}
                                {doc.doctorProfile?.bio && (
                                    <p className="text-xs text-gray-500 mb-5 line-clamp-2 leading-relaxed">{doc.doctorProfile.bio}</p>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Link href={`/dashboard/patient/doctors/${doc.id}/book`} className="flex-1">
                                        <button className="w-full bg-gray-100 text-gray-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
                                            Profile
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => setSelectedDoctor(doc)}
                                        disabled={!doc.consultationSlots?.length}
                                        className="flex-1 bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <Calendar size={14} /> Book
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Available Now Banner */}
            <section className="mt-10 p-6 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-100 rounded-lg">
                        <Calendar size={20} className="text-blue-700" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">Need urgent care?</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Check doctors with slots available soon.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-medium">Show available only</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            onChange={e => {
                                if (e.target.checked) {
                                    setDoctors(prev => prev.filter(d => d.consultationSlots?.length > 0));
                                } else {
                                    fetchDoctors(activeFilter || undefined);
                                }
                            }}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-700" />
                    </label>
                </div>
            </section>

            <BookingModal
                doctor={selectedDoctor}
                onClose={() => setSelectedDoctor(null)}
                onBooked={() => {
                    setSelectedDoctor(null);
                    fetchDoctors(activeFilter || undefined);
                }}
            />
        </div>
    );
}
