import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useMemo, useEffect } from "react";
import { Column } from "@/components/Column";
import { Row } from "@/components/Row";
import { ColorPicker } from "@/components/inputs/ColorPicker";
import { generateOklchPalette } from "@/components/waveform";
import type { ColorPalette } from "@/components/waveform";
import { useColorScheme } from "@/hooks/useColorScheme";

const STORAGE_KEY_PREFIX = "basic-elements-story-";

// Default values for OKLCH color picker
const DEFAULT_HUE = 240;
const DEFAULT_SATURATION = 0.2;
const DEFAULT_HUE_SPREAD = 60;
const DEFAULT_CONTRAST = 0;
const DEFAULT_LIGHTNESS = 0.5;

// Helper functions for localStorage
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
    if (stored !== null) {
      return JSON.parse(stored) as T;
    }
  } catch (e) {
    console.warn(`Failed to load ${key} from localStorage:`, e);
  }
  return defaultValue;
};

const saveToStorage = <T,>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage:`, e);
  }
};

// Basic text component
function Text({
  children,
  style,
  className = "",
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={`text-base font-mono ${className}`} style={style}>
      {children}
    </div>
  );
}

// Small text component
function SmallText({
  children,
  style,
  className = "",
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={`text-xs font-mono ${className}`} style={style}>
      {children}
    </div>
  );
}

// Button component (text with underline on hover)
function Button({
  children,
  onClick,
  style,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`self-start text-left text-base font-mono cursor-pointer transition-all hover:underline ${className} `}
      style={style}
    >
      {children}
    </button>
  );
}

function BasicElementsStory() {
  const { isDark } = useColorScheme();

  // Load initial values from localStorage or use defaults
  const [hue, setHue] = useState(() => loadFromStorage("hue", DEFAULT_HUE));
  const [saturation, setSaturation] = useState(() =>
    loadFromStorage("saturation", DEFAULT_SATURATION)
  );
  const [hueSpread, setHueSpread] = useState(() =>
    loadFromStorage("hueSpread", DEFAULT_HUE_SPREAD)
  );
  const [contrast, setContrast] = useState(() =>
    loadFromStorage("contrast", DEFAULT_CONTRAST)
  );
  const [lightness, setLightness] = useState(() =>
    loadFromStorage("lightness", DEFAULT_LIGHTNESS)
  );

  // Save to localStorage whenever values change
  useEffect(() => {
    saveToStorage("hue", hue);
  }, [hue]);

  useEffect(() => {
    saveToStorage("saturation", saturation);
  }, [saturation]);

  useEffect(() => {
    saveToStorage("hueSpread", hueSpread);
  }, [hueSpread]);

  useEffect(() => {
    saveToStorage("contrast", contrast);
  }, [contrast]);

  useEffect(() => {
    saveToStorage("lightness", lightness);
  }, [lightness]);

  // Generate custom OKLCH palette
  // In dark mode, invert the contrast value for the custom palette
  const colorPalette = useMemo<ColorPalette>(
    () =>
      generateOklchPalette(
        hue,
        saturation,
        hueSpread,
        isDark ? -contrast : contrast,
        lightness
      ),
    [hue, saturation, hueSpread, contrast, lightness, isDark]
  );

  // Extract text color from palette
  // lowFrequency: primary text (highest contrast)
  // midFrequency: buttons (medium contrast)
  // highFrequency: small text (lowest contrast - highest lightness)
  const textColor = colorPalette.lowFrequency;
  const buttonColor = colorPalette.midFrequency;
  const smallTextColor = colorPalette.highFrequency;

  return (
    <Column className="h-full w-full p-8 gap-6" style={{ height: "100vh" }}>
      <div className="mb-4">
        <h1 className="text-xl font-bold mb-2 text-black dark:text-white">
          Basic Elements Story
        </h1>
        <p className="text-sm opacity-70 text-gray-600 dark:text-gray-400">
          Text, SmallText, Button components with OKLCH color theming
        </p>
      </div>

      {/* Color Picker Controls */}
      <div className="flex flex-row items-end gap-8">
        <ColorPicker
          hue={hue}
          saturation={saturation}
          hueSpread={hueSpread}
          contrast={contrast}
          lightness={lightness}
          onHueChange={setHue}
          onSaturationChange={setSaturation}
          onHueSpreadChange={setHueSpread}
          onContrastChange={setContrast}
          onLightnessChange={setLightness}
        />
      </div>

      {/* Example Compositions */}
      <div className="flex-1 flex flex-col gap-6" style={{ minHeight: 0 }}>
        {/* Row Composition */}
        <Row className="gap-4">
          <Column className="gap-2">
            <Text style={{ color: textColor }}>Primary Text</Text>
            <SmallText style={{ color: smallTextColor }}>
              Secondary small text
            </SmallText>
            <Button
              style={{ color: buttonColor }}
              onClick={() => alert("Button clicked!")}
            >
              Click me
            </Button>
          </Column>
          <Column className="gap-2">
            <Text style={{ color: textColor }}>
              Another column with text content
            </Text>
            <SmallText style={{ color: smallTextColor }}>
              Small text description
            </SmallText>
            <Button
              style={{ color: buttonColor }}
              onClick={() => console.log("Action triggered")}
            >
              Action button
            </Button>
          </Column>
        </Row>

        {/* Nested Column Composition */}
        <Column className="gap-4">
          <Text style={{ color: textColor }}>Section Title</Text>
          <Row className="gap-4">
            <Column className="gap-2">
              <SmallText style={{ color: smallTextColor }}>
                Item 1 description
              </SmallText>
              <Button style={{ color: buttonColor }} onClick={() => {}}>
                View details
              </Button>
            </Column>
            <Column className="gap-2">
              <SmallText style={{ color: smallTextColor }}>
                Item 2 description
              </SmallText>
              <Button style={{ color: buttonColor }} onClick={() => {}}>
                View details
              </Button>
            </Column>
            <Column className="gap-2">
              <SmallText style={{ color: smallTextColor }}>
                Item 3 description
              </SmallText>
              <Button style={{ color: buttonColor }} onClick={() => {}}>
                View details
              </Button>
            </Column>
          </Row>
        </Column>

        {/* Complex Nested Composition */}
        <Column className="gap-3">
          <Text style={{ color: textColor }}>Complex Layout Example</Text>
          <Row className="gap-6">
            <Column className="gap-3">
              <SmallText style={{ color: smallTextColor }}>
                Left section
              </SmallText>
              <Button style={{ color: buttonColor }} onClick={() => {}}>
                Left action
              </Button>
            </Column>
            <Column className="gap-3">
              <SmallText style={{ color: smallTextColor }}>
                Middle section
              </SmallText>
              <Row className="gap-2">
                <Button style={{ color: buttonColor }} onClick={() => {}}>
                  Action A
                </Button>
                <Button style={{ color: buttonColor }} onClick={() => {}}>
                  Action B
                </Button>
              </Row>
            </Column>
            <Column className="gap-3">
              <SmallText style={{ color: smallTextColor }}>
                Right section
              </SmallText>
              <Button style={{ color: buttonColor }} onClick={() => {}}>
                Right action
              </Button>
            </Column>
          </Row>
        </Column>

        {/* Simple List Composition */}
        <Column className="gap-2">
          <Text style={{ color: textColor }}>List Items</Text>
          <Row className="gap-4">
            <SmallText style={{ color: smallTextColor }}>Item one</SmallText>
            <Button style={{ color: buttonColor }} onClick={() => {}}>
              Edit
            </Button>
          </Row>
          <Row className="gap-4">
            <SmallText style={{ color: smallTextColor }}>Item two</SmallText>
            <Button style={{ color: buttonColor }} onClick={() => {}}>
              Edit
            </Button>
          </Row>
          <Row className="gap-4">
            <SmallText style={{ color: smallTextColor }}>Item three</SmallText>
            <Button style={{ color: buttonColor }} onClick={() => {}}>
              Edit
            </Button>
          </Row>
        </Column>
      </div>
    </Column>
  );
}

const meta = {
  title: "FixtureViewer/BasicElementsStory",
  component: BasicElementsStory,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof BasicElementsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
