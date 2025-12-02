"use client";
import React, { useState } from "react";
import Button from "@/components/ui/Button";
import LiveGameHeaderClock from "./LiveGameHeaderClock";
import useGameStore from "@/stores/gameStore";
import { useParams, useRouter } from "next/navigation";
import useGamePlayersStore from "@/stores/gamePlayersStore";

function LiveGameHeader() {
  const { id, teamSeasonId } = useParams();
  const game = useGameStore((s) => s.game);
  const players = useGamePlayersStore((s) => s.players);
  const gameStage = useGameStore((s) => s.getGameStage());
  const endPeriod = useGameStore((s) => s.endPeriod);
  const startPeriod = useGameStore((s) => s.startNextPeriod);
  const periodNumber = useGameStore((s) => s.getCurrentPeriodNumber());

  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const isGameLive = gameStage === "during_period";
  const isGameEnded = gameStage === "end_game";

  const isLineupValid =
    players.filter((p) => p.gameStatus === "starter").length ===
      game.settings.playersOnField - 1 &&
    players.filter((p) => p.gameStatus === "goalkeeper").length === 1;

  const handleViewStats = () => {
    router.push(`/gamestats/${id}/${teamSeasonId}/summary`);
  };

  const handleUpdateLineup = () => {
    setIsNavigating(true);
    router.push(`/gamestats/${teamSeasonId}/${id}/lineup`);
  };

  // Determine button props based on game state
  const getButtonProps = () => {
    if (!isLineupValid) {
      return {
        variant: "danger",
        onClick: handleUpdateLineup,
        disabled: isNavigating,
        children: isNavigating ? "Loading..." : "Set Lineup",
      };
    }

    if (isGameLive) {
      return {
        variant: "danger",
        onClick: endPeriod,
        children: "END PERIOD",
      };
    }

    if (isGameEnded) {
      return {
        variant: "outline",
        onClick: handleViewStats,
        children: "Go To Game Stats",
      };
    }

    return {
      onClick: startPeriod,
      children: "START",
    };
  };

  return (
    <header className='relative col-span-2 row-start-1 flex items-center justify-between px-4 py-3 shadow-lg bg-secondary text-background m-0 rounded'>
      {/* Left Section — Hamburger */}
      <div className='flex-shrink-0 w-10 flex items-center justify-start'></div>

      {/* Center Section — Score + Clock */}
      <div className='absolute left-1/2 transform -translate-x-1/2 flex items-center gap-8'>
        {/* Home Team */}
        <div className='text-center min-w-[80px]'>
          <div className='text-xs font-medium tracking-wider opacity-80 mb-1'>
            HOME
          </div>
          <div className='text-5xl font-bold tabular-nums'>
            {game.homeScore}
          </div>
        </div>

        {/* Clock */}
        {isGameLive ? (
          <div className='flex flex-col items-center px-8'>
            <div className='text-4xl font-bold tracking-wider tabular-nums'>
              <LiveGameHeaderClock />
            </div>
            <div className='text-xs font-medium tracking-wider opacity-70 mt-1'>
              PERIOD {periodNumber}
            </div>
          </div>
        ) : (
          <div className='text-center'>
            {gameStage === "before_start"
              ? "WAITING TO START GAME"
              : gameStage === "in_stoppage"
              ? "Game Is Paused"
              : gameStage === "end_game"
              ? "END OF GAME"
              : "PERIOD BREAK"}
          </div>
        )}

        {/* Away Team */}
        <div className='text-center min-w-[80px]'>
          <div className='text-xs font-medium tracking-wider opacity-80 mb-1'>
            AWAY
          </div>
          <div className='text-5xl font-bold tabular-nums'>
            {game.awayScore}
          </div>
        </div>
      </div>

      {/* Right Section — Fixed Width */}
      <div className='flex-shrink-0 w-[120px] flex justify-end'>
        <Button {...getButtonProps()} />
      </div>
    </header>
  );
}

export default LiveGameHeader;
