"use client";
import React from "react";
import Button from "@/components/ui/Button";
import LiveGameHeaderClock from "./LiveGameHeaderClock";
import useGameStore from "@/stores/gameStore";
import { useRouter } from "next/navigation";

function LiveGameHeader() {
  const game = useGameStore((s) => s.game);
  const gameStage = useGameStore((s) => s.getGameStage());
  const endPeriod = useGameStore((s) => s.endPeriod);
  const startPeriod = useGameStore((s) => s.startNextPeriod);
  const periodNumber = useGameStore((s) => s.getCurrentPeriodNumber());

  const router = useRouter();

  const isGameLive = gameStage === "during_period";
  const isGameEnded = gameStage === "end_game";
  const handleViewStats = () => {
    router.push(
      `/gamestats/${game.game_id}/${
        game.isHome ? game.home_team_season_id : game.away_team_season_id
      }/summary`
    );
  };
  return (
    <header className=' relative col-span-2 row-start-1 flex items-center justify-between px-4 py-3 shadow-lg bg-secondary text-background m-0 rounded'>
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
        {isGameLive ? (
          <Button variant='danger' onClick={endPeriod}>
            END PERIOD
          </Button>
        ) : isGameEnded ? (
          <Button variant='outline' onClick={handleViewStats}>
            Go To Game Stats
          </Button>
        ) : (
          <Button onClick={startPeriod}>START</Button>
        )}
      </div>
    </header>
  );
}

export default LiveGameHeader;
