# Pretty Waveform

A standalone waveform visualization project with spectral analysis.

## Setup

Install dependencies:

```bash
bun install
```

## Development

Run both the API server and Vite dev server:

```bash
bun run dev
```

This will start:
- API server on `http://localhost:3001`
- Vite dev server on `http://localhost:3002`

Open `http://localhost:3002/pretty-waveform.html` in your browser.

## Adding Audio Files

Place your audio files (MP3 format) in `server/public/audio/` and update the `audioItems` array in `server/src/index.ts`.

## Build

Build for production:

```bash
bun run build
```

Preview production build:

```bash
bun run preview
```

