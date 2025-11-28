// ============================================
// FILE 1: page.js (PeriodLineup)
// ============================================
"use client";
import React, { useState, useEffect } from "react";
import GameHeader from "./GameHeader";
import GameFooter from "./GameFooter";
import PlayerStatusSections from "./PlayerStatusSections";
import useGamePlayersStore from "@/stores/gamePlayersStore";

const PeriodLineup = () => {
  const players = useGamePlayersStore((s) => s.players);
  const updateGameStatus = useGamePlayersStore((s) => s.updateGameStatus);

  const gameDetails = { periodNumber: 1 };

  const canStartPeriod = () => {};
  const handleStartPeriod = () => {};

  return (
    <div className='flex flex-col h-screen max-w-7xl mx-auto bg-gray-50'>
      {/* Header */}
      <div className='shrink-0 px-4 pt-4'>
        <GameHeader gameDetails={gameDetails} />
      </div>

      {/* Scrollable Main Content */}
      <div className='flex-1 overflow-y-auto p-4'>
        <PlayerStatusSections
          roster={players}
          handleStatus={(playerId, action) =>
            updateGameStatus(playerId, action)
          }
        />
      </div>

      {/* Footer pinned to bottom */}
      <div className='shrink-0 px-4 pb-4'>
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
