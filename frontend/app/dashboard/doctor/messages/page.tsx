'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from '@/lib/axios';
import { MessagesView } from '@/components/messages/MessagesView';

export default function DoctorMessagesPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const initialAppointmentId = searchParams.get('appointmentId') ?? undefined;

    useEffect(() => {
        axios.get('/profile').then(r => setUserId(r.data.userId)).catch(() => {});
    }, []);

    if (!userId) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
        </div>
    );

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <MessagesView currentUserId={userId} initialAppointmentId={initialAppointmentId} isDoctor />
        </div>
    );
}
