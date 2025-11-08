// OnFieldPlayers.jsx

"use client";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";

import { useMemo, useState, useEffect } from "react";
import OnFieldGk from "./OnFieldGk";
import { useGame } from "@/contexts/GameLiveContext";
import { usePlayers } from "@/contexts/GamePlayersContext";

function OnFieldPlayers() {
  const {
    players,
    updateFieldStatus,
    calculateTotalTimeOnField,
    calculateCurrentTimeOnField,
  } = usePlayers();
  const gameTime = useGame(); // Auto-updates every second

  // Force re-render every second to update time displays
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to format seconds as MM:SS
  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Columns definition
  const columns = [
    { key: "number", label: "#" },
    { key: "name", label: "Name", width: "30%" },
    { key: "shots", label: "Sh" },
    { key: "goals", label: "G" },
    { key: "assists", label: "A" },
    { key: "timeIn", label: "Time" },
    { key: "timeInRecent", label: "Last In" },
  ];

  // Helper function to get button text based on field status
  const getButtonText = (fieldStatus) => {
    if (fieldStatus === "subbingOut") {
      return "Subbing...";
    }
    return "Sub";
  };

  // Helper function to get row styling based on field status
  const getRowClassName = (row) => {
    const { fieldStatus } = row;
    if (fieldStatus === "subbingOut") {
      return "bg-red-100";
    }
    return "";
  };

  // Prepare player data with calculated times
  const currentPlayers = useMemo(
    () =>
      players
        .filter(
          (player) =>
            player.fieldStatus === "onField" ||
            player.fieldStatus === "subbingOut"
        )
        .map((player) => {
          const totalTime = calculateTotalTimeOnField(player, gameTime);
          const currentTime = calculateCurrentTimeOnField(player, gameTime);

          return {
            ...player,
            timeIn: formatTime(totalTime),
            timeInRecent: formatTime(currentTime),
          };
        }),
    [players, gameTime, calculateTotalTimeOnField, calculateCurrentTimeOnField]
  );

  return (
    <div className='row-start-2 flex flex-col justify-between shadow-lg overflow-hidden'>
      {/* Table 1: On Field Players */}
      <Table
        columns={columns}
        data={currentPlayers}
        size='xs'
        hoverable
        caption={<span className='text-2xl font-bold'>On Field Players</span>}
        onRowClick={(row) => console.log("Clicked:", row)}
        rowClassName={getRowClassName}
        actions={(row) => (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              updateFieldStatus(row);
            }}
            className='px-3 py-0 text-white rounded hover:bg-secondary'
          >
            {getButtonText(row.fieldStatus)}
          </Button>
        )}
        actionsLabel='Status'
        actionsWidth='100px'
      />

      {/* Table 2: Goalkeeper */}
      <OnFieldGk />
    </div>
  );
}

export default OnFieldPlayers;
