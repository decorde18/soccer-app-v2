// app/games/[id]/GameProvider.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";

export default function GameProvider({ children }) {
  const { id, teamSeasonId } = useParams();
  const router = useRouter();

  const initializeGame = useGameStore((s) => s.initializeGame);
  const loadPlayers = useGamePlayersStore((s) => s.loadPlayers);

  const gameIsLoading = useGameStore((s) => s.isLoading);
  const playersIsLoading = useGamePlayersStore((s) => s.isLoading);
  const game = useGameStore((s) => s.game);
  const players = useGamePlayersStore((s) => s.players);

  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const initializeGameData = async () => {
      try {
        // Initialize game first
        const result = await initializeGame(id, teamSeasonId);

        // Redirect if game not found
        if (result?.notFound) {
          router.push("/games");
          return;
        }

        // Then load players for this game
        await loadPlayers(id, teamSeasonId);
      } catch (error) {
        console.error("Error initializing game:", error);
        setInitError(error.message);
      }
    };

    initializeGameData();
  }, [id, initializeGame, loadPlayers, router, teamSeasonId]);

  // Show error state
  if (initError) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <div className='text-center'>
          <div className='text-danger text-xl font-bold mb-4'>Error</div>
          <p className='text-muted'>{initError}</p>
          <button
            onClick={() => router.push("/games")}
            className='mt-4 px-4 py-2 bg-primary text-white rounded'
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  // Loading state - wait for BOTH game AND players
  if (gameIsLoading || playersIsLoading || !game || players.length === 0) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4'></div>
          <p className='text-muted text-lg'>Loading game...</p>
          {game && players.length === 0 && (
            <p className='text-muted text-sm mt-2'>Loading players...</p>
          )}
        </div>
      </div>
    );
  }

  return children;
}
