# @janwirth/react-web-audio-platform

Monorepo for React Web Audio libraries and components.

## Workspaces

This monorepo contains the following packages:

### [@janwirth/react-web-audio-context](./packages/react-web-audio-context)

React hooks and utilities for managing Web Audio API context and audio buffer loading.

**Features:**
- AudioContextProvider for managing AudioContext lifecycle
- useAudioContext hook
- useAudioBuffer hook with caching
- Audio task queuing to prevent browser overload

### [@janwirth/react-mini-audio-waveform](./packages/react-mini-audio-waveform)

A React component for rendering beautiful, spectral audio waveforms with customizable color palettes.

**Features:**
- Customizable color palettes (including OKLCH support)
- Spectral frequency visualization
- Click interaction support
- Render data caching
- Responsive and resizable

### [@janwirth/react-mini-audio-waveform-example](./packages/react-mini-audio-waveform-example)

Example application demonstrating the usage of the waveform component.

## Setup

Install dependencies:

```bash
bun install
```

## Development

Run the example app:

```bash
bun run dev
```

This will start:
- API server on `http://localhost:3001`
- Vite dev server on `http://localhost:3002`

## Building

Build all packages:

```bash
bun run build
```

This will:
1. Run `prebuild` scripts (clean dist folders)
2. Build all packages in dependency order

## Publishing

All packages are configured with `"publishConfig": { "access": "public" }` for public npm publishing.

To publish a package:

```bash
cd packages/<package-name>
bun run build
npm publish
```

## Project Structure

```
.
├── packages/
│   ├── react-web-audio-context/      # Audio context utilities
│   ├── react-mini-audio-waveform/    # Waveform component
│   └── react-mini-audio-waveform-example/  # Example app
├── package.json                       # Root package.json with workspaces
└── README.md                          # This file
```

## License

MIT
