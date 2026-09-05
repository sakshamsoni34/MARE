import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { PanelLeft, PanelBottom, PanelRight, Search, UserCircle, Bot } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

type MenuState = 'File' | 'Edit' | 'View' | 'Terminal' | 'Help' | 'Settings' | 'Profile' | null;

interface MenuBarProps {
  onNewFile: () => void;
  onNewFolder: () => void;
  showProfile?: boolean;
  showSignIn?: boolean;
}

export default function MenuBar({ onNewFile, onNewFolder, showProfile = false, showSignIn = false }: MenuBarProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeMenu, setActiveMenu] = useState<MenuState>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHover = (menu: MenuState) => {
    if (activeMenu !== null) {
      setActiveMenu(menu);
    }
  };

  const MenuItem = ({ label, shortcut, divider, onClick }: { label?: string, shortcut?: string, divider?: boolean, onClick?: () => void }) => {
    if (divider) return <div className="h-px bg-white/10 my-1 mx-2" />;
    return (
      <div
        className="flex items-center justify-between px-6 py-2 text-[13px] text-text-secondary hover:bg-brand-500/20 hover:text-white cursor-pointer group transition-colors"
        onClick={() => {
          onClick?.();
          setActiveMenu(null);
        }}
      >
        <span className="tracking-wide">{label}</span>
        {shortcut && <span className="text-white/30 group-hover:text-white/70 ml-8 text-[11px] font-mono tracking-wider">{shortcut}</span>}
      </div>
    );
  };

  const { addTerminalLog, editorCode, toggleSidebar, toggleTerminal, toggleRightSidebar, isRightSidebarOpen } = useStore();

  const handleAction = async (actionName: string, folderName?: string) => {
    addTerminalLog(`> <span class="text-brand-400">Action:</span> ${actionName}`);
    try {
      const response = await fetch('http://localhost:8555/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionName, folderName: folderName }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const jsonResponse = await response.json();
      const formattedJson = JSON.stringify(jsonResponse, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;');
      addTerminalLog(`> <span class="text-blue-400">Response:</span> <br><pre class="text-xs text-white/60 mt-1">${formattedJson}</pre>`);
    } catch (error) {
      addTerminalLog(`> <span class="text-red-400">Error:</span> ${error}`);
    }
  };

  const handleOpenFile = async () => {
    if (status !== 'authenticated') {
      useStore.getState().setSignInModalOpen(true);
      return;
    }
    try {
      const [fileHandle] = await (window as any).showOpenFilePicker();
      const file = await fileHandle.getFile();
      const contents = await file.text();
      useStore.getState().setEditorCode(contents);
      addTerminalLog(`> <span class="text-green-400">Success:</span> Opened file [${file.name}]`);
      await handleAction(`Opened file [${file.name}]`);
    } catch (err) {
      addTerminalLog(`> <span class="text-red-400">Error:</span> Failed to open file`);
    }
  };

  const readDirectory = async (dirHandle: any, parentId: string = ''): Promise<any[]> => {
    const nodes = [];
    for await (const entry of dirHandle.values()) {
      if (['node_modules', '.git', '.next'].includes(entry.name)) continue;
      const id = parentId ? `${parentId}/${entry.name}` : entry.name;
      if (entry.kind === 'directory') {
        nodes.push({ id, name: entry.name, type: 'folder', isOpen: false, children: await readDirectory(entry, id) });
      } else {
        nodes.push({ id, name: entry.name, type: 'file' });
      }
    }
    return nodes.sort((a, b) => a.type !== b.type ? (a.type === 'folder' ? -1 : 1) : a.name.localeCompare(b.name));
  };

  const handleOpenFolder = async () => {
    if (status !== 'authenticated') {
      useStore.getState().setSignInModalOpen(true);
      return;
    }
    try {
      const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      const children = await readDirectory(dirHandle);
      useStore.getState().setFileSystem(children);
      useStore.getState().setActiveProject(dirHandle.name);
      addTerminalLog(`> <span class="text-green-400">Success:</span> Loaded workspace [${dirHandle.name}]`);
      await handleAction("Open Folder", dirHandle.name);
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      addTerminalLog(`> <span class="text-red-400">Error:</span> Failed to open folder`);
    }
  };

  const handleSaveFile = async () => {
    try {
      const fileHandle = await (window as any).showSaveFilePicker();
      const writable = await fileHandle.createWritable();
      await writable.write(useStore.getState().editorCode);
      await writable.close();
      useStore.getState().createFile(useStore.getState().selectedFolderId || null, fileHandle.name, useStore.getState().editorCode);
      addTerminalLog(`> <span class="text-green-400">Success:</span> File saved`);
      await handleAction(`Saved file`);
    } catch (err) {
      addTerminalLog(`> <span class="text-red-400">Error:</span> Failed to save file`);
    }
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -5, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: "easeOut" } },
    exit: { opacity: 0, y: -5, scale: 0.95, transition: { duration: 0.1, ease: "easeIn" } }
  };

  const renderNavDropdown = () => {
    if (!activeMenu || activeMenu === 'Profile') return null;

    const DropdownWrapper = ({ children, left }: any) => (
      <motion.div
        variants={dropdownVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute top-full mt-1 py-1.5 bg-[#141414]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl z-50 overflow-hidden"
        style={{ left }}
      >
        {children}
      </motion.div>
    );

    if (activeMenu === 'File') {
      return (
        <DropdownWrapper left={0}><div className="w-64">
          <MenuItem label="New Text File" shortcut="Ctrl+N" onClick={handleSaveFile} />
          <MenuItem label="New File..." shortcut="Ctrl+Alt+Windows+N" onClick={handleSaveFile} />
          <MenuItem label="New Folder..." shortcut="Ctrl+Shift+N" onClick={handleOpenFolder} />
          <MenuItem divider />
          <MenuItem label="Open File..." shortcut="Ctrl+O" onClick={handleOpenFile} />
          <MenuItem label="Open Folder..." shortcut="Ctrl+K Ctrl+O" onClick={handleOpenFolder} />
          <MenuItem divider />
          <MenuItem label="Save" shortcut="Ctrl+S" onClick={handleSaveFile} />
          <MenuItem label="Save As..." shortcut="Ctrl+Shift+S" onClick={handleSaveFile} />
          <MenuItem divider />
          <MenuItem label="Exit" onClick={() => router.push('/')} />
        </div></DropdownWrapper>
      );
    }
    if (activeMenu === 'Edit') {
      return (
        <DropdownWrapper left={60}><div className="w-64">
          <MenuItem label="Undo" shortcut="Ctrl+Z" onClick={() => document.execCommand('undo')} />
          <MenuItem label="Redo" shortcut="Ctrl+Y" onClick={() => document.execCommand('redo')} />
          <MenuItem divider />
          <MenuItem label="Cut" shortcut="Ctrl+X" onClick={() => document.execCommand('cut')} />
          <MenuItem label="Copy" shortcut="Ctrl+C" onClick={() => document.execCommand('copy')} />
          <MenuItem label="Paste" shortcut="Ctrl+V" onClick={async () => {
            try {
              const text = await navigator.clipboard.readText();
              document.execCommand('insertText', false, text);
            } catch (err) { console.error(err); }
          }} />
          <MenuItem divider />
          <MenuItem label="Clear Editor" onClick={() => useStore.getState().setEditorCode('')} />
        </div></DropdownWrapper>
      );
    }
    if (activeMenu === 'View') {
      return (
        <DropdownWrapper left={120}><div className="w-72">
          <MenuItem label="Toggle Explorer Sidebar" onClick={toggleSidebar} />
          <MenuItem label="Toggle Orqion Chat" onClick={toggleRightSidebar} />
          <MenuItem label="Toggle Terminal Panel" shortcut="Ctrl+`" onClick={toggleTerminal} />
          <MenuItem divider />
          <MenuItem label="Toggle Workflow Visualizer" onClick={() => useStore.getState().toggleWorkflow()} />
        </div></DropdownWrapper>
      );
    }
    return null;
  };

  const renderProfileDropdown = () => {
    if (activeMenu !== 'Profile') return null;

    return (
      <motion.div
        variants={dropdownVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute top-full right-0 mt-2 py-1.5 bg-[#141414]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl z-50 overflow-hidden"
      >
        <div className="w-64 text-left">
          {status === 'authenticated' && session ? (
            <>
              <div className="px-6 py-3 flex flex-col gap-0.5 bg-white/5">
                <div className="text-white font-medium text-sm">{session.user?.name}</div>
                <div className="text-text-secondary text-xs truncate">{session.user?.email}</div>
              </div>
              <MenuItem divider />
              <MenuItem label="Sign Out" onClick={() => {
                useStore.getState().setActiveProject('');
                signOut({ callbackUrl: '/' });
              }} />
            </>
          ) : (
            <MenuItem label="Sign In" onClick={() => handleAction('Sign In')} />
          )}
        </div>
      </motion.div>
    );
  };

  const navItems: MenuState[] = ['File', 'Edit', 'View', 'Terminal', 'Help'];

  return (
    <div ref={menuRef} className="flex h-11 w-full shrink-0 items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-md px-3 text-[13px] text-text-secondary relative font-sans border-b border-white/5 select-none z-[100]">
      <div className="flex items-center h-full flex-1">
        <div className="flex items-center justify-center w-10 h-full mr-2 cursor-default">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain mix-blend-screen brightness-125" />
        </div>
        <div className="flex gap-1 h-full items-center relative">
          {navItems.map((item) => (
            <div
              key={item}
              className={`px-3 py-1.5 cursor-pointer rounded-lg flex items-center transition-colors ${activeMenu === item ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}
              onClick={() => setActiveMenu(activeMenu === item ? null : item)}
              onMouseEnter={() => handleHover(item)}
            >
              {item}
            </div>
          ))}
          <AnimatePresence>
            {renderNavDropdown()}
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-semibold tracking-[0.2em] text-white/40 uppercase">
        MARE
      </div>

      <div className="flex items-center justify-end h-full flex-1 gap-2.5 pr-2">
        <div className="flex items-center gap-1 text-text-secondary">
          <button className="p-1.5 hover:bg-white/10 hover:text-white transition-colors rounded-lg" onClick={toggleSidebar} title="Toggle Sidebar"><PanelLeft size={16} strokeWidth={1.5} /></button>
          <button className="p-1.5 hover:bg-white/10 hover:text-white transition-colors rounded-lg" onClick={toggleTerminal} title="Toggle Terminal"><PanelBottom size={16} strokeWidth={1.5} /></button>
          
          <button
            onClick={async () => {
              if (!useStore.getState().activeProject) {
                alert("Please select a workspace folder first.");
                return;
              }
              toggleRightSidebar();
              try {
                await fetch('http://localhost:8555/api/oquiron', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ agentName: 'Orqion', userQuery: 'Clicked Orqion', agentResponse: 'Opened' })
                });
              } catch (error) { console.error(error); }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 ml-2 rounded-lg text-xs font-medium transition-all ${
              isRightSidebarOpen 
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]' 
                : 'bg-white/5 hover:bg-white/10 hover:text-white border border-transparent'
            }`}
          >
            <Bot size={15} strokeWidth={1.5} className={isRightSidebarOpen ? 'text-brand-400' : 'text-text-secondary'} />
            <span className="tracking-wide">Orqion</span>
          </button>
          
          {showSignIn && status !== 'authenticated' && (
            <button
              onClick={() => useStore.getState().setSignInModalOpen(true)}
              className="ml-4 px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-[13px] font-medium tracking-wide rounded-lg shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all"
            >
              Sign In
            </button>
          )}
          
          {(showProfile || status === 'authenticated') && (
            <div className="relative">
              <div
                className={`p-1 ml-3 rounded-full cursor-pointer flex items-center justify-center border transition-all ${activeMenu === 'Profile' ? 'border-brand-400 bg-white/10' : 'border-transparent hover:border-white/20'}`}
                onClick={() => setActiveMenu(activeMenu === 'Profile' ? null : 'Profile')}
              >
                {session?.user?.image ? (
                  <img src={session.user.image} alt="Profile" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <UserCircle size={20} strokeWidth={1.5} />
                )}
              </div>
              <AnimatePresence>
                {renderProfileDropdown()}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
