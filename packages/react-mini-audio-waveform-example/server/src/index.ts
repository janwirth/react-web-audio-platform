import { serve } from "bun";
import { join } from "path";

// Hardcoded list of three audio items
const audioItems = [
  {
    id: "1",
    title: "Sample Track 1",
    audioUrl: "/audio/track1.mp3",
  },
  {
    id: "2",
    title: "Sample Track 2",
    audioUrl: "/audio/track2.mp3",
  },
  {
    id: "3",
    title: "Sample Track 3",
    audioUrl: "/audio/track3.mp3",
  },
];

// CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url);

    // Handle preflight OPTIONS requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // API endpoint to get the list of audio items
    if (url.pathname === "/api/audio-items") {
      return new Response(JSON.stringify(audioItems), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Serve audio files from the public/audio directory
    if (url.pathname.startsWith("/audio/")) {
      // Resolve path relative to server directory
      // import.meta.dir points to the directory containing this file (src/)
      // so we need to go up one level to get to the server root
      const serverDir = import.meta.dir
        ? join(import.meta.dir, "..")
        : process.cwd();
      const audioPath = join(serverDir, "public", url.pathname);
      try {
        const file = Bun.file(audioPath);
        if (await file.exists()) {
          return new Response(file, {
            headers: {
              "Content-Type": "audio/mpeg",
              ...corsHeaders,
            },
          });
        }
      } catch (error) {
        console.error("Error serving audio file:", error);
      }
      // Return 404 with CORS headers
      return new Response("Audio file not found", {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Return 404 with CORS headers
    return new Response("Not found", {
      status: 404,
      headers: corsHeaders,
    });
  },
});

console.log("Server running on http://localhost:3001");
