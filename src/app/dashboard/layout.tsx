'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, BookOpen, User, LogOut, Code } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect if not authenticated or not an interviewer (handled by middleware, but client side check is clean)
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && session.user.role !== 'INTERVIEWER') {
      router.push('/sessions');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-steel border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'INTERVIEWER') {
    return null;
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Problem Library', href: '/dashboard/problems', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="px-6 py-6 border-b border-slate-800 flex items-center gap-2">
            <Code className="text-steel-light w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight text-white">
              Code<span className="text-steel-light font-medium">Relay</span>
            </span>
          </div>

          {/* User Info */}
          <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-steel flex items-center justify-center text-white font-bold text-lg">
              {session.user.name ? session.user.name[0].toUpperCase() : 'I'}
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white truncate max-w-[140px]">
                {session.user.name}
              </h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-navy border border-steel/30 text-steel-light">
                Interviewer
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-steel text-white shadow-lg shadow-steel/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg text-sm font-semibold transition-all"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
        {children}
      </main>
    </div>
  );
}
