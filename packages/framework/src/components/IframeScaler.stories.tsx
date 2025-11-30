import type { Meta, StoryObj } from '@storybook/react';
import { IframeScaler } from '@/fixture-viewer-app/IframeScaler';
import { Column } from '@/components/Column';
import { Row } from '@/components/Row';

const meta = {
  title: 'Components/IframeScaler',
  component: IframeScaler,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof IframeScaler>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    src: 'https://example.com',
    targetWidth: 400,
    targetHeight: 300,
    zoom: 1,
  },
};

export const ScaledDown: Story = {
  args: {
    src: 'https://example.com',
    targetWidth: 200,
    targetHeight: 150,
    zoom: 0.5,
  },
};

export const ScaledUp: Story = {
  args: {
    src: 'https://example.com',
    targetWidth: 600,
    targetHeight: 400,
    zoom: 1.5,
  },
};

export const MultipleScalers: Story = {
  render: () => (
    <Column className="gap-8 p-8">
      <Row className="gap-4">
        <Column className="gap-2">
          <div className="text-sm font-mono">Zoom 0.2</div>
          <IframeScaler
            src="https://example.com"
            targetWidth={200}
            targetHeight={150}
            zoom={0.2}
          />
        </Column>
        <Column className="gap-2">
          <div className="text-sm font-mono">Zoom 0.5</div>
          <IframeScaler
            src="https://example.com"
            targetWidth={200}
            targetHeight={150}
            zoom={0.5}
          />
        </Column>
        <Column className="gap-2">
          <div className="text-sm font-mono">Zoom 1.0</div>
          <IframeScaler
            src="https://example.com"
            targetWidth={200}
            targetHeight={150}
            zoom={1.0}
          />
        </Column>
      </Row>
    </Column>
  ),
};


