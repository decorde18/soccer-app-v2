"use client";

import { useSubManagement } from "@/hooks/useSubManagement";
import SubSelectionModal from "./SubSelectionModal";
import OnFieldPlayers from "./gameMain/OnFieldPlayers";

import OnBenchPlayers from "./gameMain/OnBenchPlayers";
import TeamStats from "./gameMain/TeamStats";
import PendingSubs from "./gameMain/PendingSubs";
import LiveGameHeader from "./gameHeader/LiveGameHeader";

function LayoutLiveGame() {
  const {
    subModalOpen,
    triggerPlayer,
    subMode,
    handleSubClick,
    closeSubModal,
  } = useSubManagement();

  return (
    <div className='h-screen grid grid-cols-[61%_1fr] grid-rows-[10%_1.22fr_1fr] gap-4 p-1 overflow-hidden'>
      <LiveGameHeader />

      <OnFieldPlayers handleSubClick={handleSubClick} />
      <OnBenchPlayers handleSubClick={handleSubClick} />
      <div className='row-start-2 row-span-2 grid grid-rows-2 gap-4 h-full space-y-4'>
        <div className='pb-4 border-b-2 border-border'>
          <TeamStats />
        </div>
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

export default LayoutLiveGame;
