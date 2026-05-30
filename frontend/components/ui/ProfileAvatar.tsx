'use client';
import { useState } from 'react';
import { User } from 'lucide-react';
import { apiUrl } from '@/lib/api-url';

interface Props {
    src?: string | null;
    size?: number;
    className?: string;
    iconSize?: number;
}

export function ProfileAvatar({ src, size = 32, className = '', iconSize = 32 }: Props) {
    const [failed, setFailed] = useState(false);

    const resolved = src ? apiUrl(src) : null;

    if (resolved && !failed) {
        return (
            <img
                src={resolved}
                alt=""
                className={`w-full h-full object-cover ${className}`}
                onError={() => setFailed(true)}
            />
        );
    }

    return <User size={iconSize} className="text-gray-300" />;
}
