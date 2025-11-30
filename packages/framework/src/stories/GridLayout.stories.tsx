import type { Meta, StoryObj } from "@storybook/react";
import { PanelEventBusProvider } from "@/layout-and-control/hooks/usePanelEvent";
import { HotkeyDebuggerSection } from "@/layout-and-control/HotkeyDebuggerSection";
import { GridLayout } from "@/layout-and-control/GridLayout";
import { useAreaVisibility } from "@/layout-and-control/hooks/useAreaVisibility";
import { AreaVisibilityControls } from "@/layout-and-control/AreaVisibilityControls";

const meta = {
  title: "Stories/GridLayout",
  component: GridLayout,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof GridLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    player: { render: "Player", visible: true },
    footer: { render: "Footer", visible: true },
    leftSidebar: { render: "Left Sidebar", visible: true },
    rightSidebar: { render: "Right Sidebar", visible: true },
    center: { render: "Center Content", visible: true },
    visualizer: { render: "Visualizer", visible: true },
  },
};

export const EmptyCenter: Story = {
  args: {
    player: { render: "Player", visible: true },
    footer: { render: "Footer", visible: true },
    leftSidebar: { render: "Left Sidebar", visible: true },
    rightSidebar: { render: "Right Sidebar", visible: true },
    visualizer: { render: "Visualizer", visible: true },
  },
};

export const OnlyCenter: Story = {
  args: {
    center: { render: "Only Center Content", visible: true },
  },
};

export const PlayerAndFooter: Story = {
  args: {
    player: { render: "Player", visible: true },
    footer: { render: "Footer", visible: true },
    center: { render: "Center Content", visible: true },
  },
};

export const SidebarsOnly: Story = {
  args: {
    leftSidebar: { render: "Left Sidebar", visible: true },
    rightSidebar: { render: "Right Sidebar", visible: true },
    center: { render: "Center Content", visible: true },
  },
};

function GridLayoutWithHotkeys() {
  const visibilityHook = useAreaVisibility();
  const { visibility } = visibilityHook;

  return (
    <PanelEventBusProvider>
      <GridLayout
        player={{
          render: "Player",
          visible: visibility.player,
        }}
        footer={{
          render: <AreaVisibilityControls visibilityHook={visibilityHook} />,
          visible: visibility.footer,
        }}
        leftSidebar={{
          render: (
            <HotkeyDebuggerSection panelId="leftSidebar">
              <div>Left Sidebar Item 1</div>
              <div>Left Sidebar Item 2</div>
              <div>Left Sidebar Item 3</div>
            </HotkeyDebuggerSection>
          ),
          focusable: visibility.leftSidebar,
          visible: visibility.leftSidebar,
        }}
        rightSidebar={{
          render: (
            <HotkeyDebuggerSection panelId="rightSidebar">
              <div>Right Sidebar Item A</div>
              <div>Right Sidebar Item B</div>
              <div>Right Sidebar Item C</div>
            </HotkeyDebuggerSection>
          ),
          focusable: visibility.rightSidebar,
          visible: visibility.rightSidebar,
        }}
        center={{
          render: (
            <HotkeyDebuggerSection panelId="center">
              <div>Center Content Item 1</div>
              <div>Center Content Item 2</div>
              <div>Center Content Item 3</div>
            </HotkeyDebuggerSection>
          ),
          focusable: visibility.center,
          visible: visibility.center,
        }}
        visualizer={{
          render: "Visualizer",
          visible: visibility.visualizer,
        }}
      />
    </PanelEventBusProvider>
  );
}

export const WithHotkeyNavigation: Story = {
  render: () => <GridLayoutWithHotkeys />,
};

function GridLayoutWithAreaVisibility() {
  const visibilityHook = useAreaVisibility();
  const { visibility } = visibilityHook;

  return (
    <PanelEventBusProvider>
      <GridLayout
        player={{
          render: "Player",
          visible: visibility.player,
        }}
        footer={{
          render: <AreaVisibilityControls visibilityHook={visibilityHook} />,
          visible: visibility.footer,
        }}
        leftSidebar={{
          render: "Left Sidebar",
          focusable: visibility.leftSidebar,
          visible: visibility.leftSidebar,
        }}
        rightSidebar={{
          render: "Right Sidebar",
          focusable: visibility.rightSidebar,
          visible: visibility.rightSidebar,
        }}
        center={{
          render: "Center Content",
          focusable: visibility.center,
          visible: visibility.center,
        }}
        visualizer={{
          render: "Visualizer",
          visible: visibility.visualizer,
        }}
      />
    </PanelEventBusProvider>
  );
}

export const WithAreaVisibility: Story = {
  render: () => <GridLayoutWithAreaVisibility />,
};
