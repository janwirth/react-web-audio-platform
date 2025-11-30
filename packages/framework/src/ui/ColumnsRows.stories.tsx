import type { Meta, StoryObj } from '@storybook/react';
import { Column } from '@/components/Column';
import { Row } from '@/components/Row';

const meta = {
  title: 'Components/ColumnsRows',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicLayout: Story = {
  render: () => (
    <Column className="h-full w-full p-8 gap-4" style={{ height: '100vh' }}>
      <div className="text-lg font-mono font-bold">Basic Column Layout</div>
      <Column className="gap-2">
        <div className="p-4 border border-black dark:border-white">Item 1</div>
        <div className="p-4 border border-black dark:border-white">Item 2</div>
        <div className="p-4 border border-black dark:border-white">Item 3</div>
      </Column>
    </Column>
  ),
};

export const BasicRowLayout: Story = {
  render: () => (
    <Column className="h-full w-full p-8 gap-4" style={{ height: '100vh' }}>
      <div className="text-lg font-mono font-bold">Basic Row Layout</div>
      <Row className="gap-2">
        <div className="p-4 border border-black dark:border-white">Item 1</div>
        <div className="p-4 border border-black dark:border-white">Item 2</div>
        <div className="p-4 border border-black dark:border-white">Item 3</div>
      </Row>
    </Column>
  ),
};

export const NestedLayout: Story = {
  render: () => (
    <Column className="h-full w-full p-8 gap-4" style={{ height: '100vh' }}>
      <div className="text-lg font-mono font-bold">Nested Layout</div>
      <Row className="gap-4 flex-1" style={{ minHeight: 0 }}>
        <Column className="gap-2 flex-1">
          <div className="p-4 border border-black dark:border-white flex-1">
            Left Column
          </div>
          <div className="p-4 border border-black dark:border-white">
            Bottom Left
          </div>
        </Column>
        <Column className="gap-2 flex-1">
          <Row className="gap-2 flex-1">
            <div className="p-4 border border-black dark:border-white flex-1">
              Top Right 1
            </div>
            <div className="p-4 border border-black dark:border-white flex-1">
              Top Right 2
            </div>
          </Row>
          <div className="p-4 border border-black dark:border-white">
            Bottom Right
          </div>
        </Column>
      </Row>
    </Column>
  ),
};

export const EqualDistribution: Story = {
  render: () => (
    <Column className="h-full w-full p-8 gap-4" style={{ height: '100vh' }}>
      <div className="text-lg font-mono font-bold">Equal Distribution</div>
      <Row className="gap-2 flex-1" style={{ minHeight: 0 }}>
        <Column className="gap-2 flex-1">
          <div className="p-4 border border-black dark:border-white flex-1">
            Column 1
          </div>
        </Column>
        <Column className="gap-2 flex-1">
          <div className="p-4 border border-black dark:border-white flex-1">
            Column 2
          </div>
        </Column>
        <Column className="gap-2 flex-1">
          <div className="p-4 border border-black dark:border-white flex-1">
            Column 3
          </div>
        </Column>
      </Row>
    </Column>
  ),
};

export const ComplexMosaic: Story = {
  render: () => (
    <Column className="h-full w-full p-8 gap-4" style={{ height: '100vh' }}>
      <div className="text-lg font-mono font-bold">Complex Mosaic Layout</div>
      <Row className="gap-2 flex-1" style={{ minHeight: 0 }}>
        <Column className="gap-2 flex-1">
          <div className="p-4 border border-black dark:border-white flex-1">
            Cell 1
          </div>
        </Column>
        <Column className="gap-2 flex-1">
          <Row className="gap-2 flex-1" style={{ minHeight: 0 }}>
            <Column className="gap-2 flex-1">
              <div className="p-4 border border-black dark:border-white flex-1">
                Cell 2-1
              </div>
            </Column>
            <Column className="gap-2 flex-1">
              <div className="p-4 border border-black dark:border-white flex-1">
                Cell 2-2
              </div>
            </Column>
          </Row>
        </Column>
        <Column className="gap-2 flex-1">
          <div className="p-4 border border-black dark:border-white flex-1">
            Cell 3
          </div>
        </Column>
      </Row>
      <Row className="gap-2 flex-1" style={{ minHeight: 0 }}>
        <Column className="gap-2 flex-1">
          <Row className="gap-2 flex-1" style={{ minHeight: 0 }}>
            <div className="p-4 border border-black dark:border-white flex-1">
              Cell 4-1
            </div>
            <div className="p-4 border border-black dark:border-white flex-1">
              Cell 4-2
            </div>
          </Row>
        </Column>
        <Column className="gap-2 flex-1">
          <div className="p-4 border border-black dark:border-white flex-1">
            Cell 5
          </div>
        </Column>
        <Column className="gap-2 flex-1">
          <Row className="gap-2 flex-1" style={{ minHeight: 0 }}>
            <div className="p-4 border border-black dark:border-white flex-1">
              Cell 6-1
            </div>
            <div className="p-4 border border-black dark:border-white flex-1">
              Cell 6-2
            </div>
          </Row>
        </Column>
      </Row>
    </Column>
  ),
};




