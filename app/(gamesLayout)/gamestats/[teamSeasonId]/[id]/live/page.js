import LiveGameHeader from "./LiveGameHeader";

import OnBenchPlayers from "./OnBenchPlayers";
import OnFieldPlayers from "./OnFieldPlayers";
import PendingSubs from "./PendingSubs";
import TeamStats from "./TeamStats";

function page() {
  return (
    <>
      <LiveGameHeader />
      <OnFieldPlayers />
      <OnBenchPlayers />
      <div className='row-start-2 row-span-2 grid grid-rows-2 gap-4 h-full'>
        <TeamStats />
        <PendingSubs />
      </div>
    </>
  );
}

export default page;
