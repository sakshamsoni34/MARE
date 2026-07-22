import React, { useState } from 'react';
import { 
  FilePlus, 
  FolderPlus, 
  RefreshCw, 
  ListCollapse, 
  ChevronRight, 
  ChevronDown,
  File,
  Folder,
  Edit2,
  Trash2
} from 'lucide-react';
import { useStore, FileSystemNode } from '@/store/useStore';

export default function Explorer() {
  const { fileSystem, createFile, createFolder, toggleFolder, expandFolder, collapseAllFolders, renameNode, deleteNode, selectedFolderId, setSelectedFolderId } = useStore();
  const [contextMenuInfo, setContextMenuInfo] = useState<{ x: number, y: number, nodeId: string } | null>(null);
  const [creatingItem, setCreatingItem] = useState<{ type: 'file' | 'folder', parentId: string | null } | null>(null);

  React.useEffect(() => {
    const handleClick = () => setContextMenuInfo(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleNewItem = (type: 'file' | 'folder') => {
    if (selectedFolderId) expandFolder(selectedFolderId);
    setCreatingItem({ type, parentId: selectedFolderId });
  };

  const handleNewFile = () => handleNewItem('file');
  const handleNewFolder = () => handleNewItem('folder');

  const handleRefresh = () => {
    // For now, this just re-renders since we don't have a real backend to fetch from.
    // In a real app, you'd fetch the file system from the server here.
    setSelectedFolderId(null);
  };

  const renderInput = (parentId: string | null, depth: number) => {
    if (creatingItem?.parentId !== parentId) return null;
    return (
      <div className="flex items-center gap-1.5 py-1 px-2 text-sm" style={{ paddingLeft: `${depth * 12 + 8}px` }}>
        <span className="w-[14px] shrink-0" />
        <span className="text-text-secondary">
          {creatingItem.type === 'folder' ? <Folder size={14} /> : <File size={14} />}
        </span>
        <input
          autoFocus
          className="bg-[#3c3c3c] text-[#cccccc] border border-[#0078d4] outline-none px-1 w-full text-sm rounded-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = e.currentTarget.value.trim();
              if (val) {
                if (creatingItem.type === 'file') createFile(parentId, val);
                else createFolder(parentId, val);
              }
              setCreatingItem(null);
            } else if (e.key === 'Escape') {
              setCreatingItem(null);
            }
          }}
          onBlur={() => setCreatingItem(null)}
        />
      </div>
    );
  };

  const renderNode = (node: FileSystemNode, depth: number = 0) => {
    const isSelected = selectedFolderId === node.id;
    const isFolder = node.type === 'folder';

    return (
      <div key={node.id} data-node-id={node.id}>
        <div 
          className={`flex items-center gap-1.5 py-1 px-2 cursor-pointer transition-colors text-sm
            ${isSelected ? 'bg-brand-500/20 text-brand-400' : 'text-text-secondary hover:bg-[var(--color-bg-tertiary)] hover:text-text-primary'}`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedFolderId(node.id);
            if (isFolder) {
              toggleFolder(node.id);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSelectedFolderId(node.id);
            setContextMenuInfo({ x: e.pageX, y: e.pageY, nodeId: node.id });
          }}
        >
          {isFolder ? (
            <span className="text-text-tertiary shrink-0">
              {node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          ) : (
            <span className="w-[14px] shrink-0" /> // Spacer for alignment
          )}
          
          <span className={isFolder ? 'text-text-tertiary' : 'text-text-secondary'}>
            {isFolder ? <Folder size={14} /> : <File size={14} />}
          </span>
          <span className="truncate">{node.name}</span>
        </div>
        
        {isFolder && node.isOpen && (
          <div className="flex flex-col">
            {renderInput(node.id, depth + 1)}
            {node.children && node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 shrink-0 border-r border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] flex flex-col h-full select-none">
      <div className="flex items-center justify-between p-3 pb-2 group">
        <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          Explorer
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleNewFile} className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded text-text-tertiary hover:text-text-primary transition-colors" title="New File">
            <FilePlus size={14} />
          </button>
          <button onClick={handleNewFolder} className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded text-text-tertiary hover:text-text-primary transition-colors" title="New Folder">
            <FolderPlus size={14} />
          </button>
          <button onClick={handleRefresh} className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded text-text-tertiary hover:text-text-primary transition-colors" title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button onClick={collapseAllFolders} className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded text-text-tertiary hover:text-text-primary transition-colors" title="Collapse Folders">
            <ListCollapse size={14} />
          </button>
        </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto custom-scrollbar pb-6"
        onClick={(e) => {
          // If clicked in the empty space, deselect the node
          if (e.target === e.currentTarget) {
            setSelectedFolderId(null);
          }
        }}
      >
        {renderInput(null, 0)}
        {fileSystem.map(node => renderNode(node, 0))}
      </div>

      {contextMenuInfo && (
        <div 
          className="fixed z-[100] w-48 rounded-md border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] shadow-xl py-1 overflow-hidden"
          style={{ top: contextMenuInfo.y, left: contextMenuInfo.x }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              const nodeToRename = document.querySelector(`[data-node-id="${contextMenuInfo.nodeId}"]`)?.textContent;
              const newName = window.prompt('Enter new name:', nodeToRename || '');
              if (newName && newName.trim()) {
                renameNode(contextMenuInfo.nodeId, newName.trim());
              }
              setContextMenuInfo(null);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-[var(--color-bg-tertiary)] transition-colors text-left"
          >
            <Edit2 size={14} /> Rename
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(contextMenuInfo.nodeId);
              if (selectedFolderId === contextMenuInfo.nodeId) {
                setSelectedFolderId(null);
              }
              setContextMenuInfo(null);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-accent-red hover:bg-[var(--color-bg-tertiary)] transition-colors text-left"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </aside>
  );
}
