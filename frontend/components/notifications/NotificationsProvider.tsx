'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import axios from '@/lib/axios';
import { getRoleFromToken } from '@/lib/auth';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    metadata?: string;
}

interface NotificationsContextType {
    notifications: Notification[];
    unreadCount: number;
    unreadMessages: number;
    appointmentBadge: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [appointmentBadge, setAppointmentBadge] = useState(0);
    const pathname = usePathname();

    const fetchUnreadMessages = useCallback(async () => {
        try {
            const res = await axios.get('/messages/threads');
            const total = (res.data as any[]).reduce((sum, t) => sum + (t.unreadCount ?? 0), 0);
            setUnreadMessages(total);
        } catch {}
    }, []);

    const fetchUpcomingAppointments = useCallback(async () => {
        try {
            const role = getRoleFromToken();
            const endpoint = role === 'DOCTOR' ? '/appointments/doctor' : '/appointments/mine';
            const res = await axios.get(endpoint);
            const now = new Date();
            const ACTIVE = new Set(['PENDING', 'CONFIRMED', 'RESCHEDULED', 'CANCEL_PENDING', 'RESCHEDULE_PENDING']);
            const count = (res.data as any[]).filter(a =>
                ACTIVE.has(a.status) && new Date(a.slot.startTime) > now
            ).length;
            setAppointmentBadge(count);
        } catch {}
    }, []);

    // Initial fetch
    useEffect(() => {
        axios.get('/profile')
            .then(res => {
                setUserId(res.data.userId);
                return axios.get('/notifications');
            })
            .then(res => setNotifications(res.data))
            .catch(console.error);
    }, []);

    // Re-fetch counts on every page navigation
    useEffect(() => {
        fetchUnreadMessages();
        fetchUpcomingAppointments();
    }, [pathname, fetchUnreadMessages, fetchUpcomingAppointments]);

    // Socket connection
    useEffect(() => {
        if (!userId) return;

        const newSocket = io('http://localhost:3001');

        newSocket.on('connect', () => {
            newSocket.emit('join', userId);
        });

        newSocket.on('notification', (notification: Notification) => {
            setNotifications(prev => [notification, ...prev]);
            if (notification.type.startsWith('appointment:')) {
                fetchUpcomingAppointments();
            }
        });

        newSocket.on('message:new', () => {
            fetchUnreadMessages();
        });

        setSocket(newSocket);

        return () => { newSocket.disconnect(); };
    }, [userId, fetchUnreadMessages, fetchUpcomingAppointments]);

    const markAsRead = async (id: string) => {
        try {
            await axios.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (e) {
            console.error(e);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (e) {
            console.error(e);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationsContext.Provider value={{ notifications, unreadCount, unreadMessages, appointmentBadge, markAsRead, markAllAsRead }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
}
