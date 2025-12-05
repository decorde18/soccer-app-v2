"use client";

import useGameStore from "@/stores/gameStore";
import { useParams, useRouter } from "next/navigation";

import { useEffect } from "react";

function MainContent() {
  const { id, teamSeasonId } = useParams();
  const router = useRouter();
  const game = useGameStore((s) => s.game);
  const gameStage = useGameStore((s) => s.getGameStage());

  useEffect(() => {
    if (gameStage !== "end_game") {
      // Navigate away when game ends
      router.push(`/gamestats/${teamSeasonId}/${id}/live`);
    }
  }, [gameStage, game.id, router]);

  return <div>You did it</div>;
}

export default MainContent;
