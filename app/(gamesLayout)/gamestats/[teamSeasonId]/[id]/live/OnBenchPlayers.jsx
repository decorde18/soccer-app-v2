// OnBenchPlayers.jsx
"use client";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { formatSecondsToMmss } from "@/lib/dateTimeUtils";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameStore from "@/stores/gameStore";
import { useMemo, useState, useEffect } from "react";

function OnBenchPlayers() {
  const players = useGamePlayersStore((s) => s.players);
  const cancelSub = useGamePlayersStore((s) => s.cancelSub);
  const calculateTotalTimeOnField = useGamePlayersStore(
    (s) => s.calculateTotalTimeOnField
  );
  const calculateCurrentTimeOffField = useGamePlayersStore(
    (s) => s.calculateCurrentTimeOffField
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
    { name: "shots", label: "Sh", cellClassName: "text-end" },
    { name: "goals", label: "G", cellClassName: "text-end" },
    { name: "assists", label: "A", cellClassName: "text-end" },
    { name: "timeIn", label: "Time", cellClassName: "text-end" },
    { name: "timeOffBench", label: "On Bench", cellClassName: "text-end" },
  ];

  const getButtonText = (fieldStatus) => {
    if (fieldStatus === "subbingIn") return "Cancel Sub";
    return "Sub In";
  };

  const getRowClassName = (row) => {
    if (row.fieldStatus === "subbingIn") return "bg-green-100";
    return "";
  };

  const currentPlayers = useMemo(
    () =>
      players
        .filter(
          (player) =>
            player.fieldStatus === "onBench" ||
            player.fieldStatus === "subbingIn"
        )
        .map((player) => {
          const totalTime = calculateTotalTimeOnField(player, gameTime);
          const timeOffBench = calculateCurrentTimeOffField(player, gameTime);

          return {
            id: player.id,
            number: player.jerseyNumber || "—",
            name: player.fullName || `${player.firstName} ${player.lastName}`,
            shots: player.shots || 0,
            goals: player.goals || 0,
            assists: player.assists || 0,
            timeIn: formatSecondsToMmss(totalTime),
            timeOffBench: formatSecondsToMmss(timeOffBench),
            fieldStatus: player.fieldStatus,
            pendingSubId: player.ins?.find((sub) => sub.gameTime === null)
              ?.subId,
          };
        }),
    [players, gameTime, calculateTotalTimeOnField, calculateCurrentTimeOffField]
  );

  const handleSubClick = async (row) => {
    if (row.fieldStatus === "subbingIn" && row.pendingSubId) {
      await cancelSub(row.pendingSubId);
    } else {
      console.log("Select on-field player to sub out for:", row.name);
    }
  };

  return (
    <div className='row-start-3 shadow-lg overflow-hidden flex flex-col'>
      <Table
        columns={columns}
        data={currentPlayers}
        size='xxs'
        hoverable
        caption={<span className='text-2xl font-bold'>On Bench</span>}
        onRowClick={(row) => console.log("Clicked:", row)}
        rowClassName={getRowClassName}
        actions={(row) => (
          <Button
            size='sm'
            onClick={(e) => {
              e.stopPropagation();
              handleSubClick(row);
            }}
            // className='px-3 py-0 text-white rounded hover:bg-secondary'
          >
            {getButtonText(row.fieldStatus)}
          </Button>
        )}
        actionsLabel='Status'
        actionsWidth='100px'
      />
    </div>
  );
}

export default OnBenchPlayers;
