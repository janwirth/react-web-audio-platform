import type { Meta, StoryObj } from "@storybook/react";
import { GridLayout } from "@/layout-and-control/GridLayout";
import { PanelEventBusProvider } from "@/layout-and-control/hooks/usePanelEvent";
import { useAreaVisibility } from "@/layout-and-control/hooks/useAreaVisibility";
import { AreaVisibilityHotkeysFooter } from "@/layout-and-control/AreaVisibilityHotkeysFooter";
import { Player } from "@/media/player/Player";
import { PlayerUI } from "@/media/player/PlayerUI";
import { Visualizer } from "@/media/visualizer/Visualizer";
import { Queue } from "@/media/player/Queue";
import { Tracklist } from "@/components/Tracklist";
import { DarkModeToggle } from "@/ui/DarkModeToggle";
import { Lists } from "@/components/Lists";
import { Settings } from "@/components/Settings";

const meta = {
  title: "Stories/Application",
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function VisualizerWithTableLayout() {
  const visibilityHook = useAreaVisibility({
    player: true,
    footer: true,
    settings: false,
    leftSidebar: true,
    rightSidebar: true,
    center: true,
    visualizer: false,
  });
  const { visibility } = visibilityHook;

  return (
    <PanelEventBusProvider>
      <Player>
        <GridLayout
          visualizer={{
            render: <Visualizer height={400} />,
            visible: visibility.visualizer,
          }}
          player={{
            render: (
              <div className="px-2 py-1 w-full">
                {" "}
                <PlayerUI />
              </div>
            ),
            visible: visibility.player,
          }}
          center={{
            render: <Tracklist />,
            focusable: visibility.center,
            visible: visibility.center,
          }}
          settings={{
            render: <Settings />,
            visible: visibility.settings,
          }}
          footer={{
            render: (
              <div className="flex items-center justify-between w-full">
                <AreaVisibilityHotkeysFooter visibilityHook={visibilityHook} />

                <DarkModeToggle></DarkModeToggle>
              </div>
            ),
            visible: visibility.footer,
          }}
          leftSidebar={{
            render: <Lists />,
            focusable: visibility.leftSidebar,
            visible: visibility.leftSidebar,
          }}
          rightSidebar={{
            render: <Queue></Queue>,
            focusable: visibility.rightSidebar,
            visible: visibility.rightSidebar,
          }}
        />
      </Player>
    </PanelEventBusProvider>
  );
}

export const VisualizerWithTable: Story = {
  render: () => <VisualizerWithTableLayout />,
  parameters: {
    layout: "fullscreen",
  },
};

