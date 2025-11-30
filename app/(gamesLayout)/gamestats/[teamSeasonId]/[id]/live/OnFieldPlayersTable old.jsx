"use client";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { useSubManagement } from "@/hooks/useSubManagement";
import { formatSecondsToMmss } from "@/lib/dateTimeUtils";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameStore from "@/stores/gameStore";
import { useMemo, useState, useEffect } from "react";

function OnFieldPlayersTable() {
  const players = useGamePlayersStore((s) => s.players);
  const getGameTime = useGameStore((s) => s.getGameTime);
  const calculateCurrentTimeOnField = useGamePlayersStore(
    (s) => s.calculateCurrentTimeOnField
  );

  // Use the sub management hook
  const { handleSubClick, SubModal } = useSubManagement();

  // Force re-render every second
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const gameTime = getGameTime();

  const columns = [
    { name: "number", label: "#" },
    { name: "name", label: "Name", width: "30%" },
    { name: "shots", label: "Sh", cellClassName: "text-end" },
    { name: "goals", label: "G", cellClassName: "text-end" },
    { name: "assists", label: "A", cellClassName: "text-end" },
    { name: "timeOnField", label: "Time", cellClassName: "text-end" },
  ];

  const getButtonText = (fieldStatus) => {
    if (fieldStatus === "subbingOut") return "Cancel";
    return "Sub Out";
  };

  const getRowClassName = (row) => {
    if (row.fieldStatus === "subbingOut") return "bg-red-100";
    if (row.fieldStatus === "onFieldGk") return "bg-blue-50";
    return "";
  };

  const onFieldPlayers = useMemo(
    () =>
      players
        .filter(
          (player) =>
            player.fieldStatus === "onField" ||
            player.fieldStatus === "onFieldGk" ||
            player.fieldStatus === "subbingOut" ||
            player.fieldStatus === "subbingOutGk"
        )
        .map((player) => {
          const timeOnField = calculateCurrentTimeOnField(player, gameTime);

          return {
            id: player.id,
            number: player.jerseyNumber,
            name: player.fullName,
            shots: player.shots || 0,
            goals: player.goals || 0,
            assists: player.assists || 0,
            timeOnField: formatSecondsToMmss(timeOnField),
            fieldStatus: player.fieldStatus,
          };
        }),
    [players, gameTime, calculateCurrentTimeOnField]
  );

  return (
    <>
      <div className='flex flex-col'>
        <Table
          columns={columns}
          data={onFieldPlayers}
          size='sm'
          hoverable
          caption={<span className='text-2xl font-bold'>On Field</span>}
          onRowClick={(row) => console.log("Clicked:", row)}
          rowClassName={getRowClassName}
          actions={(row) => (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleSubClick(row.id);
              }}
              variant={row.fieldStatus === "subbingOut" ? "danger" : "primary"}
              className='px-3 py-1 rounded'
            >
              {getButtonText(row.fieldStatus)}
            </Button>
          )}
          actionsLabel='Status'
          actionsWidth='100px'
        />
      </div>

      {/* Sub Selection Modal */}
      <SubModal />
    </>
  );
}

export default OnFieldPlayersTable;

// ============================================
// EXAMPLE 3: Simple usage in any component// ============================================
function SimpleSubExample() {
  const { handleSubClick, SubModal } = useSubManagement();

  return (
    <div>
      <Button onClick={() => handleSubClick(123)}>Sub Player #123</Button>

      <SubModal />
    </div>
  );
}

export { SimpleSubExample };
