// OnBenchPlayers.jsx
"use client";
import PlayersTable from "./PlayersTable";
import Button from "@/components/ui/Button";

function OnBenchPlayers({ handleSubClick }) {
  const filterBenchPlayers = (player) => {
    return (
      player.fieldStatus === "onBench" || player.fieldStatus === "subbingIn"
    );
  };

  const benchColumns = [
    { name: "number", label: "#", width: "50px" },
    { name: "name", label: "Name", width: "35%" },
    { name: "position", label: "Pos" },
    { name: "goals", label: "G", cellClassName: "text-end" },
    { name: "assists", label: "A", cellClassName: "text-end" },
    { name: "timeIn", label: "Time In", cellClassName: "text-end" },
    { name: "timeOut", label: "Time Out", cellClassName: "text-end" },
  ];

  const getBenchActionButton = (row) => {
    const buttonText = row.subStatus === "pendingIn" ? "Cancel" : "Sub In";
    const variant = row.subStatus === "pendingIn" ? "outline" : "success";

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
    <div className='shadow-lg overflow-hidden'>
      <PlayersTable
        filterPlayers={filterBenchPlayers}
        caption={<span className='text-2xl font-bold'>Bench</span>}
        columns={benchColumns}
        onActionClick={(row) => handleSubClick(row.id)}
        getActionButton={getBenchActionButton}
        timeMode='onBench'
      />
    </div>
  );
}

export default OnBenchPlayers;
