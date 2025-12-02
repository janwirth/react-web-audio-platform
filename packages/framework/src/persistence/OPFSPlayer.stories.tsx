import type { Meta, StoryObj } from "@storybook/react";
import { useState, useCallback } from "react";
import { Column } from "@/ui/Column";
import { useSetAtom } from "jotai";
import {
  Player,
  PlayerUI,
  Queue,
  queueAtom,
  currentQueueIndexAtom,
  type QueueItem,
} from "@/media/player";
import { AudioContextProvider } from "@/media/audio-context";
import {
  useOPFSAudioFiles,
  type OPFSAudioFile,
} from "@/hooks/useOPFSAudioFiles";

function OPFSPlayerStory() {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setQueue = useSetAtom(queueAtom);
  const setCurrentQueueIndex = useSetAtom(currentQueueIndexAtom);

  const {
    files,
    isLoading,
    error: opfsError,
    addFile,
    deleteFile,
    getFile,
  } = useOPFSAudioFiles();

  // Combine OPFS errors with local errors
  const displayError = error || opfsError;

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setError(null);

      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("audio/")
      );

      if (droppedFiles.length === 0) {
        setError("No audio files found");
        return;
      }

      try {
        for (const file of droppedFiles) {
          await addFile(file);
        }
      } catch (err) {
        console.error("Error storing files:", err);
        setError(err instanceof Error ? err.message : "Failed to store files");
      }
    },
    [addFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handlePlayFile = useCallback(
    async (file: OPFSAudioFile) => {
      try {
        const opfsFile = await getFile(file.opfsPath);
        const url = URL.createObjectURL(opfsFile);

        const queueItem: QueueItem = {
          id: file.id,
          title: file.name,
          coverUrl: null,
          audioUrl: url,
        };

        setQueue([queueItem]);
        setCurrentQueueIndex(0);
      } catch (err) {
        console.error("Error playing file:", err);
        setError(err instanceof Error ? err.message : "Failed to play file");
      }
    },
    [getFile, setQueue, setCurrentQueueIndex]
  );

  const handleDeleteFile = useCallback(
    async (file: OPFSAudioFile) => {
      try {
        await deleteFile(file.opfsPath);
      } catch (err) {
        console.error("Error deleting file:", err);
        setError(err instanceof Error ? err.message : "Failed to delete file");
      }
    },
    [deleteFile]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <Player>
      <AudioContextProvider>
        <Column className="h-full w-full p-8 gap-6" style={{ height: "100vh" }}>
          <div className="mb-4">
            <h1 className="text-xl font-bold mb-2 text-black dark:text-white font-mono">
              OPFS Audio Player
            </h1>
            <p className="text-sm opacity-70 text-gray-600 dark:text-gray-400 font-mono">
              Drop audio files to store them in OPFS and play them
            </p>
          </div>

          {displayError && (
            <div className="p-4 border border-red-500 text-red-500 text-sm font-mono">
              {displayError}
            </div>
          )}

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed p-12 text-center transition-opacity font-mono ${
              isDragging
                ? "border-black dark:border-white opacity-60"
                : "border-gray-400 dark:border-gray-600 opacity-40"
            } hover:opacity-60`}
          >
            {isLoading ? (
              <div className="text-black dark:text-white">Storing files...</div>
            ) : (
              <div className="text-black dark:text-white">
                Drop audio files here
              </div>
            )}
          </div>

          <div className="w-full">
            <h2 className="text-sm font-bold mb-2 text-black dark:text-white font-mono">
              Player Controls
            </h2>
            <PlayerUI />
          </div>

          <Column
            className="flex-1 flex flex-col gap-4"
            style={{ minHeight: 0 }}
          >
            <h2 className="text-sm font-bold text-black dark:text-white font-mono">
              Stored Files ({files.length})
            </h2>
            <div className="flex-1 overflow-y-auto">
              {files.length === 0 ? (
                <div className="text-sm opacity-70 text-gray-600 dark:text-gray-400 font-mono text-center py-8">
                  No files stored yet. Drop audio files above.
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border border-gray-300 dark:border-gray-700 hover:opacity-60 transition-opacity font-mono"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-black dark:text-white truncate">
                          {file.name}
                        </div>
                        <div className="text-xs opacity-70 text-gray-600 dark:text-gray-400">
                          {formatFileSize(file.size)} • {file.type || "audio"} •{" "}
                          {file.canPlay === ""
                            ? "not supported"
                            : file.canPlay === "maybe"
                            ? "maybe supported"
                            : "supported"}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handlePlayFile(file)}
                          disabled={file.canPlay === ""}
                          className="px-3 py-1 text-xs border border-black dark:border-white text-black dark:text-white hover:opacity-60 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Play
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file)}
                          className="px-3 py-1 text-xs border border-gray-500 dark:border-gray-500 text-gray-600 dark:text-gray-400 hover:opacity-60 transition-opacity"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Column>
          <Column>
            <Queue></Queue>
          </Column>
        </Column>
      </AudioContextProvider>
    </Player>
  );
}

const meta = {
  title: "Stories/Persistence/OPFSPlayer",
  component: OPFSPlayerStory,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof OPFSPlayerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
