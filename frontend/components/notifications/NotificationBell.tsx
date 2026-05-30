'use client';

import { useState } from 'react';
import { useNotifications } from './NotificationsProvider';
import { Bell, Check, Trash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button 
                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllAsRead}
                                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No notifications yet.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map(n => (
                                        <div 
                                            key={n.id} 
                                            className={`p-4 transition-colors hover:bg-gray-50 cursor-pointer ${!n.read ? 'bg-blue-50/30' : ''}`}
                                            onClick={() => {
                                                if (!n.read) markAsRead(n.id);
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                    {n.title}
                                                </h4>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className={`text-sm ${!n.read ? 'text-gray-700' : 'text-gray-500'}`}>
                                                {n.message}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
