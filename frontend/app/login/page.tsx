'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { BrainCircuit, Mail, Loader2, ArrowRight, ShieldCheck, User, Lock, KeyRound } from 'lucide-react';

type AuthStep = 'login' | 'signup' | 'signup_verify' | 'forgot_password';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>('login');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard');
      }
    });
  }, [router]);

  const clearMessages = () => {
    setError(null);
    setMessage(null);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }
        }
      });
      
      if (error) throw error;
      setStep('signup_verify');
      setMessage('A secure one-time password has been sent to your email to verify your account.');
    } catch (err: any) {
      if (err.message.includes('rate limit')) {
         setError('Email rate limit exceeded. Please wait a while before trying again.');
      } else {
         setError(err.message || 'Failed to sign up.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });
      if (error) throw error;
      if (data.session) {
        router.push('/dashboard');
      } else {
        // Sometimes signup verification succeeds but doesn't auto-login
        // In that case, we can manually log them in since we know their password
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setMessage('Password reset instructions have been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset instructions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30 shadow-xl flex items-center justify-center text-white">
            <BrainCircuit size={24} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          Neural Net Insights
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          {step === 'login' && 'Sign in to access your models'}
          {step === 'signup' && 'Create a new account'}
          {step === 'signup_verify' && 'Enter the verification code'}
          {step === 'forgot_password' && 'Reset your password'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[400px]">
        <div className="bg-white py-8 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl sm:px-10 border border-slate-100">
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl font-medium">
              {error}
            </div>
          )}
          
          {message && (
            <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm p-3 rounded-xl font-medium">
              {message}
            </div>
          )}

          {step === 'login' && (
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Email address</label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => { clearMessages(); setStep('forgot_password'); }}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Forgot your password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/40 focus:outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
                {!loading && <ArrowRight size={16} />}
              </button>
              
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => { clearMessages(); setStep('signup'); }}
                  className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  Don't have an account? Sign up
                </button>
              </div>
            </form>
          )}

          {step === 'signup' && (
            <form className="space-y-6" onSubmit={handleSignup}>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Full Name</label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Email address</label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700">Confirm Password</label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <ShieldCheck size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password || !name || !confirmPassword}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/40 focus:outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
                {!loading && <ArrowRight size={16} />}
              </button>
              
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => { clearMessages(); setStep('login'); }}
                  className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}

          {step === 'signup_verify' && (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div>
                <label className="block text-sm font-semibold text-slate-700">6-Digit Verification Code</label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-center tracking-widest font-mono font-bold"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/40 focus:outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Verify Account'}
                {!loading && <ArrowRight size={16} />}
              </button>
              
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('signup');
                    setOtp('');
                    clearMessages();
                  }}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Go back
                </button>
              </div>
            </form>
          )}

          {step === 'forgot_password' && (
            <form className="space-y-6" onSubmit={handleForgotPassword}>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Email address</label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/40 focus:outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Reset Password'}
                {!loading && <ArrowRight size={16} />}
              </button>
              
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => { clearMessages(); setStep('login'); }}
                  className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  Remember your password? Sign in
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
