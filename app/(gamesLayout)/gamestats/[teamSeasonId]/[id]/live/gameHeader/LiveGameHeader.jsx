"use client";
import React, { useState, useEffect, useTransition } from "react";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import useGameStore from "@/stores/gameStore";
import useGameSubsStore from "@/stores/gameSubsStore";
import { useParams, useRouter } from "next/navigation";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import LiveGameHeaderClock from "./LiveGameHeaderClock";

function LiveGameHeader() {
  const { id, teamSeasonId } = useParams();
  const game = useGameStore((s) => s.game);
  const players = useGamePlayersStore((s) => s.players);
  const gameStage = useGameStore((s) => s.getGameStage());
  const endPeriod = useGameStore((s) => s.endPeriod);
  const startPeriod = useGameStore((s) => s.startNextPeriod);
  const periodNumber = useGameStore((s) => s.getCurrentPeriodNumber());
  const getPendingSubs = useGameSubsStore((s) => s.getPendingSubs);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const [showPendingSubsDialog, setShowPendingSubsDialog] = useState(false);
  const [pendingSubsCount, setPendingSubsCount] = useState(0);

  const isGameLive = gameStage === "during_period";
  const isGameEnded = gameStage === "end_game";

  const isLineupValid =
    players.filter((p) => p.gameStatus === "starter").length ===
      game.settings.playersOnField - 1 &&
    players.filter((p) => p.gameStatus === "goalkeeper").length === 1;

  // Reset loading state when navigation completes
  useEffect(() => {
    setIsNavigating(false);
  }, [id, teamSeasonId]);

  const handleViewStats = () => {
    startTransition(() => {
      setIsNavigating(true);
      router.push(`/gamestats/${id}/${teamSeasonId}/summary`);
    });
  };

  const handleUpdateLineup = () => {
    startTransition(() => {
      setIsNavigating(true);
      router.push(`/gamestats/${teamSeasonId}/${id}/lineup`);
    });
  };

  const handleStartPeriod = async () => {
    if (!game?.game_id) return;

    // Check for pending subs before starting period
    const pendingSubs = await getPendingSubs();

    if (pendingSubs && pendingSubs.length > 0) {
      setPendingSubsCount(pendingSubs.length);
      setShowPendingSubsDialog(true);
    } else {
      // No pending subs, start period immediately
      await startPeriod();
    }
  };

  const handleConfirmStartWithSubs = async () => {
    setShowPendingSubsDialog(false);
    // Navigate to between periods page where they can manage subs
    startTransition(() => {
      setIsNavigating(true);
      router.push(`/gamestats/${teamSeasonId}/${id}/between-periods`);
    });
  };

  const handleStartWithoutSubs = async () => {
    setShowPendingSubsDialog(false);
    await startPeriod();
  };

  // Determine button props based on game state
  const getButtonProps = () => {
    const isLoading = isNavigating || isPending;

    if (!isLineupValid) {
      return {
        variant: "danger",
        onClick: handleUpdateLineup,
        disabled: isLoading,
        children: isLoading ? "Loading..." : "Set Lineup",
      };
    }

    if (isGameLive) {
      return {
        variant: "danger",
        onClick: endPeriod,
        disabled: isLoading,
        children: isLoading ? "Loading..." : "END PERIOD",
      };
    }

    if (isGameEnded) {
      return {
        variant: "outline",
        onClick: handleViewStats,
        disabled: isLoading,
        children: isLoading ? "Loading..." : "Go To Game Stats",
      };
    }

    return {
      onClick: handleStartPeriod,
      disabled: isLoading,
      children: isLoading ? "Loading..." : "START",
    };
  };

  return (
    <>
      <header className='relative col-span-2 row-start-1 flex items-center justify-between px-4 py-3 shadow-lg bg-secondary text-background m-0 rounded'>
        {/* Left Section – Hamburger */}
        <div className='flex-shrink-0 w-10 flex items-center justify-start'></div>

        {/* Center Section – Score + Clock */}
        <div className='absolute left-1/2 transform -translate-x-1/2 flex items-center gap-8'>
          {/* Home Team */}
          <div className='text-center min-w-[80px]'>
            <div className='text-xs font-medium tracking-wider opacity-80 mb-1'>
              HOME
            </div>
            <div className='text-5xl font-bold tabular-nums'>
              {game.homeScore}
            </div>
          </div>

          {/* Clock */}
          {isGameLive ? (
            <div className='flex flex-col items-center px-8'>
              <div className='text-4xl font-bold tracking-wider tabular-nums'>
                <LiveGameHeaderClock />
              </div>
              <div className='text-xs font-medium tracking-wider opacity-70 mt-1'>
                PERIOD {periodNumber}
              </div>
            </div>
          ) : (
            <div className='text-center'>
              {gameStage === "before_start"
                ? "WAITING TO START GAME"
                : gameStage === "in_stoppage"
                ? "Game Is Paused"
                : gameStage === "end_game"
                ? "END OF GAME"
                : "PERIOD BREAK"}
            </div>
          )}

          {/* Away Team */}
          <div className='text-center min-w-[80px]'>
            <div className='text-xs font-medium tracking-wider opacity-80 mb-1'>
              AWAY
            </div>
            <div className='text-5xl font-bold tabular-nums'>
              {game.awayScore}
            </div>
          </div>
        </div>

        {/* Right Section – Fixed Width */}
        <div className='flex-shrink-0 w-[120px] flex justify-end'>
          <Button {...getButtonProps()} />
        </div>
      </header>

      {/* Pending Subs Dialog */}
      <Dialog
        isOpen={showPendingSubsDialog}
        onClose={() => setShowPendingSubsDialog(false)}
        title='Pending Substitutions'
        type='confirm'
        message={`You have ${pendingSubsCount} pending substitution${
          pendingSubsCount !== 1 ? "s" : ""
        }.\n\nWould you like to review and confirm them before starting the period?`}
        confirmText='Review Subs'
        cancelText='Start Without'
        onConfirm={handleConfirmStartWithSubs}
        onCancel={handleStartWithoutSubs}
      />
    </>
  );
}

export default LiveGameHeader;
