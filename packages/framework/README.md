# @janwirth/react-mini-audio-waveform-example

Example application demonstrating the usage of `@janwirth/react-mini-audio-waveform` and `@janwirth/react-web-audio-context`.

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

Open `http://localhost:3002` in your browser.

## Adding Audio Files

Place your audio files (MP3 format) in `server/public/audio/` and update the `audioItems` array in `server/src/index.ts`.

## Build

Build for production:

```bash
bun run build
```

The build process will automatically build dependencies (`@janwirth/react-web-audio-context` and `@janwirth/react-mini-audio-waveform`) before building the example app.

Preview production build:

```bash
bun run preview
```

## Features Demonstrated

- Multiple waveform visualizations with different color palettes
- Custom OKLCH color palette generation
- Render data caching
- Click interaction handling
- Responsive waveform rendering

## License

MIT

