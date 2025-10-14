"use client";
import React, { useState, useEffect } from "react";
import GameHeader from "./GameHeader";
import GameFooter from "./GameFooter";
import PlayerStatusSections from "./PlayerStatusSections";

//todo game status so we know where to go from click return start etc butt.
//todo add to settings -allows mistake from starters or unavailable etc
const PeriodLineup = ({ periodNumber = 2, previousLineup = null }) => {
  // Mock roster data
  const [players] = useState([
    { id: 1, name: "John Smith", number: 1, status: "unavailable" },
    { id: 2, name: "Mike Johnson", number: 3, status: "goalkeeper" },
    { id: 3, name: "David Brown", number: 5, status: "starter" },
    { id: 4, name: "Chris Wilson", number: 7, status: "bench" },
    { id: 5, name: "James Davis", number: 9, status: "injured" },
    { id: 6, name: "Robert Miller", number: 11, status: "available" },
    { id: 7, name: "Tom Anderson", number: 13, status: "available" },
    { id: 8, name: "Dan Thomas", number: 15, status: "available" },
    { id: 9, name: "Paul Jackson", number: 17, status: "available" },
    { id: 10, name: "Mark White", number: 19, status: "available" },
    { id: 11, name: "Steve Harris", number: 21, status: "available" },
    { id: 12, name: "Kevin Martin", number: 2, status: "available" },
    { id: 13, name: "Brian Lee", number: 4, status: "available" },
    { id: 14, name: "Gary Moore", number: 6, status: "available" },
    { id: 15, name: "Eric Taylor", number: 8, status: "available" },
    { id: 16, name: "Ryan Clark", number: 10, status: "available" },
    { id: 17, name: "Jeff Lewis", number: 12, status: "available" },
    { id: 18, name: "Matt Walker", number: 14, status: "available" },
  ]);

  const [roster, setRoster] = useState([]);
  const gameDetails = { periodNumber };

  // Initialize lineup from previous period if available
  useEffect(() => {
    if (!players.length) return;
    setRoster(players);
  }, [players.length]);

  const handleStatus = (playerId, action) => {
    setRoster((prevRoster) => {
      const currentPlayer = prevRoster.find((p) => p.id === playerId);
      if (!currentPlayer) return prevRoster;

      let updatedStatus = action;

      if (action === "toggle") {
        const cycle = {
          goalkeeper: "injured",
          starter: "injured",
          bench: "injured",
          available: "injured",
          unavailable: "available",
          injured: "unavailable",
        };
        updatedStatus = cycle[currentPlayer.status] || currentPlayer.status;
      }
      if (action === "goalkeeper") {
        if (currentPlayer.status === "goalkeeper") {
          updatedStatus = "starter";
        } else {
          updatedStatus = "goalkeeper";
        }
      }
      return prevRoster.map((p) => {
        // If assigning goalkeeper, demote any existing goalkeeper
        if (
          action === "goalkeeper" &&
          p.id !== playerId &&
          p.status === "goalkeeper"
        ) {
          return { ...p, status: "starter" };
        }

        // Update the target player
        if (p.id === playerId) {
          return { ...p, status: updatedStatus };
        }

        return p;
      });
    });
  };
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
          <PlayerStatusSections roster={roster} handleStatus={handleStatus} />
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
