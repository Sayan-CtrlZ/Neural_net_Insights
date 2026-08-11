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

  React.useEffect(() => {
    if (session === null) {
      // Small timeout to allow initial session load to finish if it's just slow
      const timer = setTimeout(() => {
        if (!session) router.push('/login');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [session, router]);

  const navItems = [
    { name: 'Workspace', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'History', href: '/dashboard/history', icon: <History size={18} /> },
    { name: 'Settings', href: '/dashboard/settings', icon: <Settings size={18} /> },
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
          
          <div className={`flex items-center p-4 rounded-xl border border-slate-100 bg-white shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-100 transition-all group ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
              <User size={18} className="text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className={`flex-1 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              <p className="text-xs font-bold text-slate-900 truncate">
                {session?.user?.email?.split('@')[0] || 'Loading...'}
              </p>
              <p className="text-[10px] text-slate-500 group-hover:text-slate-600 truncate">Pro Tier</p>
            </div>
            {!isSidebarCollapsed && (
              <button 
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/login');
                }}
                className="text-slate-400 hover:text-red-500 shrink-0 transition-colors p-1"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
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
