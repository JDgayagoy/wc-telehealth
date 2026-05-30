'use client';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle, Star, User, Calendar } from 'lucide-react';

interface Slot { id: string; startTime: string; endTime: string }

function StarRow({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star
                    key={s}
                    size={14}
                    className={s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                />
            ))}
        </div>
    );
}

export default function BookingPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();

    const [doctor, setDoctor] = useState<any>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [booking, setBooking] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            const [docRes, slotRes] = await Promise.all([
                axios.get(`/doctors/${id}`),
                axios.get(`/doctors/${id}/slots`),
            ]);
            setDoctor(docRes.data);
            setSlots(slotRes.data);
        };
        load();
    }, [id]);

    const handleBook = async () => {
        if (!selectedSlot) return;
        setBooking(true);
        try {
            await axios.post('/appointments', { slotId: selectedSlot, reason });
            setSuccess(true);
        } catch (e: any) {
            toast.error(e.response?.data?.message ?? 'Booking failed');
        } finally {
            setBooking(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-md mx-auto p-6 text-center space-y-4 mt-20">
                <CheckCircle size={56} className="mx-auto text-green-500" />
                <h2 className="text-xl font-bold">Appointment Confirmed!</h2>
                <p className="text-muted-foreground">
                    Your consultation has been booked. You'll receive a notification closer to your appointment.
                </p>
                <Button onClick={() => router.push('/dashboard/patient/appointments')}>
                    View My Appointments
                </Button>
            </div>
        );
    }

    const spec = doctor?.doctorProfile?.specialization;
    const specDisplay = Array.isArray(spec) ? spec.join(', ') : spec;
    const avgRating: number | null = doctor?.avgRating ?? null;
    const ratingCount: number = doctor?.ratingCount ?? 0;
    const reviews: { rating: number; review?: string; createdAt: string }[] = doctor?.recentReviews ?? [];

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <Button variant="ghost" onClick={() => router.back()}>← Back</Button>

            {doctor && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <div className="flex gap-4 items-start">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {doctor.profile?.profilePictureUrl ? (
                                <img src={doctor.profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User size={28} className="text-gray-300" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-gray-900">
                                Dr. {doctor.profile?.firstName} {doctor.profile?.lastName}
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">{specDisplay}</p>
                            <div className="flex items-center gap-3 mt-2">
                                {avgRating !== null ? (
                                    <div className="flex items-center gap-1.5">
                                        <StarRow rating={Math.round(avgRating)} />
                                        <span className="text-sm font-semibold text-amber-600">{avgRating.toFixed(1)}</span>
                                        <span className="text-xs text-gray-400">({ratingCount} {ratingCount === 1 ? 'review' : 'reviews'})</span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">No ratings yet</span>
                                )}
                                <Badge variant="secondary">{doctor.doctorProfile?.yearsOfExperience} yrs exp</Badge>
                            </div>
                        </div>
                    </div>

                    {doctor.doctorProfile?.bio && (
                        <p className="text-sm text-gray-600 mt-4 leading-relaxed">{doctor.doctorProfile.bio}</p>
                    )}
                </div>
            )}

            {/* Slot selection */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar size={16} className="text-blue-700" /> Select a Time Slot
                </h2>
                {slots.length === 0 ? (
                    <p className="text-gray-400 text-sm">No available slots.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {slots.map((slot) => (
                            <button
                                key={slot.id}
                                onClick={() => setSelectedSlot(slot.id)}
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                    selectedSlot === slot.id
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-blue-300'
                                }`}
                            >
                                <p className="font-medium text-sm">
                                    {format(new Date(slot.startTime), 'MMM d, yyyy')}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {format(new Date(slot.startTime), 'h:mm a')} – {format(new Date(slot.endTime), 'h:mm a')}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Reason */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="font-semibold text-gray-900 mb-3">Reason for Visit <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
                <Textarea
                    placeholder="Briefly describe your concern or symptoms..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="rounded-xl resize-none"
                />
            </div>

            {/* Recent Reviews */}
            {reviews.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Patient Reviews</h2>
                    <div className="space-y-4">
                        {reviews.map((r, i) => (
                            <div key={i} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                                <div className="flex items-center justify-between mb-1.5">
                                    <StarRow rating={r.rating} />
                                    <span className="text-xs text-gray-400">{format(new Date(r.createdAt), 'MMM d, yyyy')}</span>
                                </div>
                                {r.review && (
                                    <p className="text-sm text-gray-600 leading-relaxed">{r.review}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Button
                className="w-full rounded-xl"
                onClick={handleBook}
                disabled={!selectedSlot || booking}
            >
                {booking ? 'Booking...' : 'Confirm Appointment'}
            </Button>
        </div>
    );
}
