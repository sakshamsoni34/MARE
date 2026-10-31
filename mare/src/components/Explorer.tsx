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
  const { 
    fileSystem, 
    createFile, 
    createFolder, 
    toggleFolder, 
    expandFolder, 
    collapseAllFolders, 
    renameNode, 
    deleteNode, 
    selectedFolderId, 
    setSelectedFolderId, 
    activeProject, 
    setEditorCode, 
    addOpenAgent, 
    updateAgentScript 
  } = useStore();
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
      const words = match[1].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      return words.join(' ');
    }
    return 'Researcher Agent';
  };

  const findNode = (nodes: FileSystemNode[], id: string): FileSystemNode | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const findParentFolder = (nodes: FileSystemNode[], childId: string, parentId: string | null = null): string | null => {
    for (const node of nodes) {
      if (node.id === childId) return parentId;
      if (node.children) {
        const found = findParentFolder(node.children, childId, node.id);
        if (found !== null) return found;
      }
    }
    return null;
  };

  const handleNewItem = (type: 'file' | 'folder') => {
    setIsExplorerExpanded(true);
    let targetParent: string | null = selectedFolderId;
    if (targetParent) {
      const found = findNode(fileSystem, targetParent);
      if (found && found.type === 'file') {
        targetParent = findParentFolder(fileSystem, targetParent);
      }
    } else if (fileSystem.length === 1 && fileSystem[0].type === 'folder') {
      targetParent = fileSystem[0].id;
    }
    if (targetParent) expandFolder(targetParent);
    setCreatingItem({ type, parentId: targetParent });
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
      <div 
        className="flex items-center gap-1.5 py-1 px-2 text-sm bg-brand-500/15 border-l-2 border-brand-400 my-0.5 rounded-r"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="w-[14px] shrink-0" />
        <span className="shrink-0">
          {creatingItem.type === 'folder' ? (
            <Folder size={14} className="text-amber-400" />
          ) : (
            <File size={14} className="text-sky-400" />
          )}
        </span>
        <input
          autoFocus
          placeholder={creatingItem.type === 'file' ? 'filename.py (Press Enter)' : 'folder-name (Press Enter)'}
          className="bg-[#242424] text-white border border-brand-500/60 outline-none px-2 py-0.5 w-full text-xs rounded font-mono shadow-inner focus:border-brand-400"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = e.currentTarget.value.trim();
              if (val) {
                if (creatingItem.type === 'file') {
                  createFile(parentId, val);
                } else {
                  createFolder(parentId, val);
                }
              }
              setCreatingItem(null);
            } else if (e.key === 'Escape') {
              setCreatingItem(null);
            }
          }}
          onBlur={(e) => {
            const val = e.currentTarget.value.trim();
            if (val) {
              if (creatingItem.type === 'file') {
                createFile(parentId, val);
              } else {
                createFolder(parentId, val);
              }
            }
            setCreatingItem(null);
          }}
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
            toggleFolder(node.id);
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
              <span className="w-[14px] shrink-0" />
            )}

            <span className={isFolder ? 'text-amber-400' : 'text-text-secondary'}>
              {isFolder ? (
                node.isOpen ? <FolderOpen size={14} className="text-amber-400/90" /> : <Folder size={14} className="text-amber-400/70" />
              ) : (
                <File size={14} className="text-sky-400/70" />
              )}
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
            {node.children && node.children.length > 0 ? (
              node.children.map(child => renderNode(child, depth + 1))
            ) : (
              <div 
                className="py-1 px-2 text-xs text-text-tertiary/70 italic select-none" 
                style={{ paddingLeft: `${(depth + 1) * 12 + 16}px` }}
              >
                (empty folder)
              </div>
            )}
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
            if (e.target === e.currentTarget) {
              setSelectedFolderId(null);
            }
          }}
        >
          {activeProject ? (
            <div className="flex flex-col min-h-full">
              {/* Always render root-level input when creating item at root */}
              {renderInput(null, 0)}

              {fileSystem.length === 0 && !creatingItem ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-text-tertiary gap-3 select-none">
                  <p className="text-xs">No files in "{activeProject}".</p>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNewItem('file');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-white/10 hover:bg-white/20 transition-all border border-white/10 shadow-sm"
                    >
                      + New File
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNewItem('folder');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-white/10 hover:bg-white/20 transition-all border border-white/10 shadow-sm"
                    >
                      + New Folder
                    </button>
                  </div>
                </div>
              ) : (
                fileSystem.map(node => renderNode(node, 0))
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-text-tertiary h-48 gap-3 select-none">
              <FolderOpen size={30} className="text-brand-400/60" />
              <p className="text-xs">No folder open in workspace.</p>
              <button
                onClick={() => openWorkspaceFolder({
                  status,
                  onRequireAuth: () => useStore.getState().setSignInModalOpen(true),
                  onSuccess: () => router.push('/dashboard')
                })}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 transition-colors shadow-sm"
              >
                Open Folder
              </button>
            </div>
          )}
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
