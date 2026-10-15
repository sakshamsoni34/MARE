import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  FilePlus,
  FolderPlus,
  RefreshCw,
  ListCollapse,
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Edit2,
  Trash2,
  Code
} from 'lucide-react';
import { useStore, FileSystemNode } from '@/store/useStore';
import { openWorkspaceFolder } from '@/lib/workspace';

export default function Explorer() {
  const router = useRouter();
  const { status } = useSession();
  const { fileSystem, createFile, createFolder, toggleFolder, expandFolder, collapseAllFolders, renameNode, deleteNode, selectedFolderId, setSelectedFolderId, activeProject, setEditorCode, addOpenAgent, updateAgentScript } = useStore();
  const [contextMenuInfo, setContextMenuInfo] = useState<{ x: number, y: number, nodeId: string } | null>(null);
  const [creatingItem, setCreatingItem] = useState<{ type: 'file' | 'folder', parentId: string | null } | null>(null);
  const [isExplorerExpanded, setIsExplorerExpanded] = useState(true);

  React.useEffect(() => {
    const handleClick = () => setContextMenuInfo(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const guessAgentName = (content: string | undefined): string => {
    if (!content) return 'Researcher Agent';
    const match = content.match(/#\s+([a-zA-Z\s]+Agent)\s+(?:Script|Response)/i);
    if (match && match[1]) {
      // Normalize capitalization
      const words = match[1].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      return words.join(' ');
    }
    return 'Researcher Agent';
  };

  const handleNewItem = (type: 'file' | 'folder') => {
    setIsExplorerExpanded(true);
    if (selectedFolderId) expandFolder(selectedFolderId);
    setCreatingItem({ type, parentId: selectedFolderId });
  };

  const handleNewFile = (e: React.MouseEvent) => { e.stopPropagation(); handleNewItem('file'); };
  const handleNewFolder = (e: React.MouseEvent) => { e.stopPropagation(); handleNewItem('folder'); };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFolderId(null);
  };

  const handleCollapseAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    collapseAllFolders();
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
          className={`flex items-center justify-between py-1 px-2 cursor-pointer transition-colors text-sm group
            ${isSelected ? 'bg-brand-500/20 text-brand-400' : 'text-text-secondary hover:bg-[var(--color-bg-tertiary)] hover:text-text-primary'}`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedFolderId(node.id);
            toggleFolder(node.id); // Toggle both folders and files
            if (!isFolder) {
              setEditorCode(node.content || '');
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSelectedFolderId(node.id);
            setContextMenuInfo({ x: e.pageX, y: e.pageY, nodeId: node.id });
          }}
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            {isFolder || (node.agentContents && Object.keys(node.agentContents).length > 0) || node.agentName || node.content ? (
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

          {isFolder && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  expandFolder(node.id);
                  setSelectedFolderId(node.id);
                  setCreatingItem({ type: 'file', parentId: node.id });
                }}
                className="p-1 hover:bg-[#3c3c3c] rounded text-text-tertiary hover:text-text-primary transition-colors"
                title="New File"
              >
                <FilePlus size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  expandFolder(node.id);
                  setSelectedFolderId(node.id);
                  setCreatingItem({ type: 'folder', parentId: node.id });
                }}
                className="p-1 hover:bg-[#3c3c3c] rounded text-text-tertiary hover:text-text-primary transition-colors"
                title="New Folder"
              >
                <FolderPlus size={14} />
              </button>
              <button onClick={handleRefresh} className="p-1 hover:bg-[#3c3c3c] rounded text-text-tertiary hover:text-text-primary transition-colors" title="Refresh">
                <RefreshCw size={14} />
              </button>
              <button onClick={handleCollapseAll} className="p-1 hover:bg-[#3c3c3c] rounded text-text-tertiary hover:text-text-primary transition-colors" title="Collapse Folders">
                <ListCollapse size={14} />
              </button>
            </div>
          )}
        </div>

        {!isFolder && node.isOpen && (() => {
          if (node.agentContents && Object.keys(node.agentContents).length > 0) {
            return Object.entries(node.agentContents).map(([agent, scriptContent]) => (
              <div
                key={agent}
                className="flex items-center gap-2 text-xs text-brand-400 cursor-pointer hover:bg-[var(--color-bg-tertiary)] py-1.5 px-2 transition-colors border-l-2 border-brand-500/50 mt-1 mb-1"
                style={{ marginLeft: `${depth * 12 + 16}px` }}
                onClick={(e) => {
                  e.stopPropagation();
                  addOpenAgent(agent as any);
                  updateAgentScript(agent, scriptContent);
                }}
                title={`Open Script in ${agent}`}
              >
                <Code size={12} />
                <span>{agent}</span>
              </div>
            ));
          }

          const fallbackAgent = node.agentName || guessAgentName(node.content);
          return (
            <div
              className="flex items-center gap-2 text-xs text-brand-400 cursor-pointer hover:bg-[var(--color-bg-tertiary)] py-1.5 px-2 transition-colors border-l-2 border-brand-500/50 mt-1 mb-1"
              style={{ marginLeft: `${depth * 12 + 16}px` }}
              onClick={(e) => {
                e.stopPropagation();
                addOpenAgent(fallbackAgent as any);
                if (node.content) {
                  updateAgentScript(fallbackAgent, node.content);
                }
              }}
              title="Open Script in Agent"
            >
              <Code size={12} />
              <span>{fallbackAgent}</span>
            </div>
          );
        })()}

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
      <div
        className="flex items-center justify-between p-2 hover:bg-[var(--color-bg-tertiary)] cursor-pointer transition-colors group relative"
        onClick={() => setIsExplorerExpanded(!isExplorerExpanded)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContextMenuInfo({ x: e.pageX, y: e.pageY, nodeId: 'ROOT' });
        }}
      >
        <div className="flex items-center gap-1 overflow-hidden">
          <span className="text-text-tertiary shrink-0">
            {isExplorerExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
          <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider truncate">
            {activeProject ? activeProject : 'NO FOLDER OPEN'}
          </span>
        </div>
        {!activeProject && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openWorkspaceFolder({
                status,
                onRequireAuth: () => useStore.getState().setSignInModalOpen(true),
                onSuccess: () => router.push('/dashboard')
              });
            }}
            className="p-1 hover:bg-[#3c3c3c] rounded text-text-tertiary hover:text-brand-300 transition-colors"
            title="Open Folder"
          >
            <FolderOpen size={14} />
          </button>
        )}
        {activeProject && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleNewFile} className="p-1 hover:bg-[#3c3c3c] rounded text-text-tertiary hover:text-text-primary transition-colors" title="New File">
              <FilePlus size={15} />
            </button>
            <button onClick={handleNewFolder} className="p-1 hover:bg-[#3c3c3c] rounded text-text-tertiary hover:text-text-primary transition-colors" title="New Folder">
              <FolderPlus size={15} />
            </button>
            <button onClick={handleRefresh} className="p-1 hover:bg-[#3c3c3c] rounded text-text-tertiary hover:text-text-primary transition-colors" title="Refresh">
              <RefreshCw size={15} />
            </button>
            <button onClick={handleCollapseAll} className="p-1 hover:bg-[#3c3c3c] rounded text-text-tertiary hover:text-text-primary transition-colors" title="Collapse Folders">
              <ListCollapse size={15} />
            </button>
          </div>
        )}
      </div>

      {isExplorerExpanded && (
        <div
          className="flex-1 overflow-y-auto custom-scrollbar pb-6"
          onClick={(e) => {
            // If clicked in the empty space, deselect the node
            if (e.target === e.currentTarget) {
              setSelectedFolderId(null);
            }
          }}
        >
          {activeProject ? (
            <>
              {renderInput(null, 0)}
              {fileSystem.length === 0 ? (
                <div className="p-4 text-xs text-text-tertiary text-center">Empty folder</div>
              ) : (
                fileSystem.map(node => renderNode(node, 0))
              )}
            </>
          ) : null}
        </div>
      )}

      {contextMenuInfo && (
        <div
          className="fixed z-[100] w-48 rounded-md border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] shadow-xl py-1 overflow-hidden"
          style={{ top: contextMenuInfo.y, left: contextMenuInfo.x }}
        >
          {contextMenuInfo.nodeId !== 'ROOT' && (
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
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (contextMenuInfo.nodeId === 'ROOT') {
                useStore.getState().setActiveProject('');
                useStore.getState().setFileSystem([]);
              } else {
                deleteNode(contextMenuInfo.nodeId);
                if (selectedFolderId === contextMenuInfo.nodeId) {
                  setSelectedFolderId(null);
                }
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
