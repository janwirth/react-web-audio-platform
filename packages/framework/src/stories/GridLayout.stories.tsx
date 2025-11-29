import type { Meta, StoryObj } from "@storybook/react";
import { PanelEventBusProvider } from "@/hooks/usePanelEvent";
import { HotkeyDebuggerSection } from "@/components/HotkeyDebuggerSection";
import { GridLayout } from "@/components/GridLayout";

const meta = {
  title: "Stories/GridLayout",
  component: GridLayout,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    header: { control: "text" },
    footer: { control: "text" },
    leftSidebar: { control: "text" },
    rightSidebar: { control: "text" },
    center: { control: "text" },
    stage: { control: "text" },
    focusableLeftSidebar: { control: "boolean" },
    focusableCenter: { control: "boolean" },
    focusableRightSidebar: { control: "boolean" },
  },
} satisfies Meta<typeof GridLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    header: "Header",
    footer: "Footer",
    leftSidebar: "Left Sidebar",
    rightSidebar: "Right Sidebar",
    center: "Center Content",
    stage: "Stage",
  },
};

export const EmptyCenter: Story = {
  args: {
    header: "Header",
    footer: "Footer",
    leftSidebar: "Left Sidebar",
    rightSidebar: "Right Sidebar",
    stage: "Stage",
  },
};

export const OnlyCenter: Story = {
  args: {
    center: "Only Center Content",
  },
};

export const HeaderAndFooter: Story = {
  args: {
    header: "Header",
    footer: "Footer",
    center: "Center Content",
  },
};

export const SidebarsOnly: Story = {
  args: {
    leftSidebar: "Left Sidebar",
    rightSidebar: "Right Sidebar",
    center: "Center Content",
  },
};

function GridLayoutWithHotkeys() {
  return (
    <PanelEventBusProvider>
      <GridLayout
        header="Header"
        footer="Footer"
        leftSidebar={
          <HotkeyDebuggerSection panelId="leftSidebar">
            <div>Left Sidebar Item 1</div>
            <div>Left Sidebar Item 2</div>
            <div>Left Sidebar Item 3</div>
          </HotkeyDebuggerSection>
        }
        rightSidebar={
          <HotkeyDebuggerSection panelId="rightSidebar">
            <div>Right Sidebar Item A</div>
            <div>Right Sidebar Item B</div>
            <div>Right Sidebar Item C</div>
          </HotkeyDebuggerSection>
        }
        center={
          <HotkeyDebuggerSection panelId="center">
            <div>Center Content Item 1</div>
            <div>Center Content Item 2</div>
            <div>Center Content Item 3</div>
          </HotkeyDebuggerSection>
        }
        stage="Stage"
        focusableLeftSidebar={true}
        focusableCenter={true}
        focusableRightSidebar={true}
      />
    </PanelEventBusProvider>
  );
}

export const WithHotkeyNavigation: Story = {
  render: () => <GridLayoutWithHotkeys />,
};
