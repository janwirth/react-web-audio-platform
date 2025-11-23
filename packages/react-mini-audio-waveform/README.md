# @janwirth/react-mini-audio-waveform

A React component for rendering beautiful, spectral audio waveforms with customizable color palettes.

## Installation

```bash
bun add @janwirth/react-mini-audio-waveform @janwirth/react-web-audio-context
```

## Features

- 🎨 Customizable color palettes (including OKLCH support)
- 📊 Spectral frequency visualization (low/mid/high frequencies)
- 🎯 Click interaction support
- 💾 Render data caching
- 📱 Responsive and resizable
- ⚡ Optimized performance with quantization

## Usage

### Basic Example

```tsx
import { AudioContextProvider } from '@janwirth/react-web-audio-context';
import { Waveform } from '@janwirth/react-mini-audio-waveform';

function App() {
  return (
    <AudioContextProvider>
      <Waveform
        audioUrl="https://example.com/audio.mp3"
        height={32}
      />
    </AudioContextProvider>
  );
}
```

### With Custom Palette

```tsx
import { Waveform, generateOklchPalette } from '@janwirth/react-mini-audio-waveform';

function MyComponent() {
  const customPalette = generateOklchPalette(240, 0.2, 60, 0.4);
  
  return (
    <Waveform
      audioUrl="https://example.com/audio.mp3"
      colorPalette={customPalette}
      height={48}
      onClickAtPercentage={(percentage) => {
        console.log(`Clicked at ${percentage * 100}%`);
      }}
    />
  );
}
```

### With Cached Render Data

```tsx
import { Waveform, WaveformRenderData } from '@janwirth/react-mini-audio-waveform';

function MyComponent() {
  const [cachedData, setCachedData] = useState<WaveformRenderData | null>(null);
  
  return (
    <Waveform
      audioUrl="https://example.com/audio.mp3"
      cachedRenderData={cachedData}
      onGotData={(data) => {
        // Cache the render data
        localStorage.setItem('waveform-data', JSON.stringify(data));
        setCachedData(data);
      }}
    />
  );
}
```

## Props

### Waveform

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `audioUrl` | `string` | **required** | URL of the audio file to visualize |
| `height` | `number` | `32` | Height of the waveform in pixels |
| `colorPalette` | `Partial<ColorPalette>` | - | Custom color palette |
| `normalizationConfig` | `Partial<NormalizationConfig>` | - | Normalization configuration |
| `cachedRenderData` | `WaveformRenderData \| null` | - | Pre-computed render data for faster rendering |
| `onGotData` | `(data: WaveformRenderData) => void` | - | Callback when render data is computed |
| `onClickAtPercentage` | `(percentage: number) => void` | - | Callback when waveform is clicked (0-1) |

## Color Palettes

### Predefined Palettes

```tsx
import { getColorPalette } from '@janwirth/react-mini-audio-waveform';

const palette = getColorPalette('monochrome-dark');
// Available: 'classic', 'vibrant', 'dark', 'neon', 'pastel', 
//           'monochrome', 'monochrome-dark', 'monochrome-light', etc.
```

### OKLCH Palette Generation

```tsx
import { generateOklchPalette } from '@janwirth/react-mini-audio-waveform';

const palette = generateOklchPalette(
  240,    // hue (0-360)
  0.2,    // saturation (0-0.4)
  60,     // hue spread (0-180)
  0.4     // contrast (0-1)
);
```

## Types

### WaveformRenderData

```tsx
interface WaveformRenderData {
  waveformData: number[];
  spectralData: SpectralData[];
}
```

### ColorPalette

```tsx
interface ColorPalette {
  background: string;
  lowFrequency: string;
  midFrequency: string;
  highFrequency: string;
  centerLine: string;
}
```

### NormalizationConfig

```tsx
interface NormalizationConfig {
  constraints: Array<[percentile: number, targetAmplitude: number]>;
}
```

## License

MIT

