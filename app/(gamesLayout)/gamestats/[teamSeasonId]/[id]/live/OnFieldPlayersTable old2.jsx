"use client";

import { useMemo, useState, useEffect } from "react";

import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameStore from "@/stores/gameStore";
import useGamePlayerTimeStore from "@/stores/gamePlayerTimeStore";

import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";

import { formatSecondsToMmss } from "@/lib/dateTimeUtils";

function OnFieldPlayersTable({ handleSub }) {
  const gameStage = useGameStore((s) => s.getGameStage());
  const getGameTime = useGameStore((s) => s.getGameTime);

  // Time calculations from gamePlayerTimeStore
  const calculateCurrentTimeOnField = useGamePlayerTimeStore(
    (s) => s.calculateCurrentTimeOnField
  );
  const calculateTotalTimeOnField = useGamePlayerTimeStore(
    (s) => s.calculateTotalTimeOnField
  );

  const allPlayers = useGamePlayersStore((s) => s.players);

  const isGameLive = gameStage === "during_period";

  // Force re-render every second to update time displays
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isGameLive) return;
    const interval = setInterval(() => {
      setTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameLive]);

  // Filter out goalkeepers - they have their own table
  const players = allPlayers.filter((p) => p.gameStatus !== "goalkeeper");

  const gameTime = getGameTime();

  const columns = [
    { name: "number", label: "#" },
    { name: "name", label: "Name", width: "30%" },
    { name: "shots", label: "Sh", cellClassName: "text-end" },
    { name: "goals", label: "G", cellClassName: "text-end" },
    { name: "assists", label: "A", cellClassName: "text-end" },
    { name: "timeIn", label: "Time", cellClassName: "text-end" },
    { name: "timeInRecent", label: "Last In", cellClassName: "text-end" },
  ];

  const getButtonText = (row) => {
    if (row.subStatus === "pendingOut") return "Cancel Sub";
    return "Sub Out";
  };

  const getRowClassName = (row) => {
    // Color coding based on subStatus
    if (row.subStatus === "pendingOut") {
      return "bg-red-100 border-l-4 border-red-500 p-0";
    }
    if (row.subStatus === "pendingIn") {
      return "bg-green-100 border-l-4 border-green-500 p-0";
    }
    return "p-0";
  };

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
            id: player.id,
            number: player.jerseyNumber || "—",
            name: player.fullName || `${player.firstName} ${player.lastName}`,
            shots: player.shots || 0,
            goals: player.goals || 0,
            assists: player.assists || 0,
            timeIn: formatSecondsToMmss(totalTime),
            timeInRecent: formatSecondsToMmss(currentTime),
            fieldStatus: player.fieldStatus,
            subStatus: player.subStatus,
            pendingSubId: player.outs?.find((out) => out.gameTime === null)
              ?.subId,
          };
        }),
    [players, gameTime, calculateTotalTimeOnField, calculateCurrentTimeOnField]
  );

  const actions =
    gameStage === "before_start" || gameStage === "end_game"
      ? null
      : (row) => {
          // Different button based on pending status
          if (row.subStatus === "pendingOut") {
            return (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSub(row);
                }}
                size='sm'
                variant='outline'
              >
                Cancel
              </Button>
            );
          }

          return (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleSub(row);
              }}
              size='sm'
            >
              {getButtonText(row)}
            </Button>
          );
        };

  return (
    <Table
      columns={columns}
      data={currentPlayers}
      size='xxs'
      hoverable
      caption={<span className='text-2xl font-bold'>On Field Players</span>}
      onRowClick={(row) => console.log("Clicked:", row)}
      rowClassName={getRowClassName}
      actions={actions}
      actionsLabel='Status'
      actionsWidth='100px'
    />
  );
}

export default OnFieldPlayersTable;
