// OnFieldGk.jsx
"use client";
import PlayersTable from "./PlayersTable";
import Button from "@/components/ui/Button";

function OnFieldGk({ handleSubClick }) {
  const filterGoalkeeper = (player) => {
    return (
      player.gameStatus === "goalkeeper" &&
      (player.fieldStatus === "onFieldGk" ||
        player.fieldStatus === "subbingOutGk")
    );
  };

  const gkColumns = [
    { name: "number", label: "#", width: "50px" },
    { name: "name", label: "Name", width: "40%" },
    { name: "saves", label: "Saves", cellClassName: "text-end" },
    { name: "yellowCards", label: "YC", cellClassName: "text-end" },
    { name: "redCards", label: "RC", cellClassName: "text-end" },
    { name: "timeIn", label: "Time", cellClassName: "text-end" },
  ];
  const getRowClassName = (row) => {
    if (row.fieldStatus === "subbingOutGk") return "bg-red-100";
    return "bg-green-50";
  };
  const getGkActionButton = (row) => {
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
        caption={<span className='text-xl font-bold '>Goalkeeper</span>}
        columns={gkColumns}
        onActionClick={(row) => handleSubClick(row.id)}
        getActionButton={getGkActionButton}
        timeMode='onField'
        size='xs'
        getRowClassName={getRowClassName}
      />
    </div>
  );
}

export default OnFieldGk;
