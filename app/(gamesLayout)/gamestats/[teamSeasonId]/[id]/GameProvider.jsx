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
      <div className='flex items-center justify-center min-h-screen bg-slate-50'>
        <div className='flex flex-col items-center gap-4'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
          <p className='text-slate-500 font-medium'>Verifying access...</p>
        </div>
      </div>
    );
  }

  // ❌ Error state
  if (initError) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-slate-50 p-4'>
        <div className='text-center max-w-md bg-white p-8 rounded-2xl shadow-lg border border-slate-100'>
          <div className='w-12 h-12 bg-red-100 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-4'>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className='text-lg font-bold text-slate-800 mb-2'>Unable to Load Game</h3>
          <p className='text-slate-500 mb-6'>{initError}</p>
          <button
            onClick={() => router.push("/games")}
            className='px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors w-full'
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
      <div className='flex items-center justify-center min-h-screen bg-slate-50'>
        <div className='flex flex-col items-center gap-4'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
          <p className='text-slate-500 font-medium'>Loading game data...</p>
        </div>
      </div>
    );
  }

  // ✅ All checks passed - render children
  return children;
}
