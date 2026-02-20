"use client";

import useGameStore from "@/stores/gameStore";

function GameHeader({ className = "" }) {
  const game = useGameStore((s) => s.game);
  
  // Return skeleton/loader if game not loaded yet
  if (!game) return <div className="h-12 bg-white/5 animate-pulse rounded-xl w-full"></div>;

  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 text-white shadow-lg ${className}`}>
      <div className="text-[10px] font-bold tracking-widest uppercase text-white/50 mb-1">
        Playing Against
      </div>
      <h2 className='text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80 text-center leading-tight'>
        {game.opponentName}
      </h2>
    </div>
  );
}

export default GameHeader;
