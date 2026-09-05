'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Folder, Activity, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import MenuBar from '@/components/MenuBar';
import Sidebar from '@/components/Sidebar';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import SignInModal from '@/components/SignInModal';
import { useStore } from '@/store/useStore';

const ParticleSphere = dynamic(() => import('@/components/ParticleSphere'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center text-[var(--color-brand-400)] text-sm animate-pulse">Initializing quantum engine...</div>
});

export default function RootPage() {
  const router = useRouter();
  const { setActiveProject, runningAgents, activeProject } = useStore();
  const { status } = useSession();

  const isAnyAgentRunning = Object.values(runningAgents || {}).some(Boolean);

  const handleOpenFolder = async () => {
    try {
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
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden relative z-10">
          
          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden bg-[var(--color-bg-primary)] relative">
            <main className="flex flex-1 flex-col items-center justify-center p-6 overflow-hidden relative bg-black">
              
              {/* Abstract Background Elements */}
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />
              
              <ParticleSphere />
              


              {/* Logo / Central Element */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="flex flex-col items-center justify-center select-none relative w-full h-[480px]"
              >
                {/* Soft Radial Halo */}
                <motion.div 
                  animate={{ scale: [1, 1.05, 1], opacity: [0.12, 0.18, 0.12] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-[220px] h-[220px] bg-brand-400/20 rounded-full shadow-[0_0_150px_100px_rgba(167,139,250,0.15)]"
                />
                
                {/* Dark Vignette to separate logo from globe */}
                <div className="absolute w-[350px] h-[350px] bg-black/70 rounded-full blur-3xl" />
                
                {/* Crisp White Logo with Mask to hide hard edges */}
                <img
                  src="/logo.png?v=2"
                  alt="MARE Logo"
                  className="w-[480px] max-w-[90%] pointer-events-none mix-blend-screen brightness-110 contrast-125 drop-shadow-[0_0_20px_rgba(167,139,250,0.4)] relative z-10 -translate-x-6"
                  style={{
                    WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 70%)',
                    maskImage: 'radial-gradient(circle, black 40%, transparent 70%)'
                  }}
                />
              </motion.div>

            </main>
          </div>
        </div>
      </div>

      {/* Premium Bottom Status Bar */}
      <footer className="flex h-10 shrink-0 items-center justify-between border-t border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md px-6 text-xs font-medium text-text-tertiary w-full z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <span className="uppercase tracking-wider text-[10px] text-text-tertiary">Tokens</span>
            <span className="text-white bg-white/5 px-2.5 py-1 rounded-md font-mono text-[11px] border border-white/5 shadow-inner">2.45M</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="uppercase tracking-wider text-[10px] text-text-tertiary">Network</span>
            <span className="text-brand-400 flex items-center gap-2 text-[11px]">
              <div className="relative flex h-2 w-2">
                {isAnyAgentRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>}
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500 shadow-[0_0_8px_var(--color-brand-500)]"></span>
              </div>
              {isAnyAgentRunning ? 'Processing Models...' : 'Connected & Secure'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <Cpu size={14} className="text-brand-400/70" />
            <span className="uppercase tracking-wider text-[10px] text-text-tertiary">CPU</span>
            <span className="text-white w-8 text-right font-mono text-[11px]">{isAnyAgentRunning ? '78%' : '34%'}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Activity size={14} className="text-brand-400/70" />
            <span className="uppercase tracking-wider text-[10px] text-text-tertiary">Mem</span>
            <span className="text-white w-8 text-right font-mono text-[11px]">{isAnyAgentRunning ? '82%' : '63%'}</span>
          </div>
        </div>
      </footer>
      <SignInModal />
    </div>
  );
}
