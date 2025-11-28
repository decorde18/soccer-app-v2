// app/games/[id]/GameProvider.jsx (NEW - Client Component)
"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";

export default function GameProvider({ children }) {
  const { id, teamSeasonId } = useParams();
  const router = useRouter();

  const initializeGame = useGameStore((s) => s.initializeGame);
  const loadPlayers = useGamePlayersStore((s) => s.loadPlayers);
  const isLoading = useGameStore((s) => s.isLoading);
  const game = useGameStore((s) => s.game);

  useEffect(() => {
    const initializeGameData = async () => {
      // Initialize game
      const result = await initializeGame(id, teamSeasonId);

      // Redirect if game not found
      if (result?.notFound) {
        router.push("/games");
        return;
      }

      // Load players for this game
      await loadPlayers(id, teamSeasonId);
    };

    initializeGameData();
  }, [id, initializeGame, loadPlayers, router, teamSeasonId]);

  // Loading state
  if (isLoading || !game) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4'></div>
          <p className='text-muted text-lg'>Loading game...</p>
        </div>
      </div>
    );
  }

  return children;
}
