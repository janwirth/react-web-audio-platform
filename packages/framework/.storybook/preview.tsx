import type { Preview } from "@storybook/react";
import React from "react";
import "../src/index.css";
import { AudioContextProvider } from "../src/media/audio-context";
import { Column } from "../src/ui/Column";
import { Row } from "../src/ui/Row";
import { FPSMeter } from "@overengineering/fps-meter";
import { DarkModeToggle } from "../src/ui/DarkModeToggle";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      // <Column className="h-screen">
      //   <Row>
      //     <div className="border bg-black">
      //       <FPSMeter />
      //     </div>
      //     <DarkModeToggle />
      //   </Row>
      <AudioContextProvider>
        <Story />
      </AudioContextProvider>
      // {/* </Column> */}
    ),
  ],
};

export default preview;
