'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { getRoleFromToken } from '@/lib/auth';
import { Activity, LayoutDashboard, Search, Calendar, FileText, User as UserIcon, LogOut, Menu, X, MessageSquare } from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { NotificationsProvider, useNotifications } from '@/components/notifications/NotificationsProvider';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

const navItems = [
  { name: 'Dashboard',       href: '/dashboard/patient',              icon: <LayoutDashboard size={20} /> },
  { name: 'Find a Doctor',   href: '/dashboard/patient/doctors',      icon: <Search size={20} /> },
  { name: 'My Appointments', href: '/dashboard/patient/appointments', icon: <Calendar size={20} /> },
  { name: 'Messages',        href: '/dashboard/patient/messages',     icon: <MessageSquare size={20} /> },
  { name: 'Medical Records', href: '/dashboard/patient/records',      icon: <FileText size={20} /> },
  { name: 'My Profile',      href: '/dashboard/patient/profile',      icon: <UserIcon size={20} /> },
];

function PatientNav({ pathname, onNavClick }: { pathname: string; onNavClick: () => void }) {
  const { unreadMessages, appointmentBadge } = useNotifications();
  const badges: Record<string, number> = {
    '/dashboard/patient/messages':     unreadMessages,
    '/dashboard/patient/appointments': appointmentBadge,
  };

  return (
    <>
      {navItems.map(item => {
        const isActive = pathname === item.href;
        const badge = badges[item.href] ?? 0;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavClick}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors
              ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
            `}
          >
            <div className={isActive ? 'text-blue-600' : 'text-gray-400'}>{item.icon}</div>
            <span className="flex-1">{item.name}</span>
            {badge > 0 && (
              <span className="shrink-0 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const role = getRoleFromToken();
    if (!role) { router.push('/login'); return; }
    if (role !== 'PATIENT') { router.push('/dashboard/doctor'); return; }
    axios.get('/profile').then(res => {
      setProfile(res.data);
      const uid = res.data?.userId;
      if (uid && !localStorage.getItem(`telehealth_onboarding_${uid}`)) {
        setShowOnboarding(true);
      }
    }).catch(() => router.push('/login'));
  }, [router]);

  useEffect(() => {
    const handleStorageLogout = (e: StorageEvent) => {
      if (e.key === 'logout') router.push('/login');
    };
    window.addEventListener('storage', handleStorageLogout);
    return () => window.removeEventListener('storage', handleStorageLogout);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.setItem('logout', Date.now().toString());
    router.push('/login');
  };

  const isConsultation = pathname.includes('/consultation/');

  if (isConsultation) {
    return <NotificationsProvider>{children}</NotificationsProvider>;
  }

  return (
    <NotificationsProvider>
    <div className="min-h-screen bg-gray-50 flex">
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out flex flex-col
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
          <Link href="/dashboard/patient" className="flex items-center gap-2 text-blue-600">
            <Activity size={24} />
            <span className="text-xl font-bold text-gray-900 tracking-tight">Telehealth</span>
          </Link>
          <button className="ml-auto lg:hidden text-gray-500" onClick={() => setIsMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <PatientNav pathname={pathname} onNavClick={() => setIsMobileOpen(false)} />
        </div>

        <div className="p-4 border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
              <ProfileAvatar src={profile?.profilePictureUrl} iconSize={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {profile ? `${profile.firstName} ${profile.lastName}` : 'Loading...'}
              </p>
              <p className="text-xs text-gray-500">Patient</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 lg:px-8 shrink-0 sticky top-0 z-30">
          <button className="lg:hidden text-gray-500 hover:text-gray-900 mr-4" onClick={() => setIsMobileOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="ml-auto flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>

    {showOnboarding && profile && (
      <OnboardingModal
        userId={profile.userId}
        initialProfile={profile}
        onComplete={() => setShowOnboarding(false)}
      />
    )}
    </NotificationsProvider>
  );
}
