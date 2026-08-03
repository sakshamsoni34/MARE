import { useStore } from '@/store/useStore';
import { X, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function SignInModal() {
  const { isSignInModalOpen, setSignInModalOpen, setActiveProject } = useStore();
  const router = useRouter();

  if (!isSignInModalOpen) return null;

  const handleSignIn = () => {
    setSignInModalOpen(false);
    setActiveProject('Default Workspace');
    router.replace('/dashboard');
  };

  const handleGoogleSignIn = () => {
    setActiveProject('Default Workspace');
    signIn('google', { callbackUrl: '/dashboard' }, { prompt: 'select_account' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8 shadow-2xl">
        <button
          onClick={() => setSignInModalOpen(false)}
          className="absolute right-4 top-4 text-text-secondary hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
          <p className="mt-2 text-sm text-text-secondary">Sign in to your account to continue</p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-bg-tertiary)]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
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
            Continue with Google
          </button>

          <button
            onClick={handleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-bg-tertiary)]"
          >
            <Smartphone className="h-5 w-5 text-text-secondary" />
            Continue with Phone Number
          </button>
        </div>
      </div>
    </div>
  );
}
