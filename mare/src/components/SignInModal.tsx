import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { X, Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function SignInModal() {
  const { isSignInModalOpen, setSignInModalOpen, updateAgentScript, addTerminalLog } = useStore();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err) {
        setSignInModalOpen(true);
        if (err === 'Configuration') {
          setErrorMsg('Configuration notice: NEXTAUTH_SECRET or Google OAuth credentials were not initialized in Vercel. You can also sign in via 1-Click Demo.');
        } else if (err === 'AccessDenied') {
          setErrorMsg('Access denied. You do not have permission to sign in.');
        } else if (err === 'Verification') {
          setErrorMsg('The verification token has expired or has already been used.');
        } else if (err === 'OAuthSignin' || err === 'OAuthCallback') {
          setErrorMsg('OAuth error: Please ensure Google Cloud Console Authorized redirect URI includes https://mare-dun-six.vercel.app/api/auth/callback/google');
        } else {
          setErrorMsg(`Authentication error: ${err}`);
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
      setErrorMsg(err?.message || 'Google sign-in encountered an issue.');
      setIsLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        isRegister: isRegister ? 'true' : 'false',
        redirect: false,
      });

      if (result?.error) {
        setErrorMsg('Authentication failed: Invalid credentials or account already exists.');
      } else {
        setSignInModalOpen(false);
        addTerminalLog(`> <span class="text-accent-green">✓ Successfully authenticated as ${email.trim().toLowerCase()}.</span>`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error during sign-in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await signIn('credentials', {
        email: 'developer@mare.ai',
        password: '',
        isRegister: 'false',
        redirect: false,
      });
      if (res?.error) {
        setErrorMsg('Demo sign-in failed: ' + res.error);
      } else {
        setSignInModalOpen(false);
        addTerminalLog('> <span class="text-accent-green">✓ Signed in as MARE Developer.</span>');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to sign in as demo developer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) setSignInModalOpen(false); }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#121316] p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setSignInModalOpen(false)}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors p-1"
        >
          <X size={18} />
        </button>

        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-3">
            <Sparkles size={13} />
            <span>Multi-Agent Auth</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isRegister ? 'Create MARE Account' : 'Welcome Back'}
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            {isRegister ? 'Register to persist projects & workflows' : 'Sign in to access your multi-agent workspace'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-gray-500 font-medium">
            <span className="bg-[#121316] px-2">or email</span>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleCredentialsSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-300 mb-1">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@mare.ai"
                className="w-full rounded-xl bg-black/30 border border-white/10 pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-black/30 border border-white/10 pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs py-2.5 transition-all shadow-md shadow-brand-500/20 disabled:opacity-50 cursor-pointer mt-2"
          >
            <span>{isLoading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setErrorMsg(''); }}
            className="hover:text-brand-400 transition-colors text-[11px]"
          >
            {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register'}
          </button>

          <button
            type="button"
            onClick={handleDemoSignIn}
            className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
          >
            <CheckCircle2 size={12} />
            <span>1-Click Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
