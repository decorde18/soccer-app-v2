"use client";

import Button from "@/components/ui/Button";
import PlayersTable from "./PlayersTable";
import { useSubManagement } from "@/hooks/useSubManagement";

function OnFieldGk() {
  const { handleSubClick } = useSubManagement();

  const filterGoalkeeper = (player) => {
    return (
      player.gameStatus === "goalkeeper" &&
      (player.fieldStatus === "onFieldGk" ||
        player.fieldStatus === "subbingOutGk")
    );
  };

  // Custom columns for goalkeeper - show saves instead of shots/goals
  const gkColumns = [
    { name: "number", label: "#", width: "50px" },
    { name: "name", label: "Name", width: "40%" },
    { name: "saves", label: "Saves", cellClassName: "text-end" },
    { name: "yellowCards", label: "YC", cellClassName: "text-end" },
    { name: "redCards", label: "RC", cellClassName: "text-end" },
    { name: "timeIn", label: "Time", cellClassName: "text-end" },
  ];

  const getGkActionButton = (row) => {
    // Custom button text for GK
    const buttonText = row.subStatus === "pendingOut" ? "Cancel" : "Sub GK";
    const variant = row.subStatus === "pendingOut" ? "outline" : "primary";

    return (
      <Button
        onClick={(e) => {
          e.stopPropagation();
          handleSubClick(row.id);
        }}
        size='sm'
        variant={variant}
      >
        {buttonText}
      </Button>
    );
  };

  return (
    <div className='bg-primary-dark p-2'>
      <PlayersTable
        filterPlayers={filterGoalkeeper}
        caption={
          <span className='text-xl font-bold text-white'>Goalkeeper</span>
        }
        columns={gkColumns}
        onActionClick={(row) => handleSubClick(row.id)}
        getActionButton={getGkActionButton}
        timeMode='onField'
        size='xs'
      />
    </div>
  );
}

export default OnFieldGk;
