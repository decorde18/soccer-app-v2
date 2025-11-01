"use client";

import { useGame } from "@/contexts/GameLiveContext";
import { useRouter } from "next/navigation";

import { useEffect } from "react";

function MainContent() {
  const { gameStage, game } = useGame();
  const router = useRouter();
  useEffect(() => {
    if (gameStage !== "end_game") {
      // Navigate away when game ends
      router.push(`/gameStats/${game.id}/live`);
    }
  }, [gameStage, game.id, router]);

  return <div>You did it</div>;
}

export default MainContent;
