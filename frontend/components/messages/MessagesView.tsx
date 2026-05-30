'use client';

import { toast } from 'sonner';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from '@/lib/axios';
import { API_BASE_URL, apiUrl } from '@/lib/api-url';
import { io, Socket } from 'socket.io-client';
import { format, isToday, isYesterday } from 'date-fns';
import { Send, Paperclip, MessageSquare, ExternalLink, XCircle, Lock, Inbox, Archive } from 'lucide-react';

interface UserProfile { firstName: string; lastName: string; profilePictureUrl?: string }
interface OtherUser { id: string; profile: UserProfile }
interface LastMessage { id: string; content?: string; type: string; createdAt: string; senderId: string; fileName?: string }
interface Thread {
    appointmentId: string;
    status: string;
    reason?: string;
    slot: { startTime: string; endTime: string };
    otherUser: OtherUser;
    lastMessage: LastMessage | null;
    unreadCount: number;
    isClosed?: boolean;
}
interface Message {
    id: string;
    appointmentId: string;
    senderId: string;
    content?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    type: 'TEXT' | 'FILE' | 'SYSTEM';
    createdAt: string;
    sender: { id: string; profile: UserProfile };
}

function Avatar({ profile, size = 10 }: { profile?: UserProfile; size?: number }) {
    const initials = profile
        ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase()
        : '?';
    if (profile?.profilePictureUrl) {
        return <img src={profile.profilePictureUrl} alt="" className={`w-${size} h-${size} rounded-full object-cover shrink-0`} />;
    }
    return (
        <div className={`w-${size} h-${size} rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0`}>
            {initials}
        </div>
    );
}

