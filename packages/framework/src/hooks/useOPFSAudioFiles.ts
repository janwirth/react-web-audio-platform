import { useState, useEffect, useCallback, useRef } from "react";

export interface OPFSAudioFile {
  id: string;
  name: string;
  size: number;
  /** MIME type of the audio file (e.g., "audio/mpeg", "audio/wav") */
  type: string;
  opfsPath: string;
  /** Playability status: "" = not supported, "maybe" = might be supported, "probably" = likely supported */
  canPlay: "" | "maybe" | "probably";
}

function inferMimeTypeFromExtension(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  const mimeTypes: Record<string, string> = {
    mp3: "audio/mpeg",
    mpeg: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    opus: "audio/opus",
    flac: "audio/flac",
    aac: "audio/aac",
    m4a: "audio/mp4",
    mp4: "audio/mp4",
    webm: "audio/webm",
    weba: "audio/webm",
  };
  return mimeTypes[extension] || "audio/mpeg";
}

function checkPlayability(mimeType: string): "" | "maybe" | "probably" {
  // Create a temporary audio element to check playability
  // This matches the logic used in Player.tsx
  const audio = document.createElement("audio");
  const canPlay = audio.canPlayType(mimeType);
  // canPlayType returns: "" (not supported), "maybe" (might be supported), "probably" (likely supported)
  return (canPlay as "" | "maybe" | "probably") || "";
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
  // @ts-expect-error - entries() exists at runtime but TypeScript types may be incomplete
  for await (const [name, handle] of root.entries()) {
    if (handle.kind === "file") {
      const file = await handle.getFile();
      const mimeType =
        file.type || inferMimeTypeFromExtension(name.replace(/^\d+-/, ""));
      const canPlay = checkPlayability(mimeType);
      files.push({
        id: name,
        name: name.replace(/^\d+-/, ""),
        size: file.size,
        type: mimeType,
        opfsPath: name,
        canPlay,
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

  const getFile = useCallback(async (fileName: string): Promise<File> => {
    if (!rootRef.current) {
      rootRef.current = await getOPFSRoot();
    }
    return await getFileFromOPFS(fileName, rootRef.current);
  }, []);

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
