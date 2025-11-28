"use client";

import useGameStore from "@/stores/gameStore";

function GameHeader() {
  const game = useGameStore((s) => s.game);
  return (
    <div className='bg-white flex justify-center align-middle max-w-lg px-6 pt-2 rounded-xl shadow-md mx-auto my-2'>
      <h2 className='text-2xl font-bold text-primary  text-center'>
        {game.opponentName}
      </h2>
    </div>
  );
}

export default GameHeader;
