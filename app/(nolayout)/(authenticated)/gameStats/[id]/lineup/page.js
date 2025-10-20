"use client";
import React, { useState, useEffect } from "react";
import GameHeader from "./GameHeader";
import GameFooter from "./GameFooter";
import PlayerStatusSections from "./PlayerStatusSections";
import { usePlayers } from "@/contexts/GamePlayersContext";
import { useGame } from "@/contexts/GameLiveContext";

//todo game status so we know where to go from click return start etc butt.
//todo add to settings -allows mistake from starters or unavailable etc

const PeriodLineup = () => {
  const { players, updateGameStatus } = usePlayers();
  // const { game, formatTime, toggleGameClock } = useGame();

  const gameDetails = { periodNumber: 1 };

  const canStartPeriod = () => {};
  const handleStartPeriod = () => {};

  return (
    <div className='flex flex-col h-screen max-w-7xl mx-auto bg-gray-100'>
      {/* Header */}
      <div className='shrink-0 px-5 pt-5'>
        <GameHeader gameDetails={gameDetails} />
      </div>

      {/* Scrollable Main Content */}
      <div className='flex-1 overflow-hidden p-5'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 h-full'>
          <PlayerStatusSections
            roster={players}
            handleStatus={(playerId, action) =>
              updateGameStatus(playerId, action)
            }
          />
        </div>
      </div>

      {/* Footer pinned to bottom */}
      <div className='shrink-0 p-5'>
        <GameFooter
          gameDetails={gameDetails}
          canStartPeriod={canStartPeriod}
          handleStartPeriod={handleStartPeriod}
        />
      </div>
    </div>
  );
};

export default PeriodLineup;
