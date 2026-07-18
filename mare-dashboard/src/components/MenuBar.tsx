import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';

type MenuState = 'File' | 'Edit' | 'Selection' | 'View' | 'Go' | 'Run' | 'Terminal' | 'Help' | null;

interface MenuBarProps {
  onNewFile: () => void;
  onNewFolder: () => void;
}

export default function MenuBar({ onNewFile, onNewFolder }: MenuBarProps) {
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

  const { addTerminalLog } = useStore();

  const handleAction = (actionName: string) => {
    addTerminalLog(`> <span class="text-text-secondary">Action triggered:</span> ${actionName}`);
  };

  const renderDropdown = () => {
    if (activeMenu === 'File') {
      return (
        <div className="absolute top-full left-0 mt-0 py-1 w-64 bg-[#252526] border border-[#3c3c3c] shadow-lg rounded-md z-50">
          <MenuItem label="New Text File" shortcut="Ctrl+N" onClick={onNewFile} />
          <MenuItem label="New File..." shortcut="Ctrl+Alt+Windows+N" onClick={onNewFile} />
          <MenuItem label="New Folder..." shortcut="Ctrl+Shift+N" onClick={onNewFolder} />
          <MenuItem divider />
          <MenuItem label="Open File..." shortcut="Ctrl+O" onClick={() => handleAction('Open File')} />
          <MenuItem label="Open Folder..." shortcut="Ctrl+K Ctrl+O" onClick={() => handleAction('Open Folder')} />
          <MenuItem label="Open Workspace from File..." onClick={() => handleAction('Open Workspace')} />
          <MenuItem label="Open Recent" onClick={() => handleAction('Open Recent')} />
          <MenuItem divider />
          <MenuItem label="Save" shortcut="Ctrl+S" onClick={() => handleAction('Save')} />
          <MenuItem label="Save As..." shortcut="Ctrl+Shift+S" onClick={() => handleAction('Save As')} />
          <MenuItem label="Save All" shortcut="Ctrl+K S" onClick={() => handleAction('Save All')} />
          <MenuItem divider />
          <MenuItem label="Exit" onClick={() => handleAction('Exit')} />
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
    if (activeMenu === 'Selection') {
      return (
        <div className="absolute top-full left-24 mt-0 py-1 w-[320px] bg-[#252526] border border-[#3c3c3c] shadow-lg rounded-md z-50">
          <MenuItem label="Select All" shortcut="Ctrl+A" onClick={() => handleAction('Select All')} />
          <MenuItem label="Expand Selection" shortcut="Shift+Alt+RightArrow" onClick={() => handleAction('Expand Selection')} />
          <MenuItem label="Shrink Selection" shortcut="Shift+Alt+LeftArrow" onClick={() => handleAction('Shrink Selection')} />
          <MenuItem divider />
          <MenuItem label="Copy Line Up" shortcut="Shift+Alt+UpArrow" onClick={() => handleAction('Copy Line Up')} />
          <MenuItem label="Copy Line Down" shortcut="Shift+Alt+DownArrow" onClick={() => handleAction('Copy Line Down')} />
          <MenuItem label="Move Line Up" shortcut="Alt+UpArrow" onClick={() => handleAction('Move Line Up')} />
          <MenuItem label="Move Line Down" shortcut="Alt+DownArrow" onClick={() => handleAction('Move Line Down')} />
          <MenuItem label="Duplicate Selection" onClick={() => handleAction('Duplicate Selection')} />
          <MenuItem divider />
          <MenuItem label="Add Cursor Above" shortcut="Ctrl+Alt+UpArrow" onClick={() => handleAction('Add Cursor Above')} />
          <MenuItem label="Add Cursor Below" shortcut="Ctrl+Alt+DownArrow" onClick={() => handleAction('Add Cursor Below')} />
          <MenuItem label="Add Cursors to Line Ends" shortcut="Shift+Alt+I" onClick={() => handleAction('Add Cursors to Line Ends')} />
          <MenuItem label="Add Next Occurrence" shortcut="Ctrl+D" onClick={() => handleAction('Add Next Occurrence')} />
          <MenuItem label="Add Previous Occurrence" onClick={() => handleAction('Add Previous Occurrence')} />
          <MenuItem label="Select All Occurrences" onClick={() => handleAction('Select All Occurrences')} />
          <MenuItem divider />
          <MenuItem label="Switch to Ctrl+Click for Multi-Cursor" onClick={() => handleAction('Switch to Ctrl+Click for Multi-Cursor')} />
          <MenuItem label="Column Selection Mode" onClick={() => handleAction('Column Selection Mode')} />
        </div>
      );
    }
    if (activeMenu === 'View') {
      return (
        <div className="absolute top-full left-36 mt-0 py-1 w-64 bg-[#252526] border border-[#3c3c3c] shadow-lg rounded-md z-50">
          <MenuItem label="Command Palette..." shortcut="Ctrl+Shift+P" onClick={() => handleAction('Command Palette')} />
          <MenuItem label="Open View..." onClick={() => handleAction('Open View')} />
          <MenuItem divider />
          <MenuItem label="Appearance" shortcut=">" onClick={() => handleAction('Appearance')} />
          <MenuItem label="Editor Layout" shortcut=">" onClick={() => handleAction('Editor Layout')} />
          <MenuItem divider />
          <MenuItem label="Explorer" shortcut="Ctrl+Shift+E" onClick={() => handleAction('Explorer')} />
          <MenuItem label="Search" shortcut="Ctrl+Shift+F" onClick={() => handleAction('Search')} />
          <MenuItem label="Source Control" shortcut="Ctrl+Shift+G" onClick={() => handleAction('Source Control')} />
          <MenuItem label="Run" shortcut="Ctrl+Shift+D" onClick={() => handleAction('Run View')} />
          <MenuItem label="Extensions" shortcut="Ctrl+Shift+X" onClick={() => handleAction('Extensions')} />
          <MenuItem label="Testing" onClick={() => handleAction('Testing')} />
          <MenuItem divider />
          <MenuItem label="Problems" shortcut="Ctrl+Shift+M" onClick={() => handleAction('Problems')} />
          <MenuItem label="Output" shortcut="Ctrl+Shift+U" onClick={() => handleAction('Output')} />
          <MenuItem label="Debug Console" shortcut="Ctrl+Shift+Y" onClick={() => handleAction('Debug Console')} />
          <MenuItem label="Terminal" shortcut="Ctrl+`" onClick={() => handleAction('Terminal')} />
          <MenuItem divider />
          <MenuItem label="Word Wrap" shortcut="Alt+Z" onClick={() => handleAction('Word Wrap')} />
        </div>
      );
    }
    if (activeMenu === 'Go') {
      return (
        <div className="absolute top-full left-[190px] mt-0 py-1 w-[320px] bg-[#252526] border border-[#3c3c3c] shadow-lg rounded-md z-50">
          <MenuItem label="Back" shortcut="Alt+LeftArrow" onClick={() => handleAction('Back')} />
          <MenuItem label="Forward" shortcut="Alt+RightArrow" onClick={() => handleAction('Forward')} />
          <MenuItem label="Last Edit Location" shortcut="Ctrl+K Ctrl+Q" onClick={() => handleAction('Last Edit Location')} />
          <MenuItem divider />
          <MenuItem label="Switch Editor" shortcut=">" onClick={() => handleAction('Switch Editor')} />
          <MenuItem label="Switch Group" shortcut=">" onClick={() => handleAction('Switch Group')} />
          <MenuItem divider />
          <MenuItem label="Go to File..." shortcut="Ctrl+P" onClick={() => handleAction('Go to File')} />
          <MenuItem label="Go to Symbol in Workspace..." shortcut="Ctrl+T" onClick={() => handleAction('Go to Symbol in Workspace')} />
          <MenuItem divider />
          <MenuItem label="Go to Symbol in Editor..." shortcut="Ctrl+Shift+O" onClick={() => handleAction('Go to Symbol in Editor')} />
          <MenuItem label="Go to Definition" shortcut="F12" onClick={() => handleAction('Go to Definition')} />
          <MenuItem label="Go to Declaration" onClick={() => handleAction('Go to Declaration')} />
          <MenuItem label="Go to Type Definition" onClick={() => handleAction('Go to Type Definition')} />
          <MenuItem label="Go to Implementations" shortcut="Ctrl+F12" onClick={() => handleAction('Go to Implementations')} />
          <MenuItem label="Go to References" shortcut="Shift+F12" onClick={() => handleAction('Go to References')} />
          <MenuItem divider />
          <MenuItem label="Go to Line/Column..." shortcut="Ctrl+G" onClick={() => handleAction('Go to Line')} />
          <MenuItem label="Go to Bracket" shortcut="Ctrl+Shift+\\" onClick={() => handleAction('Go to Bracket')} />
          <MenuItem divider />
          <MenuItem label="Next Problem" shortcut="F8" onClick={() => handleAction('Next Problem')} />
          <MenuItem label="Previous Problem" shortcut="Shift+F8" onClick={() => handleAction('Previous Problem')} />
          <MenuItem divider />
          <MenuItem label="Next Change" shortcut="Alt+F3" onClick={() => handleAction('Next Change')} />
          <MenuItem label="Previous Change" shortcut="Shift+Alt+F3" onClick={() => handleAction('Previous Change')} />
        </div>
      );
    }
    if (activeMenu === 'Run') {
      return (
        <div className="absolute top-full left-[220px] mt-0 py-1 w-72 bg-[#252526] border border-[#3c3c3c] shadow-lg rounded-md z-50">
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
        <div className="absolute top-full left-[260px] mt-0 py-1 w-72 bg-[#252526] border border-[#3c3c3c] shadow-lg rounded-md z-50">
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
        <div className="absolute top-full left-[320px] mt-0 py-1 w-64 bg-[#252526] border border-[#3c3c3c] shadow-lg rounded-md z-50">
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
    return null;
  };

  const navItems: MenuState[] = ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'];

  return (
    <div ref={menuRef} className="flex h-8 shrink-0 items-center bg-[#181818] px-2 text-[13px] text-[#cccccc] relative font-sans border-b border-[#2b2b2b]">
      {navItems.map((item) => (
        <div 
          key={item}
          className={`px-2 py-1 cursor-pointer rounded-md mx-0.5 ${activeMenu === item ? 'bg-[#3c3c3c] text-white' : 'hover:bg-white/10 hover:text-white'}`}
          onClick={() => setActiveMenu(activeMenu === item ? null : item)}
          onMouseEnter={() => handleHover(item)}
        >
          {item}
        </div>
      ))}
      {renderDropdown()}
    </div>
  );
}
