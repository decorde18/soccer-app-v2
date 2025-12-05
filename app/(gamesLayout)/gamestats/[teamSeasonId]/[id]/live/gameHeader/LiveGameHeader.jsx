"use client";
import React, { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import useGameStore from "@/stores/gameStore";
import useGameSubsStore from "@/stores/gameSubsStore";
import LiveGameHeaderClock from "./LiveGameHeaderClock";

function LiveGameHeader() {
  const game = useGameStore((s) => s.game);
  const gameStage = useGameStore((s) => s.getGameStage());
  const endPeriod = useGameStore((s) => s.endPeriod);
  const startPeriod = useGameStore((s) => s.startNextPeriod);
  const periodNumber = useGameStore((s) => s.getCurrentPeriodNumber());
  const getPendingSubs = useGameSubsStore((s) => s.getPendingSubs);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showPendingSubsDialog, setShowPendingSubsDialog] = useState(false);
  const [pendingSubsCount, setPendingSubsCount] = useState(0);

  const isGameLive = gameStage === "during_period";
  const isGameEnded = gameStage === "end_game";
  const isBetweenPeriods = gameStage === "between_periods";
  const isBeforeStart = gameStage === "before_start";

  // Check for pending subs periodically when between periods
  useEffect(() => {
    if (!isBetweenPeriods || !game?.game_id) return;

    const checkPendingSubs = async () => {
      const subs = await getPendingSubs();
      setPendingSubsCount(subs?.length || 0);
    };

    checkPendingSubs();
    const interval = setInterval(checkPendingSubs, 2000);

    return () => clearInterval(interval);
  }, [isBetweenPeriods, game?.game_id, getPendingSubs]);

  const handleStartPeriod = async () => {
    if (!game?.game_id || isProcessing) return;

    setIsProcessing(true);

    try {
      // Check for pending subs before starting period
      const pendingSubs = await getPendingSubs();

      if (pendingSubs && pendingSubs.length > 0) {
        setPendingSubsCount(pendingSubs.length);
        setShowPendingSubsDialog(true);
        setIsProcessing(false);
      } else {
        // No pending subs, start period immediately
        await startPeriod();
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error starting period:", error);
      setIsProcessing(false);
    }
  };

  const handleStartWithoutSubs = async () => {
    setShowPendingSubsDialog(false);
    setIsProcessing(true);
    try {
      await startPeriod();
    } catch (error) {
      console.error("Error starting period:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndPeriod = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      await endPeriod();
    } catch (error) {
      console.error("Error ending period:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Determine button display based on game state
  const getButtonProps = () => {
    if (isGameLive) {
      return {
        variant: "danger",
        onClick: handleEndPeriod,
        disabled: isProcessing,
        children: isProcessing ? "Ending..." : "END PERIOD",
      };
    }

    if (isGameEnded) {
      return {
        variant: "outline",
        onClick: null,
        disabled: true,
        children: "Game Complete",
      };
    }

    // Before start or between periods
    return {
      variant: "success",
      onClick: handleStartPeriod,
      disabled: isProcessing,
      children: isProcessing ? "Starting..." : "START",
    };
  };

  if (!game) return null;

  return (
    <>
      <header className='relative col-span-2 row-start-1 flex items-center justify-between px-4 py-3 shadow-lg bg-secondary text-background m-0 rounded'>
        {/* Left Section – Placeholder */}
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

          {/* Clock / Status */}
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
              <div className='text-lg font-semibold'>
                {isBeforeStart
                  ? "READY TO START"
                  : gameStage === "in_stoppage"
                  ? "GAME PAUSED"
                  : isGameEnded
                  ? "GAME COMPLETE"
                  : "PERIOD BREAK"}
              </div>
              {isBetweenPeriods && pendingSubsCount > 0 && (
                <div className='mt-2 flex items-center justify-center gap-2'>
                  <div className='relative'>
                    <span className='flex h-3 w-3'>
                      <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75'></span>
                      <span className='relative inline-flex rounded-full h-3 w-3 bg-accent'></span>
                    </span>
                  </div>
                  <span className='text-sm font-medium text-accent'>
                    {pendingSubsCount} Pending Sub
                    {pendingSubsCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
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

        {/* Right Section – Action Button */}
        <div className='flex-shrink-0 w-[120px] flex justify-end'>
          <Button {...getButtonProps()} />
        </div>
      </header>

      {/* Pending Subs Dialog */}
      <Dialog
        isOpen={showPendingSubsDialog}
        onClose={() => setShowPendingSubsDialog(false)}
        title='Pending Substitutions'
        type='warning'
        message={`You have ${pendingSubsCount} pending substitution${
          pendingSubsCount !== 1 ? "s" : ""
        }.\n\nWould you like to confirm them now before starting the period?`}
        confirmText='Keep Pending'
        cancelText='Start With CHanges'
        onConfirm={() => setShowPendingSubsDialog(false)}
        onCancel={handleStartWithoutSubs}
      />
    </>
  );
}

export default LiveGameHeader;
