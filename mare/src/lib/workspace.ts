import { useStore, FileSystemNode } from '@/store/useStore';
import { sendEventApi } from '@/lib/api';

const IGNORED = new Set([
  'node_modules', '.git', '.next', '.vscode', 'dist', 'build', 
  '__pycache__', '.pytest_cache', '.turbo', '.cache', '.output',
  '.yarn', '.idea'
]);

export const readDirectoryRecursive = async (
  dirHandle: any, 
  parentId: string = '', 
  currentDepth: number = 0
): Promise<FileSystemNode[]> => {
  if (currentDepth > 6) return []; // Guard against infinite directory recursion

  const nodes: FileSystemNode[] = [];

  try {
    for await (const entry of dirHandle.values()) {
      if (IGNORED.has(entry.name) || entry.name.startsWith('.')) continue;

      const id = parentId ? `${parentId}/${entry.name}` : entry.name;
      if (entry.kind === 'directory') {
        const children = await readDirectoryRecursive(entry, id, currentDepth + 1);
        nodes.push({
          id,
          name: entry.name,
          type: 'folder',
          isOpen: currentDepth === 0, // open first level by default
          children
        });
      } else {
        let content = '';
        try {
          // Read content for text/code files (< 200KB)
          const file = await entry.getFile();
          if (file.size < 200000) {
            content = await file.text();
          }
        } catch (_) {}

        nodes.push({
          id,
          name: entry.name,
          type: 'file',
          content
        });
      }
    }
  } catch (err) {
    console.warn(`Error reading directory [${parentId}]:`, err);
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
};

const processFileList = async (
  files: FileList, 
  onSuccess?: (folderName: string) => void,
  fallbackFolderName: string = 'Workspace'
) => {
  let folderName = fallbackFolderName;
  if (files && files.length > 0) {
    const firstPath = files[0].webkitRelativePath || files[0].name;
    if (firstPath && firstPath.includes('/')) {
      folderName = firstPath.split('/')[0] || fallbackFolderName;
    }
  }

  const fileNodes: FileSystemNode[] = [];

  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pathParts = file.webkitRelativePath.split('/');
      if (pathParts.some(part => IGNORED.has(part))) continue;

      const parts = pathParts.slice(1);
      if (parts.length === 0) continue;

      let currentLevel = fileNodes;
      let currentPath = folderName;

      for (let p = 0; p < parts.length; p++) {
        const part = parts[p];
        currentPath = `${currentPath}/${part}`;
        const isFile = p === parts.length - 1;

        if (isFile) {
          let content = '';
          try {
            if (file.size < 200000) {
              content = await file.text();
            }
          } catch (_) {}
          currentLevel.push({ id: currentPath, name: part, type: 'file', content });
        } else {
          let existingFolder = currentLevel.find(n => n.name === part && n.type === 'folder');
          if (!existingFolder) {
            existingFolder = { 
              id: currentPath, 
              name: part, 
              type: 'folder', 
              isOpen: p === 0, 
              children: [] 
            };
            currentLevel.push(existingFolder);
          }
          currentLevel = existingFolder.children!;
        }
      }
    }
  }

  const rootFolderNode: FileSystemNode = {
    id: folderName,
    name: folderName,
    type: 'folder',
    isOpen: true,
    children: fileNodes
  };

  useStore.getState().setFileSystem([rootFolderNode]);
  useStore.getState().setActiveProject(folderName);
  useStore.getState().addTerminalLog(`> <span class="text-green-400">Success:</span> Loaded workspace [${folderName}]`);

  sendEventApi('Open Folder', folderName).catch(() => {});

  if (onSuccess) {
    onSuccess(folderName);
  }
};

const triggerFileInputFallback = (onSuccess?: (folderName: string) => void) => {
  const input = document.createElement('input');
  input.type = 'file';
  (input as any).webkitdirectory = true;
  (input as any).directory = true;
  input.multiple = true;
  input.style.display = 'none';
  document.body.appendChild(input);

  input.onchange = async (e: any) => {
    try {
      const files: FileList = e.target.files;
      let folderName = 'Workspace';

      if (input.value) {
        const parts = input.value.split(/[\\/]/);
        const last = parts[parts.length - 1];
        if (last && last.toLowerCase() !== 'fakepath') {
          folderName = last;
        }
      }

      await processFileList(files, onSuccess, folderName);
    } catch (err) {
      console.error('Error processing directory input:', err);
    } finally {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    }
  };

  input.oncancel = () => {
    if (document.body.contains(input)) {
      document.body.removeChild(input);
    }
  };

  input.click();
};

interface OpenFolderOptions {
  status: string;
  onRequireAuth: () => void;
  onSuccess?: (folderName: string) => void;
}

export const openWorkspaceFolder = async ({
  status,
  onRequireAuth,
  onSuccess
}: OpenFolderOptions) => {
  // If window.showDirectoryPicker is available (Chrome / Edge), attempt native picker first
  if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
    try {
      // Standard call without unsupported mode options
      const dirHandle = await (window as any).showDirectoryPicker();
      const folderName = dirHandle.name;
      const children = await readDirectoryRecursive(dirHandle, folderName);

      const rootFolderNode: FileSystemNode = {
        id: folderName,
        name: folderName,
        type: 'folder',
        isOpen: true,
        children: children
      };

      useStore.getState().setFileSystem([rootFolderNode]);
      useStore.getState().setActiveProject(folderName);
      useStore.getState().addTerminalLog(`> <span class="text-green-400">Success:</span> Loaded workspace [${folderName}]`);

      sendEventApi('Open Folder', folderName).catch(() => {});

      if (onSuccess) {
        onSuccess(folderName);
      }
      return;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // User deliberately cancelled directory selection
        return;
      }
      console.warn('Native showDirectoryPicker failed or blocked by browser shields, activating file input fallback:', err);
      // Fall through to universal input webkitdirectory fallback
    }
  }

  // Universal fallback for Brave, Firefox, Safari, and sandboxed environments
  triggerFileInputFallback(onSuccess);
};
