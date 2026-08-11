'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Settings, Shield, Bell, CreditCard, Key, Server, Lock, Eye, EyeOff, Loader2, Info } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isRecovery = searchParams?.get('recovery') === 'true';

  useEffect(() => {
    if (isRecovery) {
      setMessage('Please enter your new password below.');
    }
  }, [isRecovery]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      setMessage('Your password has been updated successfully!');
      setPassword('');
      setConfirmPassword('');
      
      // Clear the recovery URL parameter if it exists
      if (isRecovery) {
        router.replace('/dashboard/profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-white text-black font-sans flex flex-col overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-end bg-white shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1 text-slate-900">Profile Settings</h1>
          <p className="text-sm text-slate-500">Manage your account security and preferences.</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 bg-slate-50">
        
        <div className="lg:col-span-2 space-y-8">
          
          {isRecovery && (
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
              <Info className="mt-0.5 shrink-0" size={18} />
              <div>
                <h3 className="text-sm font-bold">Password Recovery</h3>
                <p className="text-sm mt-1 opacity-90">You have successfully authenticated via a secure reset link. Please set your new password below.</p>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 flex items-center gap-2 border-b border-slate-100">
              <Shield size={16} className="text-indigo-600"/>
              <h2 className="text-sm font-bold text-slate-800">Security</h2>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Change Password</h3>
              <p className="text-sm text-slate-500 mb-6">Update your password to keep your account secure.</p>
              
              {error && (
                <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl font-medium">
                  {error}
                </div>
              )}
              
              {message && !isRecovery && (
                <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm p-3 rounded-xl font-medium">
                  {message}
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={loading || !password || !confirmPassword}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
        </div>

        {/* Sidebar Settings Navigation */}
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 p-3 text-sm font-semibold rounded-xl bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-500/10">
            <Shield size={18} /> Security
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-sm font-semibold rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all">
            <Settings size={18} /> General
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-sm font-semibold rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all">
            <Key size={18} /> API Keys
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-sm font-semibold rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all">
            <Bell size={18} /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-sm font-semibold rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all">
            <CreditCard size={18} /> Billing
          </button>
        </div>

      </div>
      
    </div>
  );
}
