'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Database, Settings, HelpCircle, ChevronRight, User, BrainCircuit, History, LogOut } from 'lucide-react';
import { GlobalStateProvider, useGlobalState } from './GlobalStateContext';
import { supabase } from '../../lib/supabaseClient';

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarCollapsed, session } = useGlobalState();
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User';

  React.useEffect(() => {
    if (session === null) {
      router.push('/login');
    }
  }, [session, router]);

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (session === null) {
    return null;
  }

  const navItems = [
    { name: 'Workspace', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'History', href: '/dashboard/history', icon: <History size={18} /> },
    { name: 'Profile', href: '/dashboard/profile', icon: <User size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-[#FAFAFA] font-sans overflow-hidden">
      
      {/* Sidebar - Soft, Premium Design */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 ease-in-out bg-white border-r border-slate-100 flex flex-col justify-between shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 overflow-hidden whitespace-nowrap`}>
        
        <div>
          {/* Logo Section */}
          <div className="h-20 flex items-center px-6 border-b border-slate-100">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/20 shadow-lg flex items-center justify-center text-white">
                <BrainCircuit size={16} />
              </div>
              <span className={`font-bold tracking-tight text-sm text-slate-800 transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 ml-0' : 'opacity-100 ml-3'}`}>Neural Net Insights</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2 mt-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-semibold transition-all rounded-xl ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-500/10' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                  } ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}
                >
                  <div className="shrink-0">{item.icon}</div>
                  <span className={`transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-4 space-y-4">
          <a href="#" className={`flex items-center px-4 py-2 text-sm font-medium text-slate-400 hover:text-indigo-600 transition-colors ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <HelpCircle size={18} className="shrink-0" />
            <span className={`transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>Support</span>
          </a>
          
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className={`flex items-center w-full p-3 rounded-xl border border-red-100 bg-red-50 text-red-600 shadow-sm cursor-pointer hover:bg-red-100 transition-all ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}
            title="Sign out"
          >
            <LogOut size={18} className="shrink-0" />
            <span className={`text-sm font-bold truncate transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              Hi, {userName}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
        {children}
      </main>
      
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <GlobalStateProvider>
      <DashboardLayoutInner>
        {children}
      </DashboardLayoutInner>
    </GlobalStateProvider>
  );
}
