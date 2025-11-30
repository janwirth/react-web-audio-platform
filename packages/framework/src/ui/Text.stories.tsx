import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Column } from '@/components/Column';
import { Row } from '@/components/Row';
import { useColorScheme } from '@/hooks/useColorScheme';

// Basic text component
function Text({
  children,
  style,
  className = '',
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
  className = '',
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

const meta = {
  title: 'Components/Text',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicText: Story = {
  render: () => {
    const { isDark } = useColorScheme();
    const textColor = isDark ? '#ffffff' : '#000000';
    
    return (
      <Column className="h-full w-full p-8 gap-6" style={{ height: '100vh' }}>
        <div className="text-lg font-mono font-bold">Text Components</div>
        <Column className="gap-4">
          <Text style={{ color: textColor }}>Primary Text</Text>
          <SmallText style={{ color: textColor, opacity: 0.7 }}>
            Small Text
          </SmallText>
        </Column>
      </Column>
    );
  },
};

export const TextVariations: Story = {
  render: () => {
    const { isDark } = useColorScheme();
    const textColor = isDark ? '#ffffff' : '#000000';
    
    return (
      <Column className="h-full w-full p-8 gap-6" style={{ height: '100vh' }}>
        <div className="text-lg font-mono font-bold">Text Variations</div>
        <Column className="gap-6">
          <Column className="gap-2">
            <Text style={{ color: textColor }}>Regular Text</Text>
            <SmallText style={{ color: textColor, opacity: 0.7 }}>
              Small text description
            </SmallText>
          </Column>
          <Column className="gap-2">
            <Text style={{ color: textColor, fontWeight: 'bold' }}>
              Bold Text
            </Text>
            <SmallText style={{ color: textColor, opacity: 0.6 }}>
              Small text with lower opacity
            </SmallText>
          </Column>
          <Column className="gap-2">
            <Text style={{ color: textColor, opacity: 0.8 }}>
              Text with opacity
            </Text>
            <SmallText style={{ color: textColor, opacity: 0.5 }}>
              Very subtle small text
            </SmallText>
          </Column>
        </Column>
      </Column>
    );
  },
};

export const TextInLayouts: Story = {
  render: () => {
    const { isDark } = useColorScheme();
    const textColor = isDark ? '#ffffff' : '#000000';
    
    return (
      <Column className="h-full w-full p-8 gap-6" style={{ height: '100vh' }}>
        <div className="text-lg font-mono font-bold">Text in Layouts</div>
        <Row className="gap-4">
          <Column className="gap-2 flex-1">
            <Text style={{ color: textColor }}>Column 1 Title</Text>
            <SmallText style={{ color: textColor, opacity: 0.7 }}>
              Column 1 description text
            </SmallText>
          </Column>
          <Column className="gap-2 flex-1">
            <Text style={{ color: textColor }}>Column 2 Title</Text>
            <SmallText style={{ color: textColor, opacity: 0.7 }}>
              Column 2 description text
            </SmallText>
          </Column>
          <Column className="gap-2 flex-1">
            <Text style={{ color: textColor }}>Column 3 Title</Text>
            <SmallText style={{ color: textColor, opacity: 0.7 }}>
              Column 3 description text
            </SmallText>
          </Column>
        </Row>
        <Column className="gap-4">
          <Text style={{ color: textColor }}>Section Title</Text>
          <Row className="gap-4">
            <SmallText style={{ color: textColor, opacity: 0.7 }}>
              Item 1
            </SmallText>
            <SmallText style={{ color: textColor, opacity: 0.7 }}>
              Item 2
            </SmallText>
            <SmallText style={{ color: textColor, opacity: 0.7 }}>
              Item 3
            </SmallText>
          </Row>
        </Column>
      </Column>
    );
  },
};

export const TextCompositions: Story = {
  render: () => {
    const { isDark } = useColorScheme();
    const textColor = isDark ? '#ffffff' : '#000000';
    
    return (
      <Column className="h-full w-full p-8 gap-6" style={{ height: '100vh' }}>
        <div className="text-lg font-mono font-bold">Text Compositions</div>
        <Column className="gap-6 flex-1" style={{ minHeight: 0 }}>
          <Row className="gap-4">
            <Column className="gap-2 flex-1">
              <Text style={{ color: textColor }}>Primary Text</Text>
              <SmallText style={{ color: textColor, opacity: 0.7 }}>
                Secondary small text
              </SmallText>
            </Column>
            <Column className="gap-2 flex-1">
              <Text style={{ color: textColor }}>
                Another column with text content
              </Text>
              <SmallText style={{ color: textColor, opacity: 0.7 }}>
                Small text description
              </SmallText>
            </Column>
          </Row>
          <Column className="gap-4">
            <Text style={{ color: textColor }}>Section Title</Text>
            <Row className="gap-4">
              <Column className="gap-2 flex-1">
                <SmallText style={{ color: textColor, opacity: 0.7 }}>
                  Item 1 description
                </SmallText>
              </Column>
              <Column className="gap-2 flex-1">
                <SmallText style={{ color: textColor, opacity: 0.7 }}>
                  Item 2 description
                </SmallText>
              </Column>
              <Column className="gap-2 flex-1">
                <SmallText style={{ color: textColor, opacity: 0.7 }}>
                  Item 3 description
                </SmallText>
              </Column>
            </Row>
          </Column>
          <Column className="gap-2">
            <Text style={{ color: textColor }}>List Items</Text>
            <Row className="gap-4">
              <SmallText style={{ color: textColor, opacity: 0.7 }}>
                Item one
              </SmallText>
            </Row>
            <Row className="gap-4">
              <SmallText style={{ color: textColor, opacity: 0.7 }}>
                Item two
              </SmallText>
            </Row>
            <Row className="gap-4">
              <SmallText style={{ color: textColor, opacity: 0.7 }}>
                Item three
              </SmallText>
            </Row>
          </Column>
        </Column>
      </Column>
    );
  },
};




