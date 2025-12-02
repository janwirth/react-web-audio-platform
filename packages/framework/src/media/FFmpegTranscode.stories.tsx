import type { Meta, StoryObj } from "@storybook/react";
import { useState, useRef } from "react";
import { Column } from "@/ui/Column";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

function FFmpegTranscode() {
  const [loaded, setLoaded] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);

  const load = async () => {
    const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";
    const ffmpeg = ffmpegRef.current;

    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) {
        messageRef.current.innerHTML = message;
      }
      console.log(message);
    });

    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.js`,
        "text/javascript"
      ),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });

    setLoaded(true);
  };

  const transcode = async () => {
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile(
      "input.webm",
      await fetchFile(
        "https://raw.githubusercontent.com/ffmpegwasm/testdata/master/Big_Buck_Bunny_180_10s.webm"
      )
    );
    await ffmpeg.exec(["-i", "input.webm", "output.mp4"]);
    const data = await ffmpeg.readFile("output.mp4");

    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" })
      );
    }
  };

  return (
    <Column className="h-full w-full p-8 gap-4" style={{ height: "100vh" }}>
      <div className="mb-4">
        <h1 className="text-xl font-bold mb-2 text-black dark:text-white">
          FFmpeg Transcode
        </h1>
        <p className="text-sm opacity-70 text-gray-600 dark:text-gray-400">
          Transcode webm to mp4 video using FFmpeg.wasm
        </p>
      </div>

      {loaded ? (
        <>
          <video
            ref={videoRef}
            controls
            className="w-full max-w-2xl border border-gray-300 dark:border-gray-700"
          />
          <button
            onClick={transcode}
            className="px-4 py-2 font-mono text-sm hover:opacity-60 transition-opacity bg-black text-white dark:bg-white dark:text-black"
          >
            Transcode webm to mp4
          </button>
          <p
            ref={messageRef}
            className="text-xs font-mono opacity-70 text-gray-600 dark:text-gray-400 whitespace-pre-wrap"
          ></p>
          <p className="text-xs font-mono opacity-50 text-gray-500 dark:text-gray-500">
            Open Developer Tools (Ctrl+Shift+I / Cmd+Option+I) to View Logs
          </p>
        </>
      ) : (
        <button
          onClick={load}
          className="px-4 py-2 font-mono text-sm hover:opacity-60 transition-opacity bg-black text-white dark:bg-white dark:text-black"
        >
          Load ffmpeg-core (~31 MB)
        </button>
      )}
    </Column>
  );
}

const meta = {
  title: "Stories/Media/FFmpegTranscode",
  component: FFmpegTranscode,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FFmpegTranscode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

