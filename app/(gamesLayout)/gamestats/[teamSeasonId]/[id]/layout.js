// app/games/[id]/layout.jsx
import LiveGameModal from "./live/LiveGameModal";
import GameProvider from "./GameProvider";

export default function GameLayout({ children }) {
  return (
    <GameProvider>
      {children}
      <LiveGameModal />
    </GameProvider>
  );
}
