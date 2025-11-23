import { GameLiveProvider } from "./GameLiveContext";
import { GamePlayersProvider } from "./GamePlayersContext";

function GameProviders({ children }) {
  return (
    <GameLiveProvider>
      <GamePlayersProvider>{children}</GamePlayersProvider>
    </GameLiveProvider>
  );
}

export default GameProviders;
