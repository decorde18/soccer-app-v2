"use client";

import { useSubManagement } from "@/hooks/useSubManagement";
import SubSelectionModal from "./SubSelectionModal";
import OnFieldPlayers from "./OnFieldPlayers";

import OnBenchPlayers from "./OnBenchPlayers";
import TeamStats from "./TeamStats";
import PendingSubs from "./PendingSubs";
import LiveGameHeader from "./LiveGameHeader";

function GamePlayersLayout() {
  const {
    subModalOpen,
    triggerPlayer,
    subMode,
    handleSubClick,
    closeSubModal,
  } = useSubManagement();

  return (
    <div className='h-screen grid grid-cols-[60%_1fr] grid-rows-[10%_1.22fr_1fr] gap-4 p-1 overflow-hidden'>
      <LiveGameHeader />

      <OnFieldPlayers handleSubClick={handleSubClick} />
      <OnBenchPlayers handleSubClick={handleSubClick} />
      <div className='row-start-2 row-span-2 grid grid-rows-2 gap-4 h-full'>
        <TeamStats />
        <PendingSubs />
      </div>
      <SubSelectionModal
        isOpen={subModalOpen}
        onClose={closeSubModal}
        triggerPlayer={triggerPlayer}
        mode={subMode}
      />
    </div>
  );
}

export default GamePlayersLayout;
