// OnFieldGk.jsx

"use client";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { usePlayers } from "@/contexts/GamePlayersContext";
import { useMemo } from "react";

function OnFieldGk() {
  const { players, updateFieldStatus } = usePlayers();

  const columnsGk = [
    { key: "number", label: "#" },
    { key: "name", label: "Name", width: "30%" },
    { key: "saves", label: "S" },
    { key: "goalsAgainst", label: "GA" },
    { key: "timeIn", label: "Time" },
    { key: "timeInRecent", label: "Last In" },
  ];

  // Helper function to get button text based on field status
  const getButtonText = (fieldStatus) => {
    if (fieldStatus === "subbingOutGk") {
      return "Subbing...";
    }
    return "Sub";
  };

  // Helper function to get row styling based on field status
  const getRowClassName = (row) => {
    const { fieldStatus } = row;
    if (fieldStatus === "subbingOutGk") {
      return "bg-red-100"; // Table will convert this to inline style
    }
    return "";
  };

  const currentGK = useMemo(
    () =>
      players
        .filter(
          (player) =>
            player.fieldStatus === "onFieldGk" ||
            player.fieldStatus === "subbingOutGk"
        )
        .map((player) => ({ ...player })),
    [players]
  );

  return (
    <Table
      columns={columnsGk}
      data={currentGK}
      size='xs'
      hoverable
      // Use caption prop for header
      caption={<span className='text-xl font-bold'>Goalkeeper</span>}
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
  );
}

export default OnFieldGk;
