"use client";

import useGameStore from "@/stores/gameStore";
import { useRouter } from "next/navigation";

import { useEffect } from "react";

function MainContent() {
  const router = useRouter();
  const game = useGameStore((s) => s.game);
  const gameStage = useGameStore((s) => s.getGameStage());

  useEffect(() => {
    if (gameStage !== "end_game") {
      // Navigate away when game ends
      router.push(
        `/gameStats/${game.game_id}/${
          game.isHome ? game.home_team_season_id : game.away_team_season_id
        }/live`
      );
    }
  }, [gameStage, game.id, router]);

  return <div>You did it</div>;
}

export default MainContent;
