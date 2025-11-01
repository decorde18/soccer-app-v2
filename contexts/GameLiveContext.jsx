// GameContext.js
"use client";

import { apiFetch } from "@/app/api/fetcher";
import { changeSecondsToMmss } from "@/lib/dateUtils";
import { mockGame } from "@/mockData";
import { useParams, useRouter } from "next/navigation";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

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
  hasOvertime: false,
  overtimePeriods: 2,
  overtimeDuration: 600, // 10 min in seconds
  hasShootout: true,
  clockDirection: "up", // 'up' or 'down'
};

const GameContext = createContext();

export function GameLiveProvider({ children }) {
  const router = useRouter(); // Initialize the router hook

  const { id } = useParams();
  const [game, setGame] = useState({});

  // Only define the DB fetch function once (can be outside the component/context)
  // Function to fetch from DB and check for 404
  const fetchGameFromDB = async (gameId) => {
    try {
      const gameData = await apiFetch("games", "GET", null, gameId);

      return gameData;
    } catch (err) {
      // Check if the error is a 404 (Not Found)
      if (err.message.includes("404")) {
        console.warn(`Game ${gameId} not found in DB.`);
        return { notFound: true }; // Signal that the game was not found
      }
      console.error(`Failed to load game ${gameId} from DB:`, err);
      return null; // Return null for other severe errors
    }
  };
  // Utility: Simple debounce function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };
  // Create a stable debounced PUT function outside of the component/context
  // PUT logic: It expects the full game object with the ID in the body.
  const debouncedPutGame = debounce(async (gameData) => {
    if (!gameData || !gameData.id) return;
    try {
      console.log(`Auto-saving game ${gameData.id} to DB...`);
      // Uses PUT /api/games with full gameData in the body
      await apiFetch("games", "PUT", gameData);
    } catch (error) {
      console.error("Failed to auto-save game to DB:", error);
      // Implement retry logic or a user notification here
    }
  }, 2000); // 2000ms (2 seconds) debounce delay

  useEffect(() => {
    const initializeGameData = async () => {
      // 1. ALWAYS TRY TO FETCH FROM DB FIRST
      const dbResponse = await fetchGameFromDB(id);

      // Check 1: DB existence check (Redirect is highest priority)
      console.log(dbResponse);
      if (!dbResponse || dbResponse?.notFound) {
        console.log("Game ID not found in DB. Redirecting to /games.");
        router.push("/games");
        return; // Stop initialization
      }

      const dbGame = dbResponse;
      const localGame = loadGameFromStorage();
      let finalGame = null;

      // Check 2: DB found, now prioritize local storage if it matches
      if (localGame && localGame.id === id) {
        // Case A: Local storage game exists and matches ID (highest priority data)
        console.log("DB game exists. Using local storage game.");
        finalGame = localGame;
      } else if (dbGame) {
        // Case B: Local storage is missing or mismatching, but DB game was found.
        console.log("DB game exists. Using data fetched from DB.");
        finalGame = dbGame;
      } else {
        // Case C: DB load failed for other reasons (e.g., network error, not 404)
        console.warn("DB load failed. Initializing new game locally.");
        finalGame = initializeGame();
      }

      setGame(finalGame);
    };

    initializeGameData();
  }, [id]);

  // The local save useEffect remains unchanged:
  useEffect(() => {
    if (typeof window === "undefined" || !game || !game.id) return;
    try {
      window.localStorage.setItem("game", JSON.stringify(game));
    } catch (error) {
      console.error("Error saving game to storage:", error);
    }
  }, [game]);
  useEffect(() => {
    // 1. Skip if the game state hasn't been fully initialized yet
    if (!game || !game.id) return;

    // 2. Call the debounced function with the current game state
    // The debounce will ensure the PUT only fires 2 seconds after the last change.
    debouncedPutGame(game);

    // Clean up the debounce timeout on unmount or before next effect run
    return () => debouncedPutGame.cancel && debouncedPutGame.cancel();
  }, [game]); // Triggers whenever any part of the 'game' object changes

  function loadGameFromStorage() {
    if (typeof window === "undefined") return null;

    try {
      const stored = window.localStorage.getItem("game");

      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure the parsed object looks like a valid game before returning
        if (parsed && parsed.id) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Error loading game from storage:", error);
    }
    return null; // Return null if it fails to load or is invalid
  }
  function initializeGame(settings = DEFAULT_GAME_SETTINGS) {
    return {
      id,
      settings: { ...DEFAULT_GAME_SETTINGS, ...settings },
      stage: GAME_STAGES.BEFORE_START,
      periods: [],
      stoppages: [],
      currentPeriodIndex: -1,
      currentStoppageIndex: -1,
      firstPeriodStartTime: null,
    };
  }
  // Save to localStorage whenever game changes
  // useEffect(() => {
  //   if (typeof window === "undefined") return;

  //   try {
  //     window.localStorage.setItem("game", JSON.stringify(game));
  //   } catch (error) {
  //     console.error("Error saving game to storage:", error);
  //   }
  // }, [game]);

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
      // await syncToDatabase(updates, true);
    } catch (error) {
      console.error("Error starting game:", error);
      throw error;
    }
  }, [game.id]);

  const endPeriod = useCallback(async () => {
    console.log("end period");
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
      // await syncToDatabase(updates, true);
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
      // await syncToDatabase(updates, true);
    } catch (error) {
      console.error("Error starting next period:", error);
      throw error;
    }
  }, [game.currentPeriodIndex, game.periods]);
  // ============================================
  // FORMATTING UTILITIES
  // ============================================

  const value = {
    game,
    gameId: id,
    gameStage: calculateGameStage(),
    gameTime: calculateGameTime(),
    getPeriodTime: calculatePeriodTime,
    startGame,
    startNextPeriod,
    endPeriod,

    formatTime: changeSecondsToMmss,
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
