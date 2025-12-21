// app/(gamesLayout)/gamestats/[teamSeasonId]/[id]/GameProvider.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useAuthStore from "@/stores/authStore";
import { useUserContextStore } from "@/stores/userContextStore";
import { getTeamAccess, Permissions } from "@/lib/clientPermissions";

export default function GameProvider({ children }) {
  const { id, teamSeasonId } = useParams();
  const router = useRouter();

  // Auth & Context
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const { myTeams } = useUserContextStore();

  // Game Stores
  const initializeGame = useGameStore((s) => s.initializeGame);
  const loadPlayers = useGamePlayersStore((s) => s.loadPlayers);
  const gameIsLoading = useGameStore((s) => s.isLoading);
  const playersIsLoading = useGamePlayersStore((s) => s.isLoading);
  const game = useGameStore((s) => s.game);
  const players = useGamePlayersStore((s) => s.players);

  const [initError, setInitError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // ✅ STEP 1: Wait for hydration, then check auth & permissions
  useEffect(() => {
    // ⏳ Wait for Zustand to hydrate from localStorage
    if (!_hasHydrated) {
      return;
    }

    // ❌ Not authenticated - redirect to login
    if (!isAuthenticated || !user) {
      router.push(`/auth/login?redirect=/gamestats/${teamSeasonId}/${id}`);
      return;
    }

    // ✅ Check team access
    const access = getTeamAccess(user, myTeams, teamSeasonId);

    // ❌ Must have can_enter_stats permission
    if (!Permissions.canEnterStats(access)) {
      console.warn("Access denied: User lacks can_enter_stats permission");
      router.push(`/teams/${teamSeasonId}?error=insufficient_permissions`);
      return;
    }

    // ✅ Auth check passed
    setAuthChecked(true);
  }, [_hasHydrated, isAuthenticated, user, myTeams, teamSeasonId, id, router]);

  // ✅ STEP 2: Load Game Data (only after auth check passes)
  useEffect(() => {
    if (!authChecked) return;

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
  }, [authChecked, id, teamSeasonId, initializeGame, loadPlayers, router]);

  // ⏳ Waiting for hydration or auth check
  if (!_hasHydrated || !authChecked) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4'></div>
          <p className='text-muted text-lg'>Verifying access...</p>
        </div>
      </div>
    );
  }

  // ❌ Error state
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

  // ⏳ Loading game data
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

  // ✅ All checks passed - render children
  return children;
}
