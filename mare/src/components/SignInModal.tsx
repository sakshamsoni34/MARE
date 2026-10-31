'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { X } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function SignInModal() {
  const { isSignInModalOpen, setSignInModalOpen, updateAgentScript, addTerminalLog } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err) {
        setSignInModalOpen(true);
        if (err === 'Configuration') {
          setErrorMsg('Google OAuth is not configured in Vercel. Please sign in with your email address below.');
        } else if (err === 'AccessDenied') {
          setErrorMsg('Access denied. You do not have permission to sign in.');
        } else if (err === 'OAuthSignin' || err === 'OAuthCallback') {
          setErrorMsg('OAuth redirect error. Make sure Google Cloud Console includes the redirect URI.');
        } else {
          setErrorMsg(`Authentication notice: ${err}`);
        }
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [setSignInModalOpen]);

  if (!isSignInModalOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      updateAgentScript('Orqion', '');
      setIsLoading(true);
      setErrorMsg('');
      await signIn('google', { callbackUrl: '/' }, { prompt: 'select_account' });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google sign-in encountered an issue. You can sign in with your email below.');
      setIsLoading(false);
    }
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter an email address.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: cleanEmail,
        password: password.trim() || 'demo12345',
        isRegister: showPassword ? 'false' : 'true',
        redirect: false,
      });

      if (result?.error) {
        if (!showPassword) {
          setShowPassword(true);
          setErrorMsg('Account requires a password. Please enter your password below.');
        } else {
          setErrorMsg('Authentication failed: Invalid credentials.');
        }
      } else {
        setSignInModalOpen(false);
        addTerminalLog(`> <span class="text-accent-green">✓ Successfully signed in as ${cleanEmail}.</span>`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error during sign-in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) setSignInModalOpen(false); }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none"
    >
      <div className="relative w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#202123] px-8 pt-9 pb-8 shadow-2xl text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setSignInModalOpen(false)}
          className="absolute right-5 top-5 text-gray-400 hover:text-white transition-colors p-1"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Title & Subtitle */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-400 leading-snug px-2">
            You&apos;ll get smarter responses and can upload files, images, and more.
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-xs text-red-300 leading-relaxed text-center">
            {errorMsg}
          </div>
        )}

        {/* Continue with Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#2f2f32] hover:bg-[#383944] border border-white/5 py-3 px-4 text-[15px] font-medium text-white transition-all cursor-pointer shadow-sm disabled:opacity-50"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-6 flex items-center">
          <div className="flex-1 border-t border-[#383838]" />
          <span className="px-3 text-xs font-semibold text-gray-500 tracking-wider uppercase">OR</span>
          <div className="flex-1 border-t border-[#383838]" />
        </div>

        {/* Email / Continue Form */}
        <form onSubmit={handleContinue} className="space-y-3.5">
          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-xl bg-[#18181b] border border-[#383838] px-4 py-3 text-white placeholder:text-gray-500 text-[15px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {showPassword && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-150">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl bg-[#18181b] border border-[#383838] px-4 py-3 text-white placeholder:text-gray-500 text-[15px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-medium text-[15px] py-3 transition-colors shadow-md disabled:opacity-50 cursor-pointer text-center"
          >
            {isLoading ? 'Continuing...' : 'Continue'}
          </button>
        </form>

      </div>
    </div>
  );
}
