'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2, Info, User } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useGlobalState } from '../GlobalStateContext';

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session } = useGlobalState();
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User';
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isRecovery = searchParams?.get('recovery') === 'true';

  useEffect(() => {
    if (session?.user?.user_metadata?.full_name) {
      setNewName(session.user.user_metadata.full_name);
    }
  }, [session]);

  useEffect(() => {
    if (isRecovery) {
      setIsChangingPassword(true);
      setIsVerified(true);
      setMessage('Please enter your new password below.');
    }
  }, [isRecovery]);

  const handleUpdateName = async () => {
    setNameLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: newName } });
      if (error) throw error;
      setMessage('Name updated successfully!');
      setIsEditingName(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update name.');
    } finally {
      setNameLoading(false);
    }
  };

  const handleVerifyCurrentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: session?.user?.email || '', 
        password: currentPassword 
      });
      if (error) throw error;
      setIsVerified(true);
    } catch (err: any) {
      setError('Incorrect current password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(session?.user?.email || '', {
        redirectTo: `${window.location.origin}/dashboard/profile?recovery=true`
      });
      if (error) throw error;
      setMessage('Password reset instructions have been sent to your email.');
    } catch (err: any) {
      setError('Failed to send reset instructions.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters with one uppercase, one lowercase, and one number.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage('Password updated successfully!');
      setPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setIsChangingPassword(false);
      setIsVerified(false);
      if (isRecovery) router.replace('/dashboard/profile');
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-[#fafafa] dark:bg-[#0d0d0d] font-sans flex flex-col overflow-y-auto">
      
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-white dark:bg-[#0d0d0d] shrink-0">
        <h1 className="text-base font-semibold text-slate-800 dark:text-white">Account Settings</h1>
        <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">Manage your profile and security.</p>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6 max-w-2xl w-full">

        {/* Banners */}
        {isRecovery && (
          <div className="mb-4 flex items-start gap-3 p-3 rounded-lg border border-indigo-200/60 dark:border-indigo-500/20 bg-indigo-50/80 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
            <Info size={14} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold">Password Recovery</p>
              <p className="text-xs mt-0.5 opacity-80">Authenticated via reset link. Set your new password below.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-200/60 dark:border-red-500/20 bg-red-50/80 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded-lg border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
            {message}
          </div>
        )}

        {/* Unified Card */}
        <div className="bg-white dark:bg-[#111111] border border-slate-100 dark:border-white/10 rounded-xl overflow-hidden">
          
          {/* Card Header */}
          <div className="px-4 py-2.5 flex items-center gap-2 border-b border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-[#171717]">
            <User size={13} className="text-slate-400 dark:text-white/40" />
            <h2 className="text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider">Profile</h2>
          </div>

          {/* Personal Info */}
          <div className="p-5 border-b border-slate-100 dark:border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider">Full Name</label>
                  {!isEditingName && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="block w-full px-2.5 py-1.5 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/15 rounded-lg text-sm text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                      placeholder="Your name"
                    />
                    <button
                      onClick={handleUpdateName}
                      disabled={nameLoading}
                      className="shrink-0 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all"
                    >
                      {nameLoading ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                    </button>
                    <button
                      onClick={() => { setIsEditingName(false); setNewName(session?.user?.user_metadata?.full_name || ''); }}
                      disabled={nameLoading}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-800 dark:text-white">
                    {session?.user?.user_metadata?.full_name || <span className="text-slate-400 dark:text-white/30 italic">Not set</span>}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-1.5">Email Address</label>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{session?.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="p-5">
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-3">Security</label>

            {!isChangingPassword ? (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-xs font-semibold text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              >
                Change Password
              </button>
            ) : (
              <div className="max-w-sm bg-slate-50/80 dark:bg-[#1a1a1a] rounded-xl border border-slate-100 dark:border-white/10 p-4 space-y-3">
                {!isVerified ? (
                  <form onSubmit={handleVerifyCurrentPassword} className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-semibold text-slate-600 dark:text-white/70">Current Password</label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-[11px] font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                        >
                          Forgot?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-300 dark:text-white/30">
                          <Lock size={13} />
                        </div>
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="block w-full pl-8 pr-8 py-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/15 rounded-lg text-sm text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-300 dark:text-white/30 hover:text-slate-500 dark:hover:text-white/60 transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading || !currentPassword}
                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 transition-all"
                      >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : 'Verify'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsChangingPassword(false); setCurrentPassword(''); setError(null); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5">New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-300 dark:text-white/30">
                          <Lock size={13} />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="block w-full pl-8 pr-8 py-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/15 rounded-lg text-sm text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-300 dark:text-white/30 hover:text-slate-500 dark:hover:text-white/60 transition-colors"
                        >
                          {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5">Confirm New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-300 dark:text-white/30">
                          <Lock size={13} />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="block w-full pl-8 pr-8 py-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/15 rounded-lg text-sm text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-300 dark:text-white/30 hover:text-slate-500 dark:hover:text-white/60 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading || !password || !confirmPassword}
                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 transition-all"
                      >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : 'Save Password'}
                      </button>
                      {!isRecovery && (
                        <button
                          type="button"
                          onClick={() => { setIsChangingPassword(false); setIsVerified(false); setPassword(''); setConfirmPassword(''); setError(null); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
