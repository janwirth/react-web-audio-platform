import { Player } from "./components/player/Player";
import { InnerApp } from "./components/app/InnerApp";
import { AudioContextProvider } from "./components/audio-context";
import { HotkeysBar } from "./components/HotkeysBar";

function App() {
  return (
    <AudioContextProvider>
      <Player>
        <InnerApp />
      </Player>
    </AudioContextProvider>
  );
}

export default App;
