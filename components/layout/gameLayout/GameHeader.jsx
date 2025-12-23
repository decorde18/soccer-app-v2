"use client";

import useGameStore from "@/stores/gameStore";

function GameHeader() {
  const game = useGameStore((s) => s.game);
  return (
    <div className='bg-white flex justify-center align-middle max-w-lg my-1 px-6 py-2 rounded-xl shadow-md mx-auto '>
      <h2 className='text-2xl font-bold text-primary  text-center'>
        {game.opponentName}
      </h2>
    </div>
  );
}

export default GameHeader;
