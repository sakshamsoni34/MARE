import { useStore, FileSystemNode } from '@/store/useStore';

export const readDirectoryRecursive = async (dirHandle: any, parentId: string = ''): Promise<FileSystemNode[]> => {
  const nodes: FileSystemNode[] = [];
  const IGNORED = ['node_modules', '.git', '.next', '.vscode', 'dist', 'build', '__pycache__', '.pytest_cache'];

  for await (const entry of dirHandle.values()) {
    if (IGNORED.includes(entry.name)) continue;

    const id = parentId ? `${parentId}/${entry.name}` : entry.name;
    if (entry.kind === 'directory') {
      const children = await readDirectoryRecursive(entry, id);
      nodes.push({
        id,
        name: entry.name,
        type: 'folder',
        isOpen: false,
        children
      });
    } else {
      let content = '';
      try {
        const file = await entry.getFile();
        // Load text for reasonably sized files (< 500KB)
        if (file.size < 500000) {
          content = await file.text();
        }
      } catch (e) {
        content = '';
      }
      nodes.push({
        id,
        name: entry.name,
        type: 'file',
        content
      });
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
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
  if (status !== 'authenticated') {
    onRequireAuth();
    return;
  }

  try {
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      const folderName = dirHandle.name;
      const children = await readDirectoryRecursive(dirHandle);

      useStore.getState().setFileSystem(children);
      useStore.getState().setActiveProject(folderName);
      useStore.getState().addTerminalLog(`> <span class="text-green-400">Success:</span> Loaded workspace [${folderName}]`);

      // Notify backend of folder selection
      fetch('http://localhost:8555/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'Open Folder', folderName })
      }).catch(() => {});

      if (onSuccess) {
        onSuccess(folderName);
      }
    } else {
      // Browser fallback using input webkitdirectory
      const input = document.createElement('input');
      input.type = 'file';
      (input as any).webkitdirectory = true;
      input.onchange = async (e: any) => {
        const files: FileList = e.target.files;
        if (!files || files.length === 0) return;

        const firstPath = files[0].webkitRelativePath || files[0].name;
        const folderName = firstPath.split('/')[0] || 'Workspace';

        const fileNodes: FileSystemNode[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const parts = file.webkitRelativePath.split('/').slice(1);
          if (parts.length === 0) continue;

          let currentLevel = fileNodes;
          let currentPath = '';

          for (let p = 0; p < parts.length; p++) {
            const part = parts[p];
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            const isFile = p === parts.length - 1;

            if (isFile) {
              let content = '';
              try {
                if (file.size < 500000) content = await file.text();
              } catch (_) {}
              currentLevel.push({ id: currentPath, name: part, type: 'file', content });
            } else {
              let existingFolder = currentLevel.find(n => n.name === part && n.type === 'folder');
              if (!existingFolder) {
                existingFolder = { id: currentPath, name: part, type: 'folder', isOpen: false, children: [] };
                currentLevel.push(existingFolder);
              }
              currentLevel = existingFolder.children!;
            }
          }
        }

        useStore.getState().setFileSystem(fileNodes);
        useStore.getState().setActiveProject(folderName);
        useStore.getState().addTerminalLog(`> <span class="text-green-400">Success:</span> Loaded workspace [${folderName}]`);

        fetch('http://localhost:8555/api/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'Open Folder', folderName })
        }).catch(() => {});

        if (onSuccess) {
          onSuccess(folderName);
        }
      };
      input.click();
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') return;
    console.error('Failed to open folder:', err);
    useStore.getState().addTerminalLog(`> <span class="text-red-400">Error:</span> Failed to open folder`);
  }
};
