/**
 * Audio loading and decoding utilities
 */

// AudioContext will be created on demand (requires user interaction)
let audioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Decode audio file from URL
 */
export async function decodeAudioFile(
  audioUrl: string,
  audioContext?: AudioContext
): Promise<AudioBuffer> {
  // Validate audioUrl
  if (!audioUrl || typeof audioUrl !== "string") {
    throw new Error(`Invalid audio URL: ${audioUrl}`);
  }

  // Fetch audio file
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch audio: ${response.status} ${response.statusText}`
    );
  }

  // Check Content-Type header
  const contentType = response.headers.get("Content-Type");
  const urlLower = audioUrl.toLowerCase();
  const hasAudioExtension =
    urlLower.endsWith(".mp3") ||
    urlLower.endsWith(".wav") ||
    urlLower.endsWith(".ogg") ||
    urlLower.endsWith(".m4a") ||
    urlLower.endsWith(".aac") ||
    urlLower.endsWith(".flac") ||
    urlLower.endsWith(".webm");

  // Warn if Content-Type is missing or not audio-related
  if (!contentType || (!contentType.startsWith("audio/") && !hasAudioExtension)) {
    console.warn(
      `Audio URL may have incorrect Content-Type: "${contentType || "missing"}" for ${audioUrl}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  // Check if we got actual data
  if (arrayBuffer.byteLength === 0) {
    throw new Error("Audio file is empty");
  }

  // Decode audio data (use provided context or create on demand)
  const ctx = audioContext || getAudioContext();
  
  try {
    return await ctx.decodeAudioData(arrayBuffer);
  } catch (error) {
    // Provide more helpful error message
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const formatHint = contentType
      ? `Content-Type: ${contentType}`
      : hasAudioExtension
      ? `File extension suggests audio format`
      : "Unknown format";
    
    throw new Error(
      `Failed to decode audio data: ${errorMessage}. ${formatHint}. ` +
        `File size: ${arrayBuffer.byteLength} bytes. ` +
        `URL: ${audioUrl}`
    );
  }
}

