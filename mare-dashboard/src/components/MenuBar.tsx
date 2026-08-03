import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { PanelLeft, PanelBottom, PanelRight, LayoutTemplate, Search, Monitor, Settings, UserCircle } from 'lucide-react';

type MenuState = 'File' | 'Edit' | 'Run' | 'Terminal' | 'Help' | 'Settings' | 'Profile' | null;

interface MenuBarProps {
  onNewFile: () => void;
  onNewFolder: () => void;
  showProfile?: boolean;
  showSignIn?: boolean;
}

export default function MenuBar({ onNewFile, onNewFolder, showProfile = false, showSignIn = false }: MenuBarProps) {
  const router = useRouter();
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
    if (divider) return <div className="h-px bg-[#3c3c3c] my-1 mx-2" />;
    return (
      <div
        className="flex items-center justify-between px-6 py-1.5 text-[13px] text-[#cccccc] hover:bg-[#0078d4] hover:text-white cursor-pointer group"
        onClick={() => {
          onClick?.();
          setActiveMenu(null);
        }}
      >
        <span>{label}</span>
        {shortcut && <span className="text-[#858585] group-hover:text-white ml-6 text-xs">{shortcut}</span>}
      </div>
    );
  };

  const { addTerminalLog, editorCode } = useStore();

  const handleAction = (actionName: string) => {
    addTerminalLog(`> <span class="text-text-secondary">Action triggered:</span> ${actionName}`);
  };

  const handleOpenFile = async () => {
    try {
      const [fileHandle] = await (window as any).showOpenFilePicker();
      const file = await fileHandle.getFile();
      const contents = await file.text();
      useStore.getState().setEditorCode(contents);
      addTerminalLog(`> <span class="text-accent-green">Success:</span> Opened file [${file.name}]`);
    } catch (err) {
      addTerminalLog(`> <span class="text-accent-red">Error:</span> Failed to open file`);
    }
  };

  const readDirectory = async (dirHandle: any, parentId: string = ''): Promise<any[]> => {
    const nodes = [];
    for await (const entry of dirHandle.values()) {
      // Skip heavy/hidden folders to avoid hanging
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') continue;

      const id = parentId ? `${parentId}/${entry.name}` : entry.name;

      if (entry.kind === 'directory') {
        nodes.push({
          id,
          name: entry.name,
          type: 'folder',
          isOpen: false,
          children: await readDirectory(entry, id)
        });
      } else {
        nodes.push({
          id,
          name: entry.name,
          type: 'file'
        });
      }
    }
    // Sort: folders first, then files, alphabetically
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  };

  const handleOpenFolder = async () => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });

      const children = await readDirectory(dirHandle);
      useStore.getState().setFileSystem(children);
      useStore.getState().setActiveProject(dirHandle.name);
      addTerminalLog(`> <span class="text-accent-green">Success:</span> Loaded folder [${dirHandle.name}] and its contents.`);
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      addTerminalLog(`> <span class="text-accent-red">Error:</span> Failed to open folder: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleSaveFile = async () => {
    try {
      const fileHandle = await (window as any).showSaveFilePicker();
      const writable = await fileHandle.createWritable();
      await writable.write(useStore.getState().editorCode);
      await writable.close();
      addTerminalLog(`> <span class="text-accent-green">Success:</span> File saved`);
    } catch (err) {
      addTerminalLog(`> <span class="text-accent-red">Error:</span> Failed to save file`);
    }
  };

  const renderDropdown = () => {
    if (activeMenu === 'File') {
      return (
        <div className="absolute top-full left-0 mt-0 py-1 w-64 bg-[#252526] border border-[#3c3c3c] shadow-lg rounded-md z-50">
          <MenuItem label="New Text File" shortcut="Ctrl+N" onClick={handleSaveFile} />
          <MenuItem label="New File..." shortcut="Ctrl+Alt+Windows+N" onClick={handleSaveFile} />
          <MenuItem label="New Folder..." shortcut="Ctrl+Shift+N" onClick={handleOpenFolder} />
          <MenuItem divider />
          <MenuItem label="Open File..." shortcut="Ctrl+O" onClick={handleOpenFile} />
          <MenuItem label="Open Folder..." shortcut="Ctrl+K Ctrl+O" onClick={handleOpenFolder} />
          <MenuItem label="Open Workspace from File..." onClick={handleOpenFile} />
          <MenuItem label="Open Recent" onClick={() => handleAction('Open Recent')} />
          <MenuItem divider />
          <MenuItem label="Save" shortcut="Ctrl+S" onClick={handleSaveFile} />
          <MenuItem label="Save As..." shortcut="Ctrl+Shift+S" onClick={handleSaveFile} />
          <MenuItem label="Save All" shortcut="Ctrl+K S" onClick={handleSaveFile} />
          <MenuItem divider />
          <MenuItem label="Exit" onClick={() => router.push('/')} />
        </div>
      );
    }
    if (activeMenu === 'Edit') {
      return (
        <div className="absolute top-full left-12 mt-0 py-1 w-64 bg-[#252526] border border-[#3c3c3c] shadow-lg rounded-md z-50">
          <MenuItem label="Undo" shortcut="Ctrl+Z" onClick={() => handleAction('Undo')} />
          <MenuItem label="Redo" shortcut="Ctrl+Y" onClick={() => handleAction('Redo')} />
          <MenuItem divider />
          <MenuItem label="Cut" shortcut="Ctrl+X" onClick={() => handleAction('Cut')} />
          <MenuItem label="Copy" shortcut="Ctrl+C" onClick={() => handleAction('Copy')} />
          <MenuItem label="Paste" shortcut="Ctrl+V" onClick={() => handleAction('Paste')} />
          <MenuItem divider />
          <MenuItem label="Find" shortcut="Ctrl+F" onClick={() => handleAction('Find')} />
          <MenuItem label="Replace" shortcut="Ctrl+H" onClick={() => handleAction('Replace')} />
          <MenuItem divider />
          <MenuItem label="Toggle Line Comment" shortcut="Ctrl+/" onClick={() => handleAction('Toggle Comment')} />
        </div>
      );
    }
    if (activeMenu === 'Run') {
      return (
        <div className="absolute top-full left-[110px] mt-0 py-1 w-72 bg-[#252526] border border-[#3c3c3c] shadow-lg rounded-md z-50">
          <MenuItem label="Start Debugging" shortcut="F5" onClick={() => handleAction('Start Debugging')} />
          <MenuItem label="Run Without Debugging" shortcut="Ctrl+F5" onClick={() => handleAction('Run Without Debugging')} />
          <MenuItem label="Stop Debugging" shortcut="Shift+F5" onClick={() => handleAction('Stop Debugging')} />
          <MenuItem label="Restart Debugging" shortcut="Ctrl+Shift+F5" onClick={() => handleAction('Restart Debugging')} />
          <MenuItem divider />
          <MenuItem label="Open Configurations" onClick={() => handleAction('Open Configurations')} />
          <MenuItem label="Add Configuration..." onClick={() => handleAction('Add Configuration')} />
          <MenuItem divider />
          <MenuItem label="Step Over" shortcut="F10" onClick={() => handleAction('Step Over')} />
          <MenuItem label="Step Into" shortcut="F11" onClick={() => handleAction('Step Into')} />
          <MenuItem label="Step Out" shortcut="Shift+F11" onClick={() => handleAction('Step Out')} />
          <MenuItem label="Continue" shortcut="F5" onClick={() => handleAction('Continue')} />
          <MenuItem divider />
          <MenuItem label="Toggle Breakpoint" shortcut="F9" onClick={() => handleAction('Toggle Breakpoint')} />
          <MenuItem label="New Breakpoint" shortcut=">" onClick={() => handleAction('New Breakpoint')} />
          <MenuItem divider />
          <MenuItem label="Enable All Breakpoints" onClick={() => handleAction('Enable All Breakpoints')} />
          <MenuItem label="Disable All Breakpoints" onClick={() => handleAction('Disable All Breakpoints')} />
          <MenuItem label="Remove All Breakpoints" onClick={() => handleAction('Remove All Breakpoints')} />
          <MenuItem divider />
          <MenuItem label="Install Additional Debuggers..." onClick={() => handleAction('Install Additional Debuggers')} />
        </div>
      );
    }
    if (activeMenu === 'Terminal') {
      return (
        <div className="absolute top-full left-[150px] mt-0 py-1 w-72 bg-[#252526] border border-[#3c3c3c] shadow-lg rounded-md z-50">
          <MenuItem label="New Terminal" shortcut="Ctrl+Shift+`" onClick={() => handleAction('New Terminal')} />
          <MenuItem label="Split Terminal" shortcut="Ctrl+Shift+5" onClick={() => handleAction('Split Terminal')} />
          <MenuItem label="New Terminal Window" shortcut="Ctrl+Shift+Alt+`" onClick={() => handleAction('New Terminal Window')} />
          <MenuItem divider />
          <MenuItem label="Run Task..." onClick={() => handleAction('Run Task')} />
          <MenuItem label="Run Build Task..." shortcut="Ctrl+Shift+B" onClick={() => handleAction('Run Build Task')} />
          <MenuItem label="Run Active File" onClick={() => handleAction('Run Active File')} />
          <MenuItem label="Run Selected Text" onClick={() => handleAction('Run Selected Text')} />
          <MenuItem divider />
          <MenuItem label="Show Running Tasks..." onClick={() => handleAction('Show Running Tasks')} />
          <MenuItem label="Restart Running Task..." onClick={() => handleAction('Restart Running Task')} />
          <MenuItem label="Terminate Task..." onClick={() => handleAction('Terminate Task')} />
          <MenuItem divider />
          <MenuItem label="Configure Tasks..." onClick={() => handleAction('Configure Tasks')} />
          <MenuItem label="Configure Default Build Task..." onClick={() => handleAction('Configure Default Build Task')} />
        </div>
      );
    }
    if (activeMenu === 'Help') {
      return (
        <div className="absolute top-full left-[220px] mt-0 py-1 w-64 bg-[#252526] border border-[#3c3c3c] shadow-lg rounded-md z-50">
          <MenuItem label="Welcome" onClick={() => handleAction('Welcome')} />
          <MenuItem label="Show All Commands" shortcut="Ctrl+Shift+P" onClick={() => handleAction('Show All Commands')} />
          <MenuItem label="Documentation" onClick={() => handleAction('Documentation')} />
          <MenuItem label="Editor Playground" onClick={() => handleAction('Editor Playground')} />
          <MenuItem label="Show Release Notes" onClick={() => handleAction('Show Release Notes')} />
          <MenuItem divider />
          <MenuItem label="Keyboard Shortcuts Reference" shortcut="Ctrl+K Ctrl+R" onClick={() => handleAction('Keyboard Shortcuts')} />
          <MenuItem label="Video Tutorials" onClick={() => handleAction('Video Tutorials')} />
          <MenuItem label="Tips and Tricks" onClick={() => handleAction('Tips and Tricks')} />
          <MenuItem divider />
          <MenuItem label="Join Us on YouTube" onClick={() => handleAction('Join Us on YouTube')} />
          <MenuItem label="Search Feature Requests" onClick={() => handleAction('Search Feature Requests')} />
          <MenuItem label="Report Issue" onClick={() => handleAction('Report Issue')} />
          <MenuItem divider />
          <MenuItem label="View License" onClick={() => handleAction('View License')} />
          <MenuItem label="Privacy Statement" onClick={() => handleAction('Privacy Statement')} />
          <MenuItem divider />
          <MenuItem label="Toggle Developer Tools" onClick={() => handleAction('Toggle Developer Tools')} />
          <MenuItem label="Open Process Explorer" onClick={() => handleAction('Open Process Explorer')} />
          <MenuItem divider />
          <MenuItem label="Check for Updates..." onClick={() => handleAction('Check for Updates')} />
          <MenuItem divider />
          <MenuItem label="About" onClick={() => handleAction('About')} />
        </div>
      );
    }
    if (activeMenu === 'Settings') {
      return (
        <div className="absolute top-full right-8 mt-0 py-1 w-56 bg-[#252526] border border-[#3c3c3c] shadow-lg rounded-md z-50">
          <MenuItem label="Command Palette..." shortcut="Ctrl+Shift+P" onClick={() => handleAction('Command Palette')} />
          <MenuItem divider />
          <MenuItem label="Settings" shortcut="Ctrl+," onClick={() => handleAction('Settings')} />
          <MenuItem label="Extensions" shortcut="Ctrl+Shift+X" onClick={() => handleAction('Extensions')} />
          <MenuItem label="Keyboard Shortcuts" shortcut="Ctrl+K Ctrl+S" onClick={() => handleAction('Keyboard Shortcuts')} />
          <MenuItem divider />
          <MenuItem label="User Snippets" onClick={() => handleAction('User Snippets')} />
          <MenuItem label="Color Theme" shortcut="Ctrl+K Ctrl+T" onClick={() => handleAction('Color Theme')} />
          <MenuItem label="File Icon Theme" onClick={() => handleAction('File Icon Theme')} />
          <MenuItem divider />
          <MenuItem label="Check for Updates..." onClick={() => handleAction('Check for Updates')} />
        </div>
      );
    }
    if (activeMenu === 'Profile') {
      return (
        <div className="absolute top-full right-1 mt-0 py-1 w-56 bg-[#252526] border border-[#3c3c3c] shadow-lg rounded-md z-50">
          <MenuItem label="Sign In to Sync Settings..." onClick={() => handleAction('Sign In')} />
          <MenuItem divider />
          <MenuItem label="Account Settings" onClick={() => handleAction('Account Settings')} />
          <MenuItem label="Manage Trusted Extensions" onClick={() => handleAction('Manage Trusted Extensions')} />
          <MenuItem divider />
          <MenuItem label="Sign Out" onClick={() => handleAction('Sign Out')} />
        </div>
      );
    }
    return null;
  };

  const navItems: MenuState[] = ['File', 'Edit', 'Run', 'Terminal', 'Help'];

  return (
    <div ref={menuRef} className="flex h-9 w-full shrink-0 items-center justify-between bg-[#181818] px-2 text-[13px] text-[#cccccc] relative font-sans border-b border-[#2b2b2b] select-none z-50">
      <div className="flex items-center h-full flex-1">
        {/* Logo placeholder */}
        <div className="flex items-center justify-center w-10 h-full mr-1 cursor-default">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain mix-blend-screen" />
        </div>
        {navItems.map((item) => (
          <div
            key={item}
            className={`px-2 py-1 cursor-pointer rounded-md mx-0.5 flex items-center ${activeMenu === item ? 'bg-[#3c3c3c] text-white' : 'hover:bg-white/10 hover:text-white'}`}
            onClick={() => setActiveMenu(activeMenu === item ? null : item)}
            onMouseEnter={() => handleHover(item)}
          >
            {item}
          </div>
        ))}
        {renderDropdown()}
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-[#cccccc]">
        MARE
      </div>

      <div className="flex items-center justify-end h-full flex-1 gap-2">
        <div className="flex items-center gap-1 mr-2 text-[#cccccc]">
          <div className="p-1 hover:bg-white/10 rounded cursor-pointer"><PanelLeft size={14} /></div>
          <div className="p-1 hover:bg-white/10 rounded cursor-pointer"><PanelBottom size={14} /></div>
          <div className="p-1 hover:bg-white/10 rounded cursor-pointer"><PanelRight size={14} /></div>
          <div className="p-1 hover:bg-white/10 rounded cursor-pointer ml-1"><Search size={14} /></div>
          {showSignIn && (
            <button
              onClick={() => {
                useStore.getState().setSignInModalOpen(true);
              }}
              className="ml-2 px-3 py-1 bg-brand-500 hover:bg-brand-400 text-white text-xs font-medium rounded shadow-sm transition-colors"
            >
              Sign In
            </button>
          )}
          {showProfile && (
            <div 
              className={`p-1 rounded cursor-pointer ml-1 ${activeMenu === 'Profile' ? 'bg-[#3c3c3c] text-white' : 'hover:bg-white/10'}`}
              onClick={() => setActiveMenu(activeMenu === 'Profile' ? null : 'Profile')}
            >
              <UserCircle size={14} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
