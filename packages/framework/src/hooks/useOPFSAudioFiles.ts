import { useState, useEffect, useCallback, useRef } from "react";

export interface OPFSAudioFile {
  id: string;
  name: string;
  size: number;
  type: string;
  opfsPath: string;
}

async function getOPFSRoot(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root;
}

async function storeFileInOPFS(
  file: File,
  root: FileSystemDirectoryHandle
): Promise<string> {
  const fileName = `${Date.now()}-${file.name}`;
  const fileHandle = await root.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(file);
  await writable.close();
  return fileName;
}

async function getFileFromOPFS(
  fileName: string,
  root: FileSystemDirectoryHandle
): Promise<File> {
  const fileHandle = await root.getFileHandle(fileName);
  return await fileHandle.getFile();
}

async function listOPFSFiles(
  root: FileSystemDirectoryHandle
): Promise<OPFSAudioFile[]> {
  const files: OPFSAudioFile[] = [];
  for await (const [name, handle] of root.entries()) {
    if (handle.kind === "file") {
      const file = await handle.getFile();
      files.push({
        id: name,
        name: name.replace(/^\d+-/, ""),
        size: file.size,
        type: file.type,
        opfsPath: name,
      });
    }
  }
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

async function deleteFileFromOPFS(
  fileName: string,
  root: FileSystemDirectoryHandle
): Promise<void> {
  await root.removeEntry(fileName);
}

export function useOPFSAudioFiles() {
  const [files, setFiles] = useState<OPFSAudioFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<FileSystemDirectoryHandle | null>(null);

  const loadFiles = useCallback(async () => {
    try {
      if (!rootRef.current) {
        rootRef.current = await getOPFSRoot();
      }
      const storedFiles = await listOPFSFiles(rootRef.current);
      setFiles(storedFiles);
    } catch (err) {
      console.error("Error loading files:", err);
      setError(err instanceof Error ? err.message : "Failed to load files");
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const addFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!rootRef.current) {
          rootRef.current = await getOPFSRoot();
        }

        await storeFileInOPFS(file, rootRef.current);
        await loadFiles();
      } catch (err) {
        console.error("Error storing file:", err);
        setError(err instanceof Error ? err.message : "Failed to store file");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [loadFiles]
  );

  const addFileByName = useCallback(
    async (fileName: string) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!rootRef.current) {
          rootRef.current = await getOPFSRoot();
        }

        const file = await getFileFromOPFS(fileName, rootRef.current);
        // Re-store it to ensure it's in the list
        await storeFileInOPFS(file, rootRef.current);
        await loadFiles();
      } catch (err) {
        console.error("Error storing file by name:", err);
        setError(
          err instanceof Error ? err.message : "Failed to store file by name"
        );
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [loadFiles]
  );

  const deleteFile = useCallback(
    async (fileName: string) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!rootRef.current) {
          rootRef.current = await getOPFSRoot();
        }

        await deleteFileFromOPFS(fileName, rootRef.current);
        await loadFiles();
      } catch (err) {
        console.error("Error deleting file:", err);
        setError(err instanceof Error ? err.message : "Failed to delete file");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [loadFiles]
  );

  const getFile = useCallback(
    async (fileName: string): Promise<File> => {
      if (!rootRef.current) {
        rootRef.current = await getOPFSRoot();
      }
      return await getFileFromOPFS(fileName, rootRef.current);
    },
    []
  );

  return {
    files,
    isLoading,
    error,
    addFile,
    addFileByName,
    deleteFile,
    getFile,
    refresh: loadFiles,
  };
}

