"use client";

import useGameStore from "@/stores/gameStore";

function GameHeader() {
  const game = useGameStore((s) => s.game);
  return (
    <div className='bg-white flex justify-center align-middle max-w-lg p-6 rounded-xl mb-6 shadow-md mx-auto mt-2'>
      <h1 className='text-3xl font-bold text-primary mb-2 text-center'>
        {game.opponentName}
      </h1>
    </div>
  );
}

export default GameHeader;
