// (gamesLayout)/gamestats/[teamSeasonId]/[id]/layout.jsx
import { Suspense } from "react";

import GameProvider from "./GameProvider";
import NavBarSkeleton from "@/components/layout/NavBarSkeleton";
import GameNavBar from "./GameNavBar";

export default function layout({ children }) {
  return (
    <GameProvider>
      <Suspense fallback={<NavBarSkeleton />}>
        <GameNavBar />
      </Suspense>
      {children}
    </GameProvider>
  );
}
