// GameContext.js
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

// ==================== TYPES & CONSTANTS ====================

const GAME_STAGES = {
  BEFORE_START: "before_start",
  DURING_PERIOD: "during_period",
  BETWEEN_PERIODS: "between_periods",
  IN_STOPPAGE: "in_stoppage",
  END_GAME: "end_game",
};

const DEFAULT_GAME_SETTINGS = {
  periodCount: 2,
  periodDuration: 2400, // 40 min in seconds
  hasOvertime: true,
  overtimePeriods: 2,
  overtimeDuration: 600, // 10 min in seconds
  hasShootout: true,
  clockDirection: "up", // 'up' or 'down'
};

// ==================== CONTEXT ====================

const GameContext = createContext(null);

// ==================== PROVIDER ====================

export function GameLiveProvider({ children }) {
  const [game, setGame] = useState(() => loadGameFromStorage());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const syncQueueRef = useRef([]);
  const syncTimeoutRef = useRef(null);

  // ==================== PERSISTENCE ====================

  function loadGameFromStorage() {
    if (typeof window === "undefined") {
      return initializeGame();
    }

    try {
      const stored = window.localStorage.getItem("currentGame");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed;
      }
    } catch (error) {
      console.error("Error loading game from storage:", error);
    }
    return initializeGame();
  }

  function initializeGame(settings = DEFAULT_GAME_SETTINGS) {
    return {
      id: generateGameId(),
      settings: { ...DEFAULT_GAME_SETTINGS, ...settings },
      stage: GAME_STAGES.BEFORE_START,
      periods: [],
      stoppages: [],
      currentPeriodIndex: -1,
      currentStoppageIndex: -1,
      firstPeriodStartTime: null,
      // createdAt: Date.now(),
      // updatedAt: Date.now(),
    };
  }

  function generateGameId() {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save to localStorage whenever game changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem("currentGame", JSON.stringify(game));
    } catch (error) {
      console.error("Error saving game to storage:", error);
    }
  }, [game]);

  // ==================== DATABASE SYNC ====================

  async function syncToDatabase(updates, immediate = false) {
    if (immediate) {
      return await performSync(updates);
    } else {
      // Queue for batch sync
      syncQueueRef.current.push(updates);

      // Clear existing timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // Set new timeout for batch sync (3 seconds)
      syncTimeoutRef.current = setTimeout(() => {
        performBatchSync();
      }, 3000);
    }
  }

  async function performSync(updates, retries = 3) {
    setIsSyncing(true);
    setSyncError(null);

    try {
      // Placeholder API call - replace with your actual endpoint
      const response = await fetch("/api/games/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game.id,
          updates,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      setIsSyncing(false);
      return true;
    } catch (error) {
      console.error("Database sync error:", error);

      if (retries > 0) {
        // Exponential backoff: wait 2^(3-retries) seconds
        const delay = Math.pow(2, 4 - retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return performSync(updates, retries - 1);
      } else {
        setSyncError(error.message);
        setIsSyncing(false);
        return false;
      }
    }
  }

  async function performBatchSync() {
    if (syncQueueRef.current.length === 0) return;

    const batchUpdates = [...syncQueueRef.current];
    syncQueueRef.current = [];

    await performSync({ batch: batchUpdates });
  }

  // ==================== GAME STAGE CALCULATION ====================

  function calculateGameStage() {
    if (!game.firstPeriodStartTime) {
      return GAME_STAGES.BEFORE_START;
    }

    const currentPeriod = game.periods[game.currentPeriodIndex];

    // Check if we're in an active stoppage
    if (game.currentStoppageIndex >= 0) {
      const currentStoppage = game.stoppages[game.currentStoppageIndex];
      if (!currentStoppage.endTime) {
        return GAME_STAGES.IN_STOPPAGE;
      }
    }

    // Check if current period is active
    if (currentPeriod && !currentPeriod.endTime) {
      return GAME_STAGES.DURING_PERIOD;
    }

    // Check if game is over
    const totalPeriods =
      game.settings.periodCount +
      (game.settings.hasOvertime ? game.settings.overtimePeriods : 0);

    if (game.currentPeriodIndex >= totalPeriods - 1 && currentPeriod?.endTime) {
      return GAME_STAGES.END_GAME;
    }

    // Must be between periods
    return GAME_STAGES.BETWEEN_PERIODS;
  }

  // ==================== TIME CALCULATIONS ====================

  function calculateGameTime() {
    if (!game.firstPeriodStartTime) return 0;

    const now = Date.now();
    return Math.floor((now - game.firstPeriodStartTime) / 1000);
  }

  function calculatePeriodTime() {
    const currentPeriod = game.periods[game.currentPeriodIndex];
    if (!currentPeriod || !currentPeriod.startTime) return 0;

    const now = currentPeriod.endTime || Date.now();
    const elapsedRealTime = Math.floor((now - currentPeriod.startTime) / 1000);

    if (game.settings.clockDirection === "up") {
      // Count up: subtract stoppage time where clock should pause
      const stoppageTime = calculateStoppageTimeForPeriod(
        game.currentPeriodIndex
      );
      return elapsedRealTime - stoppageTime;
    } else {
      // Count down: period duration minus (elapsed - stoppage)
      const stoppageTime = calculateStoppageTimeForPeriod(
        game.currentPeriodIndex
      );
      const netElapsed = elapsedRealTime - stoppageTime;
      const periodDuration = getPeriodDuration(game.currentPeriodIndex);
      return Math.max(0, periodDuration - netElapsed);
    }
  }

  function calculateStoppageTimeForPeriod(periodIndex) {
    const period = game.periods[periodIndex];
    if (!period) return 0;

    const periodStartGameTime = calculateGameTimeAtTimestamp(period.startTime);
    const periodEndGameTime = period.endTime
      ? calculateGameTimeAtTimestamp(period.endTime)
      : calculateGameTime();

    return game.stoppages
      .filter((s) => {
        const stoppageStart = s.startTime;
        const stoppageEnd = s.endTime || calculateGameTime();
        return (
          s.shouldPausePeriodClock &&
          stoppageStart >= periodStartGameTime &&
          stoppageStart < periodEndGameTime
        );
      })
      .reduce((total, s) => {
        const duration = (s.endTime || calculateGameTime()) - s.startTime;
        return total + duration;
      }, 0);
  }

  function calculateGameTimeAtTimestamp(timestamp) {
    if (!game.firstPeriodStartTime) return 0;
    return Math.floor((timestamp - game.firstPeriodStartTime) / 1000);
  }

  function getPeriodDuration(periodIndex) {
    const regularPeriods = game.settings.periodCount;
    if (periodIndex < regularPeriods) {
      return game.settings.periodDuration;
    }
    return game.settings.overtimeDuration;
  }

  // ==================== GAME ACTIONS ====================

  const startGame = useCallback(async () => {
    try {
      const now = Date.now();
      const updates = {
        firstPeriodStartTime: now,
        currentPeriodIndex: 0,
        periods: [
          {
            index: 0,
            startTime: now,
            endTime: null,
          },
        ],
        stage: GAME_STAGES.DURING_PERIOD,
        updatedAt: now,
      };

      setGame((prev) => ({ ...prev, ...updates }));
      await syncToDatabase(updates, true);
    } catch (error) {
      console.error("Error starting game:", error);
      throw error;
    }
  }, [game.id]);

  const endPeriod = useCallback(async () => {
    try {
      const now = Date.now();
      const updatedPeriods = [...game.periods];
      updatedPeriods[game.currentPeriodIndex] = {
        ...updatedPeriods[game.currentPeriodIndex],
        endTime: now,
      };

      const updates = {
        periods: updatedPeriods,
        updatedAt: now,
      };

      setGame((prev) => ({ ...prev, ...updates }));
      await syncToDatabase(updates, true);
    } catch (error) {
      console.error("Error ending period:", error);
      throw error;
    }
  }, [game.periods, game.currentPeriodIndex]);

  const startNextPeriod = useCallback(async () => {
    try {
      const now = Date.now();
      const nextIndex = game.currentPeriodIndex + 1;

      const newPeriod = {
        index: nextIndex,
        startTime: now,
        endTime: null,
      };

      const updates = {
        currentPeriodIndex: nextIndex,
        periods: [...game.periods, newPeriod],
        updatedAt: now,
      };

      setGame((prev) => ({ ...prev, ...updates }));
      await syncToDatabase(updates, true);
    } catch (error) {
      console.error("Error starting next period:", error);
      throw error;
    }
  }, [game.currentPeriodIndex, game.periods]);

  const startStoppage = useCallback(
    async (shouldPausePeriodClock = true, reason = "") => {
      try {
        const gameTime = calculateGameTime();
        const newStoppage = {
          id: `stoppage_${Date.now()}`,
          startTime: gameTime,
          endTime: null,
          shouldPausePeriodClock,
          reason,
          periodIndex: game.currentPeriodIndex,
        };

        const updates = {
          stoppages: [...game.stoppages, newStoppage],
          currentStoppageIndex: game.stoppages.length,
          updatedAt: Date.now(),
        };

        setGame((prev) => ({ ...prev, ...updates }));
        await syncToDatabase(updates, true);
      } catch (error) {
        console.error("Error starting stoppage:", error);
        throw error;
      }
    },
    [game.stoppages, game.currentPeriodIndex]
  );

  const endStoppage = useCallback(async () => {
    try {
      if (game.currentStoppageIndex < 0) {
        throw new Error("No active stoppage to end");
      }

      const gameTime = calculateGameTime();
      const updatedStoppages = [...game.stoppages];
      updatedStoppages[game.currentStoppageIndex] = {
        ...updatedStoppages[game.currentStoppageIndex],
        endTime: gameTime,
      };

      const updates = {
        stoppages: updatedStoppages,
        currentStoppageIndex: -1,
        updatedAt: Date.now(),
      };

      setGame((prev) => ({ ...prev, ...updates }));
      await syncToDatabase(updates, true);
    } catch (error) {
      console.error("Error ending stoppage:", error);
      throw error;
    }
  }, [game.stoppages, game.currentStoppageIndex]);

  const adjustClock = useCallback(
    async (seconds) => {
      try {
        // Adjust the first period start time to simulate clock adjustment
        const adjustment = seconds * 1000; // Convert to milliseconds

        const updates = {
          firstPeriodStartTime: game.firstPeriodStartTime + adjustment,
          updatedAt: Date.now(),
        };

        setGame((prev) => ({ ...prev, ...updates }));
        await syncToDatabase(updates, true);
      } catch (error) {
        console.error("Error adjusting clock:", error);
        throw error;
      }
    },
    [game.firstPeriodStartTime]
  );

  const resetGame = useCallback(async (newSettings) => {
    try {
      const newGame = initializeGame(newSettings);
      setGame(newGame);
      await syncToDatabase({ action: "reset", newGameId: newGame.id }, true);
    } catch (error) {
      console.error("Error resetting game:", error);
      throw error;
    }
  }, []);

  const queueBatchUpdate = useCallback((updates) => {
    setGame((prev) => ({ ...prev, ...updates, updatedAt: Date.now() }));
    syncToDatabase(updates, false);
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
  // ==================== CONTEXT VALUE ====================

  const value = {
    // State
    game,
    gameStage: calculateGameStage(),
    isSyncing,
    syncError,

    // Time calculations
    getGameTime: calculateGameTime,
    getPeriodTime: calculatePeriodTime,
    getPeriodDuration,

    // Actions
    startGame,
    endPeriod,
    startNextPeriod,
    startStoppage,
    endStoppage,
    adjustClock,
    resetGame,
    queueBatchUpdate,
    formatTime,
    // Constants
    GAME_STAGES,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// ==================== HOOKS ====================

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

// export function useGameTime() {
//   const { getGameTime } = useGame();
//   const [gameTime, setGameTime] = useState(getGameTime());

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setGameTime(getGameTime());
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [getGameTime]);

//   return gameTime;
// }

// export function useGameStage() {
//   const { gameStage } = useGame();
//   return gameStage;
// }

// export function usePeriodTime() {
//   const { getPeriodTime } = useGame();
//   const [periodTime, setPeriodTime] = useState(getPeriodTime());

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setPeriodTime(getPeriodTime());
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [getPeriodTime]);

//   return periodTime;
// }
