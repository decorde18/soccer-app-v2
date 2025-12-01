// ============================================================
// OnFieldPlayers.jsx - PARENT COMPONENT (handles SubModal)
// ============================================================
"use client";

import PlayersTable from "./PlayersTable";
import { useSubManagement } from "@/hooks/useSubManagement";

function OnFieldPlayers() {
  const { handleSubClick, SubModal } = useSubManagement();

  const filterOnFieldPlayers = (player) => {
    // Exclude goalkeepers (they have their own component)
    if (player.gameStatus === "goalkeeper") return false;
    return (
      player.fieldStatus === "onField" || player.fieldStatus === "subbingOut"
    );
  };

  return (
    <div className='row-start-2 flex flex-col justify-between shadow-lg overflow-hidden'>
      <PlayersTable
        filterPlayers={filterOnFieldPlayers}
        caption={<span className='text-2xl font-bold'>On Field Players</span>}
        onActionClick={(row) => handleSubClick(row.id)}
        timeMode='onField'
      />
      <SubModal />
    </div>
  );
}

export default OnFieldPlayers;