function msgDateLabel(dateStr: string) {
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, 'h:mm a');
    if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`;
    return format(d, 'MMM d, h:mm a');
}

function lastMsgPreview(msg: LastMessage | null): string {
    if (!msg) return 'No messages yet';
    if (msg.type === 'SYSTEM') return '🔔 ' + (msg.content ?? '');
    if (msg.type === 'FILE') return `📎 ${msg.fileName ?? 'File'}`;
    return msg.content ?? '';
}

export function MessagesView({
    currentUserId,
    initialAppointmentId,
    isDoctor = false,
}: {
    currentUserId: string;
    initialAppointmentId?: string;
    isDoctor?: boolean;
}) {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(initialAppointmentId ?? null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [threadsLoading, setThreadsLoading] = useState(true);
    const [msgsLoading, setMsgsLoading] = useState(false);
    const [view, setView] = useState<'active' | 'archived'>('active');
    const [closing, setClosing] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    const selectedThread = threads.find(t => t.appointmentId === selectedId) ?? null;

    const fetchThreads = useCallback(async (archived = false) => {
        setThreadsLoading(true);
        try {
            const res = await axios.get('/messages/threads', { params: archived ? { archived: 'true' } : {} });
            setThreads(res.data);
        } catch {}
        setThreadsLoading(false);
    }, []);

    useEffect(() => { fetchThreads(view === 'archived'); }, [fetchThreads, view]);

    // Socket connection
    useEffect(() => {
        if (!currentUserId) return;
        const socket = io(API_BASE_URL);
        socketRef.current = socket;
        socket.on('connect', () => socket.emit('join', currentUserId));
        socket.on('message:new', (msg: Message) => {
            setMessages(prev => {
                if (msg.appointmentId !== selectedId) return prev;
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            setThreads(prev => prev.map(t =>
                t.appointmentId === msg.appointmentId
                    ? { ...t, lastMessage: msg, unreadCount: msg.senderId !== currentUserId && msg.appointmentId !== selectedId ? t.unreadCount + 1 : 0 }
                    : t
            ));
        });
        socket.on('conversation:closed', ({ appointmentId }: { appointmentId: string }) => {
            setThreads(prev => prev.map(t =>
                t.appointmentId === appointmentId ? { ...t, isClosed: true } : t
            ));
        });
        return () => { socket.disconnect(); };
    }, [currentUserId, selectedId]);

    // Load messages when thread selected
    useEffect(() => {
        if (!selectedId) { setMessages([]); return; }
        setMsgsLoading(true);
        axios.get(`/messages/appointment/${selectedId}`)
            .then(res => setMessages(res.data))
            .catch(() => setMessages([]))
            .finally(() => setMsgsLoading(false));
        axios.patch(`/messages/appointment/${selectedId}/read`).catch(() => {});
        setThreads(prev => prev.map(t => t.appointmentId === selectedId ? { ...t, unreadCount: 0 } : t));
    }, [selectedId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!text.trim() || !selectedId || sending) return;
        setSending(true);
        try {
            await axios.post('/messages', { appointmentId: selectedId, content: text.trim() });
            setText('');
        } catch {}
        finally { setSending(false); }
    };

    const handleFileUpload = async (file: File) => {
        if (!selectedId || uploading) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('appointmentId', selectedId);
            await axios.post('/messages/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Upload failed');
        } finally { setUploading(false); }
    };

    const handleCloseConversation = async () => {
        if (!selectedId || closing) return;
        if (!confirm('Close this conversation? The patient will no longer be able to send messages. The conversation will be archived.')) return;
        setClosing(true);
        try {
            await axios.patch(`/messages/appointment/${selectedId}/close`);
            setSelectedId(null);
            fetchThreads(false);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to close conversation');
        } finally { setClosing(false); }
    };

    return (
        <div className="flex h-full">

            {/* ── Thread List ── */}
            <div className="w-80 shrink-0 border-r border-gray-200 bg-white flex flex-col">
                <div className="px-4 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">Messages</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Follow-up conversations</p>
                </div>

                {isDoctor && (
                    <div className="flex border-b border-gray-100 shrink-0">
                        <button
                            onClick={() => { setView('active'); setSelectedId(null); }}
                            className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${view === 'active' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Inbox size={12} /> Active
                        </button>
                        <button
                            onClick={() => { setView('archived'); setSelectedId(null); }}
                            className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${view === 'archived' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Archive size={12} /> Archived
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {threadsLoading ? (
                        <div className="flex justify-center pt-10">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        </div>
                    ) : threads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <MessageSquare size={32} className="text-gray-200 mb-3" />
                            <p className="text-sm text-gray-400">
                                {view === 'archived' ? 'No archived conversations.' : 'No conversations yet.'}
                            </p>
                            <p className="text-xs text-gray-300 mt-1">
                                {view === 'archived' ? 'Closed conversations appear here.' : 'Completed appointments will appear here.'}
                            </p>
                        </div>
                    ) : (
                        threads.map(t => {
                            const name = t.otherUser?.profile
                                ? `${t.otherUser.profile.firstName} ${t.otherUser.profile.lastName}`
                                : 'Unknown';
                            const isSelected = selectedId === t.appointmentId;
                            return (
                                <button
                                    key={t.appointmentId}
                                    onClick={() => setSelectedId(t.appointmentId)}
                                    className={`w-full text-left px-4 py-3.5 flex items-start gap-3 border-b border-gray-50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-700' : 'hover:bg-gray-50'}`}
                                >
                                    <Avatar profile={t.otherUser?.profile} size={10} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <p className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>{name}</p>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {t.isClosed && (
                                                    <span className="text-[9px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                        <Lock size={8} /> Closed
                                                    </span>
                                                )}
                                                {t.lastMessage && !t.isClosed && (
                                                    <span className="text-[10px] text-gray-400">
                                                        {msgDateLabel(t.lastMessage.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-gray-400 truncate">
                                            {format(new Date(t.slot.startTime), 'MMM d')} · {t.reason || 'Consultation'}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                            {lastMsgPreview(t.lastMessage)}
                                        </p>
                                    </div>
                                    {t.unreadCount > 0 && !t.isClosed && (
                                        <span className="shrink-0 w-5 h-5 bg-blue-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">
                                            {t.unreadCount > 9 ? '9+' : t.unreadCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Chat Area ── */}
            <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
                {!selectedThread ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                        <MessageSquare size={44} className="text-gray-200" />
                        <p className="text-gray-400 text-sm">Select a conversation to start messaging.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div className="px-6 py-3.5 bg-white border-b border-gray-200 flex items-center gap-3 shrink-0">
                            <Avatar profile={selectedThread.otherUser?.profile} size={9} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900">
                                    {selectedThread.otherUser?.profile
                                        ? `${selectedThread.otherUser.profile.firstName} ${selectedThread.otherUser.profile.lastName}`
                                        : 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {format(new Date(selectedThread.slot.startTime), 'MMM d, yyyy')}
                                    {' · '}
                                    {selectedThread.reason || 'Consultation'}
                                    {' · '}
                                    <span className={`font-medium ${selectedThread.status === 'COMPLETED' ? 'text-green-600' : 'text-blue-600'}`}>
                                        {selectedThread.status.toLowerCase()}
                                    </span>
                                </p>
                            </div>
                            {isDoctor && !selectedThread.isClosed && (
                                <button
                                    onClick={handleCloseConversation}
                                    disabled={closing}
                                    title="Close conversation"
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                                >
                                    <XCircle size={14} />
                                    Close Conversation
                                </button>
                            )}
                            {selectedThread.isClosed && (
                                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
                                    <Lock size={11} /> Closed
                                </span>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                            {msgsLoading ? (
                                <div className="flex justify-center pt-10">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-sm">
                                    No messages yet. Start the conversation.
                                </div>
                            ) : (
                                messages.map(msg => {
                                    const isMe = msg.senderId === currentUserId;
                                    if (msg.type === 'SYSTEM') {
                                        return (
                                            <div key={msg.id} className="flex justify-center">
                                                <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full text-center max-w-xs">
                                                    {msg.content}
                                                </span>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {!isMe && <Avatar profile={msg.sender?.profile} size={8} />}
                                            <div className={`max-w-[65%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                                {msg.type === 'FILE' ? (
                                                    <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${isMe ? 'bg-blue-700 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                                                        {msg.fileType === 'image' ? (
                                                            <div>
                                                                <img
                                                                    src={apiUrl(msg.fileUrl ?? '')}
                                                                    alt={msg.fileName}
                                                                    className="rounded-xl max-w-[200px] max-h-48 object-contain cursor-pointer"
                                                                    onClick={() => window.open(apiUrl(msg.fileUrl ?? ''), '_blank')}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <a
                                                                href={apiUrl(msg.fileUrl ?? '')}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 hover:opacity-80"
                                                            >
                                                                <Paperclip size={14} />
                                                                <span className="text-xs underline truncate max-w-[150px]">{msg.fileName}</span>
                                                                <ExternalLink size={11} />
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed ${isMe ? 'bg-blue-700 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                                                        {msg.content}
                                                    </div>
                                                )}
                                                <span className="text-[10px] text-gray-400 px-1">{msgDateLabel(msg.createdAt)}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input bar or closed banner */}
                        {selectedThread.isClosed ? (
                            <div className="px-4 py-4 bg-white border-t border-gray-200 shrink-0 flex items-center justify-center gap-2">
                                <Lock size={14} className="text-gray-400" />
                                <p className="text-sm text-gray-500">This conversation has been closed.</p>
                            </div>
                        ) : (
                            <div className="px-4 py-3 bg-white border-t border-gray-200 shrink-0">
                                <div className="flex items-end gap-2">
                                    <label className="p-2.5 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer">
                                        {uploading ? (
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                        ) : (
                                            <Paperclip size={18} />
                                        )}
                                        <input
                                            type="file"
                                            accept=".pdf,image/jpeg,image/png,image/webp,image/jpg"
                                            className="hidden"
                                            disabled={uploading}
                                            onChange={e => {
                                                const f = e.target.files?.[0];
                                                if (f) handleFileUpload(f);
                                                e.target.value = '';
                                            }}
                                        />
                                    </label>
                                    <textarea
                                        rows={1}
                                        value={text}
                                        onChange={e => setText(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                                        }}
                                        placeholder="Write a message…"
                                        className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow max-h-32"
                                        style={{ scrollbarWidth: 'thin' }}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!text.trim() || sending}
                                        className="p-2.5 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1.5 pl-1">Enter to send · Shift+Enter for newline</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
