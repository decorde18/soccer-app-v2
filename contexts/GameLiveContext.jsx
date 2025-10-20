// GameContext.js
"use client";
import { mockGame } from "@/mockData";
import React, { createContext, useContext, useState, useCallback } from "react";

const GameContext = createContext();

export function GameLiveProvider({ children }) {
  const [game, setGame] = useState(mockGame);

  // ============================================
  // TIME CALCULATION UTILITIES
  // ============================================
  // These calculate time based on actual timestamps, not intervals

  const getCurrentPeriod = useCallback(() => {
    return game.periods.find((p) => p.number === game.currentPeriod);
  }, [game.periods, game.currentPeriod]);

  const calculatePeriodTime = useCallback(() => {
    const period = getCurrentPeriod();
    if (!period || !period.startTime) return 0;

    const now = Date.now();
    const elapsed = Math.floor((now - period.startTime) / 1000);

    // Subtract stoppage time
    const stoppageTime =
      period.stoppages?.reduce((total, stoppage) => {
        if (stoppage.endTime) {
          return total + (stoppage.endTime - stoppage.startTime);
        }
        // Current stoppage is ongoing
        return total + (Math.floor(now / 1000) - stoppage.startTime);
      }, 0) || 0;

    return elapsed - stoppageTime;
  }, [getCurrentPeriod]);

  const calculateGameTime = useCallback(() => {
    // Sum all completed periods + current period time
    const completedTime = game.periods
      .filter((p) => p.completed)
      .reduce((total, period) => {
        return total + (period.duration || 0);
      }, 0);

    return completedTime + calculatePeriodTime();
  }, [game.periods, calculatePeriodTime]);

  const calculatePlayerTime = useCallback(
    (playerId, location = "onField") => {
      const period = getCurrentPeriod();
      if (!period) return 0;

      // Find the player's most recent substitution
      const player = period[location]?.find((p) => p.id === playerId);
      if (!player || !player.startTime) return 0;

      const now = Date.now();
      return Math.floor((now - player.startTime) / 1000);
    },
    [getCurrentPeriod]
  );

  // ============================================
  // PERIOD MANAGEMENT
  // ============================================

  const startPeriod = useCallback(() => {
    const now = Date.now();
    setGame((prev) => {
      const updatedPeriods = prev.periods.map((period) =>
        period.number === prev.currentPeriod
          ? { ...period, startTime: now, isRunning: true }
          : period
      );
      return { ...prev, periods: updatedPeriods, isRunning: true };
    });
  }, []);

  const endPeriod = useCallback(() => {
    setGame((prev) => {
      const period = prev.periods.find((p) => p.number === prev.currentPeriod);
      const periodTime = calculatePeriodTime();

      const updatedPeriods = prev.periods.map((p) =>
        p.number === prev.currentPeriod
          ? { ...p, completed: true, isRunning: false, duration: periodTime }
          : p
      );

      return { ...prev, periods: updatedPeriods, isRunning: false };
    });
  }, [calculatePeriodTime]);

  const nextPeriod = useCallback(() => {
    endPeriod();

    setGame((prev) => {
      if (prev.currentPeriod >= prev.totalPeriods) return prev;
      return { ...prev, currentPeriod: prev.currentPeriod + 1 };
    });
  }, [endPeriod]);

  // ============================================
  // CLOCK CONTROL
  // ============================================

  const toggleGameClock = useCallback(() => {
    const now = Math.floor(Date.now() / 1000);

    setGame((prev) => {
      const period = prev.periods.find((p) => p.number === prev.currentPeriod);

      if (prev.isRunning) {
        // Stopping the clock - start a stoppage
        const updatedPeriods = prev.periods.map((p) =>
          p.number === prev.currentPeriod
            ? {
                ...p,
                stoppages: [
                  ...(p.stoppages || []),
                  { startTime: now, endTime: null },
                ],
              }
            : p
        );
        return { ...prev, isRunning: false, periods: updatedPeriods };
      } else {
        // Starting the clock - end the current stoppage
        const updatedPeriods = prev.periods.map((p) => {
          if (p.number === prev.currentPeriod) {
            const stoppages = [...(p.stoppages || [])];
            const lastStoppage = stoppages[stoppages.length - 1];
            if (lastStoppage && !lastStoppage.endTime) {
              lastStoppage.endTime = now;
            }
            return { ...p, stoppages };
          }
          return p;
        });
        return { ...prev, isRunning: true, periods: updatedPeriods };
      }
    });
  }, []);

  // ============================================
  // SUBSTITUTIONS
  // ============================================

  const substitutePlayer = useCallback(
    (playerOut, playerIn) => {
      const now = Date.now();
      const gameTime = calculateGameTime();

      setGame((prev) => {
        const updatedPeriods = prev.periods.map((period) => {
          if (period.number === prev.currentPeriod) {
            // Move playerOut from onField to onBench
            const onField = period.onField.filter((p) => p.id !== playerOut.id);
            const onBench = [
              ...period.onBench.filter((p) => p.id !== playerIn.id),
              { ...playerOut, startTime: now },
            ];

            // Add playerIn to onField
            onField.push({ ...playerIn, startTime: now });

            // Record the substitution
            const substitutions = [
              ...(period.substitutions || []),
              {
                time: gameTime,
                playerOut: playerOut.id,
                playerIn: playerIn.id,
                timestamp: now,
              },
            ];

            return { ...period, onField, onBench, substitutions };
          }
          return period;
        });

        return { ...prev, periods: updatedPeriods };
      });
    },
    [calculateGameTime]
  );

  // ============================================
  // SCORING
  // ============================================

  const updateScore = useCallback((team, score) => {
    setGame((prev) => ({
      ...prev,
      [team === "home" ? "homeScore" : "awayScore"]: score,
    }));
  }, []);

  const incrementScore = useCallback((team, amount = 1) => {
    setGame((prev) => ({
      ...prev,
      [team === "home" ? "homeScore" : "awayScore"]:
        prev[team === "home" ? "homeScore" : "awayScore"] + amount,
    }));
  }, []);

  // ============================================
  // FORMATTING UTILITIES
  // ============================================

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  const value = {
    game,
    // Time calculations (no state, just calculations)
    calculatePeriodTime,
    calculateGameTime,
    calculatePlayerTime,
    // Period management
    startPeriod,
    endPeriod,
    nextPeriod,
    // Clock control
    toggleGameClock,
    // Substitutions
    substitutePlayer,
    // Scoring
    updateScore,
    incrementScore,
    // Utilities
    formatTime,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
