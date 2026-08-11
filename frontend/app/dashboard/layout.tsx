'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Database, Settings, HelpCircle, ChevronRight, User } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Workspace', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Datasets', href: '/dashboard/datasets', icon: <Database size={18} /> },
    { name: 'Settings', href: '/dashboard/settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-[#FAFAFA] font-sans overflow-hidden">
      
      {/* Sidebar - Sharp, Minimalist but with Color */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        
        <div>
          {/* Logo Section */}
          <div className="h-16 flex items-center px-6 border-b border-slate-200">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-4 h-4 bg-indigo-600"></div>
              <span className="font-bold tracking-tight text-sm text-slate-900">NEURAL_NET INSIGHTS</span>
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
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors border ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-600' 
                      : 'text-slate-600 border-transparent hover:border-slate-200 hover:text-indigo-600'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-4 space-y-4">
          <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
            <HelpCircle size={18} />
            Support
          </a>
          
          <div className="flex items-center gap-3 p-4 border border-slate-200 bg-[#FAFAFA] cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-colors group">
            <div className="w-8 h-8 bg-slate-200 flex items-center justify-center shrink-0">
              <User size={16} className="text-slate-600 group-hover:text-indigo-600" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate">Admin User</p>
              <p className="text-[10px] text-slate-500 group-hover:text-slate-600 truncate">Pro Tier</p>
            </div>
            <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden">
        {children}
      </main>
      
    </div>
  );
}
