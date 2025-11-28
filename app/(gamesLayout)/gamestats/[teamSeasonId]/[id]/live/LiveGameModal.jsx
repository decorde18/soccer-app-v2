"use client";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { formatSecondsToMmss } from "@/lib/dateTimeUtils";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameStore from "@/stores/gameStore";
import { useMemo, useState, useEffect } from "react";

function LiveGameModal() {
  const gameStage = useGameStore((s) => s.getGameStage());

  const players = useGamePlayersStore((s) => s.players);
  const updateFieldStatus = useGamePlayersStore((s) => s.updateFieldStatus);
  const calculateTotalTimeOnField = useGamePlayersStore(
    (s) => s.calculateTotalTimeOnField
  );
  const calculateCurrentTimeOffField = useGamePlayersStore(
    (s) => s.calculateCurrentTimeOffField
  );
  const getGameTime = useGameStore((s) => s.getGameTime);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const status =
      gameStage === "in_stoppage" || gameStage === "between_periods";
    setIsOpen(status);
  }, [gameStage]);
  // Force re-render every second to update time displays
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get current game time
  const gameTime = getGameTime();

  const columns = [
    { name: "number", label: "#" },
    { name: "name", label: "Name", width: "30%" },
    { name: "shots", label: "Sh", cellClassName: "text-end" },
    { name: "goals", label: "G", cellClassName: "text-end" },
    { name: "assists", label: "A", cellClassName: "text-end" },
    { name: "timeIn", label: "Time", cellClassName: "text-end" },
    { name: "timeOffBench", label: "Off Bench", cellClassName: "text-end" },
  ];

  const getButtonText = (fieldStatus) => {
    if (fieldStatus === "subbingIn") return "Subbing...";
    return "Sub";
  };

  // Helper function to get row styling based on field status
  const getRowClassName = (row) => {
    const { fieldStatus } = row;
    if (fieldStatus === "subbingIn") {
      return "bg-green-100";
    }
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
            number: player.jerseyNumber,
            name: player.fullName,
            shots: player.shots || 0,
            goals: player.goals || 0,
            assists: player.assists || 0,
            timeIn: formatSecondsToMmss(totalTime),
            timeOffBench: formatSecondsToMmss(timeOffBench),
            fieldStatus: player.fieldStatus,
          };
        }),
    [players, gameTime, calculateTotalTimeOnField, calculateCurrentTimeOffField]
  );

  return (
    isOpen && (
      <div className='row-start-3 shadow-lg overflow-hidden flex flex-col'>
        <Table
          columns={columns}
          data={currentPlayers}
          size='xs'
          hoverable
          caption={<span className='text-2xl font-bold'>On Bench</span>}
          onRowClick={(row) => console.log("Clicked:", row)}
          rowClassName={getRowClassName}
          actions={(row) => (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                // Find the full player object by id
                const player = players.find((p) => p.id === row.id);
                if (player) {
                  updateFieldStatus(player.id);
                }
              }}
              className='px-3 py-0 text-white rounded hover:bg-secondary'
            >
              {getButtonText(row.fieldStatus)}
            </Button>
          )}
          actionsLabel='Status'
          actionsWidth='100px'
        />
      </div>
    )
  );
}

export default LiveGameModal;
