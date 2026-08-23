'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Folder, Copy, Activity, Cpu } from 'lucide-react';
import MenuBar from '@/components/MenuBar';
import Sidebar from '@/components/Sidebar';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';

const ParticleSphere = dynamic(() => import('@/components/ParticleSphere'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center">Loading 3D visualization...</div>
});
import SignInModal from '@/components/SignInModal';
import { useStore } from '@/store/useStore';

export default function RootPage() {
  const router = useRouter();
  const { setActiveProject, runningAgents, activeProject } = useStore();
  const { status } = useSession();

  const isAnyAgentRunning = Object.values(runningAgents || {}).some(Boolean);

  const handleOpenFolder = async () => {
    try {
      // @ts-ignore - showDirectoryPicker is not in standard lib types yet
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setActiveProject(dirHandle.name);
      router.replace('/dashboard');
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Folder selection failed:', error);
      }
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden text-base bg-[var(--color-bg-primary)] select-none">
      <MenuBar onNewFile={() => { }} onNewFolder={() => { }} showSignIn={true} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden bg-[var(--color-bg-primary)]">
            <main className="flex flex-1 flex-col items-center justify-center p-6 overflow-hidden relative bg-black">
              <ParticleSphere />
              
              {status === 'authenticated' && !activeProject ? (
                <div className="absolute top-6 right-6 z-50 flex flex-col items-start gap-3 bg-black/60 p-5 rounded-xl backdrop-blur-md border border-[var(--color-border-primary)] shadow-xl max-w-sm">
                  <div className="text-white text-sm font-medium">Select a workspace folder to start</div>
                  <button 
                    onClick={handleOpenFolder} 
                    className="flex items-center gap-2 px-4 py-2.5 w-full justify-center bg-[#0078d4] hover:bg-[#006cbd] text-white text-sm rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(0,120,212,0.3)] hover:shadow-[0_0_25px_rgba(0,120,212,0.5)] transform hover:-translate-y-0.5"
                  >
                    <Folder size={16} />
                    Select Folder
                  </button>
                </div>
              ) : null}

              {/* Logo */}
              <div className="flex flex-col items-center justify-center select-none relative w-full h-[480px]">
                {/* Soft Radial Halo */}
                <div className="absolute w-[200px] h-[200px] bg-white/10 rounded-full shadow-[0_0_120px_80px_rgba(255,255,255,0.12)]"></div>
                {/* Dark Vignette to separate logo from globe */}
                <div className="absolute w-[350px] h-[350px] bg-black/60 rounded-full blur-3xl"></div>
                {/* Crisp White Logo with Mask to hide hard edges */}
                <img
                  src="/logo.png?v=2"
                  alt="MARE Logo"
                  className="w-[480px] max-w-[90%] pointer-events-none mix-blend-screen brightness-75 contrast-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] relative z-10 -translate-x-6"
                  style={{
                    WebkitMaskImage: 'radial-gradient(circle, black 45%, transparent 68%)',
                    maskImage: 'radial-gradient(circle, black 45%, transparent 68%)'
                  }}
                />
              </div>

            </main>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 text-xs font-medium text-text-tertiary w-full">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span>Tokens Used:</span>
            <span className="text-white bg-[var(--color-bg-tertiary)] px-2 py-0.5 rounded font-mono">2.45M</span>
          </div>
          <div className="flex items-center gap-2">
            <span>System Health:</span>
            <span className="text-accent-green flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-accent-green shadow-[0_0_8px_var(--color-accent-green)]"></div>
              {isAnyAgentRunning ? 'Processing...' : 'Excellent'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-text-secondary" />
            <span>CPU:</span>
            <span className="text-white w-8 text-right font-mono">{isAnyAgentRunning ? '78%' : '34%'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-text-secondary" />
            <span>Memory:</span>
            <span className="text-white w-8 text-right font-mono">{isAnyAgentRunning ? '82%' : '63%'}</span>
          </div>
        </div>
      </footer>
      <SignInModal />
    </div>
  );
}
