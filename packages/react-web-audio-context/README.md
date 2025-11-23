# @janwirth/react-web-audio-context

React hooks and utilities for managing Web Audio API context and audio buffer loading.

## Installation

```bash
bun add @janwirth/react-web-audio-context
```

## Features

- **AudioContextProvider**: React context provider for managing AudioContext lifecycle
- **useAudioContext**: Hook to access the AudioContext instance
- **useAudioBuffer**: Hook for loading and caching audio buffers
- **loadAudioBuffer**: Function for loading audio buffers with deduplication
- **queueAudioTask**: Queue audio tasks to prevent browser overload
- **useQueuedTask**: Hook for queuing async tasks

## Usage

### Basic Setup

```tsx
import { AudioContextProvider, useAudioContext, useAudioBuffer } from '@janwirth/react-web-audio-context';

function App() {
  return (
    <AudioContextProvider>
      <YourComponent />
    </AudioContextProvider>
  );
}

function YourComponent() {
  const audioContext = useAudioContext();
  const { audioBuffer, loading, error } = useAudioBuffer('https://example.com/audio.mp3');
  
  // Use audioBuffer...
}
```

### Loading Audio Buffers

```tsx
import { loadAudioBuffer, useAudioContext } from '@janwirth/react-web-audio-context';

function MyComponent() {
  const audioContext = useAudioContext();
  
  useEffect(() => {
    loadAudioBuffer(audioContext, 'https://example.com/audio.mp3')
      .then(buffer => {
        // Use buffer...
      });
  }, [audioContext]);
}
```

### Queuing Audio Tasks

```tsx
import { queueAudioTask, useAudioContext } from '@janwirth/react-web-audio-context';

function MyComponent() {
  const audioContext = useAudioContext();
  
  const processAudio = async () => {
    await queueAudioTask(audioContext, async (ctx) => {
      // Your audio processing code here
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      return buffer;
    });
  };
}
```

## API

### AudioContextProvider

React context provider that manages AudioContext lifecycle.

### useAudioContext()

Hook that returns the AudioContext instance. Must be used within AudioContextProvider.

### useAudioBuffer(audioUrl: string | null)

Hook for loading audio buffers with automatic caching and deduplication.

**Returns:**
- `audioBuffer`: AudioBuffer | null
- `loading`: boolean
- `error`: string | null

### loadAudioBuffer(audioContext: AudioContext, audioUrl: string)

Function for loading audio buffers. Multiple requests for the same URL share the same promise.

**Returns:** Promise<AudioBuffer>

### queueAudioTask<T>(audioContext: AudioContext, task: (ctx: AudioContext) => Promise<T>)

Queue an audio task for sequential execution to prevent browser overload.

**Returns:** Promise<T>

### useQueuedTask<T>(task: () => Promise<T>, options?: { queueId?: string })

Hook for queuing async tasks with abort support.

**Returns:** Status<T> (loading | success | error)

## License

MIT

