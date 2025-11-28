// OnFieldPlayers.jsx
"use client";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { formatSecondsToMmss } from "@/lib/dateTimeUtils";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameStore from "@/stores/gameStore";
import { useMemo, useState, useEffect } from "react";
import OnFieldGk from "./OnFieldGk";

function OnFieldPlayers() {
  const gameStage = useGameStore((s) => s.getGameStage());
  const allPlayers = useGamePlayersStore((s) => s.players);
  const createPendingSub = useGamePlayersStore((s) => s.createPendingSub);
  const cancelSub = useGamePlayersStore((s) => s.cancelSub);
  const calculateTotalTimeOnField = useGamePlayersStore(
    (s) => s.calculateTotalTimeOnField
  );
  const calculateCurrentTimeOnField = useGamePlayersStore(
    (s) => s.calculateCurrentTimeOnField
  );
  const getGameTime = useGameStore((s) => s.getGameTime);

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

  const getButtonText = (fieldStatus) => {
    if (fieldStatus === "subbingOut") return "Cancel Sub";
    return "Sub Out";
  };

  const getRowClassName = (row) => {
    if (row.fieldStatus === "subbingOut") return "bg-red-100 p-0";
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
            // Store pending sub ID if exists
            pendingSubId: player.outs?.find((out) => out.gameTime === null)
              ?.subId,
          };
        }),
    [players, gameTime, calculateTotalTimeOnField, calculateCurrentTimeOnField]
  );

  const handleSubClick = async (row) => {
    console.log(row);
    if (row.fieldStatus === "subbingOut" && row.pendingSubId) {
      // Cancel the pending sub
      await cancelSub(row.pendingSubId);
    } else {
      // This would trigger sub selection - needs to be paired with a bench player
      // For now, just log - you'll need to implement sub selection UI
      console.log("Select bench player to sub in for:", row.name);
    }
  };

  return (
    <div className='row-start-2 flex flex-col justify-between shadow-lg overflow-hidden'>
      <Table
        columns={columns}
        data={currentPlayers}
        size='xxs'
        hoverable
        caption={<span className='text-2xl font-bold'>On Field Players</span>}
        onRowClick={(row) => console.log("Clicked:", row)}
        rowClassName={getRowClassName}
        actions={(row) => (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleSubClick(row);
            }}
            size='sm'
          >
            {getButtonText(row.fieldStatus)}
          </Button>
        )}
        actionsLabel='Status'
        actionsWidth='100px'
      />

      <OnFieldGk />
    </div>
  );
}

export default OnFieldPlayers;
