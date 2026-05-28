'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle } from 'lucide-react';

interface Slot { id: string; startTime: string; endTime: string }

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
      alert(e.response?.data?.message ?? 'Booking failed');
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

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>← Back</Button>

      {doctor && (
        <div>
          <h1 className="text-2xl font-bold">
            Book with Dr. {doctor.profile?.firstName} {doctor.profile?.lastName}
          </h1>
          <Badge className="mt-1">{doctor.doctorProfile?.specialization}</Badge>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Select a Time Slot</CardTitle></CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <p className="text-muted-foreground">No available slots.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedSlot === slot.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <p className="font-medium text-sm">
                    {format(new Date(slot.startTime), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(slot.startTime), 'h:mm a')} – {format(new Date(slot.endTime), 'h:mm a')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Reason for Visit (optional)</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            placeholder="Briefly describe your concern or symptoms..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      <Button
        className="w-full"
        onClick={handleBook}
        disabled={!selectedSlot || booking}
      >
        {booking ? 'Booking...' : 'Confirm Appointment'}
      </Button>
    </div>
  );
}
