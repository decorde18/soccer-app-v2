"use client";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { usePlayers } from "@/contexts/GamePlayersContext";
import { useMemo } from "react";

function OnBenchPlayers() {
  const { players, updateFieldStatus } = usePlayers();
  const columns = [
    { key: "number", label: "#" },
    { key: "name", label: "Name", width: "30%" },
    { key: "shots", label: "Sh", cellClassName: "text-end" },
    { key: "goals", label: "G", cellClassName: "text-end" },
    { key: "assists", label: "A", cellClassName: "text-end" },
    { key: "timeIn", label: "Time", cellClassName: "text-end" },
    { key: "timeInRecent", label: "Last In", cellClassName: "text-end" },
  ];

  const getButtonText = (fieldStatus) => {
    if (fieldStatus === "subbingOut") return "Subbing...";
    if (fieldStatus === "subbingIn") return "Subbing...";
    return "Sub";
  };
  // Helper function to get row styling based on field status
  const getRowClassName = (row) => {
    const { fieldStatus } = row;
    if (fieldStatus === "subbingIn" || fieldStatus === "subbingInGk") {
      return "bg-green-100"; // Table will convert this to inline style
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
        .map((player) => ({ ...player })),
    [players]
  );
  return (
    <div className='row-start-3 shadow-lg overflow-hidden flex flex-col'>
      <Table
        columns={columns}
        data={currentPlayers}
        size='xs'
        hoverable
        // Use caption prop for header
        caption={<span className='text-2xl font-bold'>On Bench</span>}
        onRowClick={(row) => console.log("Clicked:", row)}
        rowClassName={getRowClassName}
        actions={(row) => (
          <Button
            onClick={(e) => {
              // FIX 2: Add e.stopPropagation()
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
    </div>
  );
}

export default OnBenchPlayers;
