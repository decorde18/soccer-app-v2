// OnFieldPlayers.jsx
"use client";

import OnFieldGk from "./OnFieldGk";
import { useSubManagement } from "@/hooks/useSubManagement";
import OnFieldPlayersTable from "./OnFieldPlayersTable";

function OnFieldPlayers() {
  const { handleSubClick, SubModal } = useSubManagement();
  const handleSub = (row) => {
    handleSubClick(row.id);
  };
  return (
    <div className='row-start-2 flex flex-col justify-between shadow-lg overflow-hidden'>
      <OnFieldPlayersTable handleSub={handleSub} />
      <OnFieldGk />
      <SubModal />
    </div>
  );
}

export default OnFieldPlayers;
