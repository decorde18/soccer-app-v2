// app/games/[id]/layout.jsx

import GameProvider from "./GameProvider";

export default function GameLayout({ children }) {
  return <GameProvider>{children}</GameProvider>;
}
