// OnFieldPlayers.jsx

"use client";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { usePlayers } from "@/contexts/GamePlayersContext";
import { useMemo } from "react";
import OnFieldGk from "./OnFieldGk";

function OnFieldPlayers() {
  const { players, updateFieldStatus } = usePlayers();

  // Columns definition remains unchanged

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
      return "bg-red-100"; // Table will convert this to inline style
    }
    return "";
  };

  // Deep copy added here to force re-render (as suggested previously)
  const currentPlayers = useMemo(
    () =>
      players
        .filter(
          (player) =>
            player.fieldStatus === "onField" ||
            player.fieldStatus === "subbingOut"
        )
        .map((player) => ({ ...player })),
    [players]
  );

  return (
    <div className='row-start-2 flex flex-col justify-between shadow-lg overflow-hidden'>
      {/* Table 1: On Field Players */}
      <Table
        columns={columns}
        data={currentPlayers}
        size='xs'
        hoverable
        // Use caption prop for header
        caption={<span className='text-2xl font-bold'>On Field Players</span>}
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

      {/* Table 2: Goalkeeper */}
      <OnFieldGk />
    </div>
  );
}

export default OnFieldPlayers;
