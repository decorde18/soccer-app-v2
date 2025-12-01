// OnFieldGk.jsx
"use client";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { formatSecondsToMmss } from "@/lib/dateTimeUtils";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGamePlayerTimeStore from "@/stores/gamePlayerTimeStore";
import useGameStore from "@/stores/gameStore";
import { useMemo, useState, useEffect } from "react";

function OnFieldGk() {
  const players = useGamePlayersStore((s) => s.players);
  const cancelSub = useGamePlayersStore((s) => s.cancelSub);
  const calculateTotalTimeOnField = useGamePlayerTimeStore(
    (s) => s.calculateTotalTimeOnField
  );
  const calculateCurrentTimeOnField = useGamePlayerTimeStore(
    (s) => s.calculateCurrentTimeOnField
  );
  const getGameTime = useGameStore((s) => s.getGameTime);
  const gameStage = useGameStore((s) => s.getGameStage());

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

  const gameTime = getGameTime();

  const columns = [
    { name: "number", label: "#" },
    { name: "name", label: "Name", width: "30%" },
    { name: "saves", label: "Sv", cellClassName: "text-end" },
    { name: "goals", label: "G", cellClassName: "text-end" },
    { name: "assists", label: "A", cellClassName: "text-end" },
    { name: "timeIn", label: "Time", cellClassName: "text-end" },
    { name: "timeInRecent", label: "Last In", cellClassName: "text-end" },
  ];

  const getButtonText = (fieldStatus) => {
    if (fieldStatus === "subbingOutGk") return "Cancel Sub";
    return "Sub Out";
  };

  const getRowClassName = (row) => {
    if (row.fieldStatus === "subbingOutGk") return "bg-red-100";
    return "bg-green-50";
  };

  const goalkeepers = useMemo(
    () =>
      players
        .filter(
          (player) =>
            player.gameStatus === "goalkeeper" &&
            (player.fieldStatus === "onFieldGk" ||
              player.fieldStatus === "subbingOutGk")
        )
        .map((player) => {
          const totalTime = calculateTotalTimeOnField(player, gameTime);
          const currentTime = calculateCurrentTimeOnField(player, gameTime);

          return {
            id: player.id,
            number: player.jerseyNumber || "—",
            name: player.fullName || `${player.firstName} ${player.lastName}`,
            saves: player.saves || 0,
            goals: player.goals || 0,
            assists: player.assists || 0,
            timeIn: formatSecondsToMmss(totalTime),
            timeInRecent: formatSecondsToMmss(currentTime),
            fieldStatus: player.fieldStatus,
            pendingSubId: player.outs?.find((out) => out.gameTime === null)
              ?.subId,
          };
        }),
    [players, gameTime, calculateTotalTimeOnField, calculateCurrentTimeOnField]
  );

  const handleSubClick = async (row) => {
    if (row.fieldStatus === "subbingOutGk" && row.pendingSubId) {
      await cancelSub(row.pendingSubId);
    } else {
      console.log("Select bench player to sub in GK for:", row.name);
    }
  };

  return (
    <Table
      columns={columns}
      data={goalkeepers}
      size='xxs'
      hoverable
      caption={
        <span className='text-xl font-bold text-green-700'>Goalkeeper</span>
      }
      onRowClick={(row) => console.log("GK Clicked:", row)}
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
  );
}

export default OnFieldGk;
