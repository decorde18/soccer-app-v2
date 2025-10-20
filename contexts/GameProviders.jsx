import { AuthProvider } from "./AuthContext";
import { GameLiveProvider } from "./GameLiveContext";
import { GamePlayersProvider } from "./GamePlayersContext";

function GameProviders({ children }) {
  return (
    <AuthProvider>
      <GameLiveProvider>
        <GamePlayersProvider>{children}</GamePlayersProvider>
      </GameLiveProvider>
    </AuthProvider>
  );
}

export default GameProviders;
