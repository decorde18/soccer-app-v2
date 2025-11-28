// stores/gameStore.js
import { create } from "zustand";
import { apiFetch } from "@/app/api/fetcher";

const GAME_STAGES = {
  BEFORE_START: "before_start",
  DURING_PERIOD: "during_period",
  BETWEEN_PERIODS: "between_periods",
  IN_STOPPAGE: "in_stoppage",
  END_GAME: "end_game",
};

const DEFAULT_GAME_SETTINGS = {
  playersOnField: 11,
  periodCount: 2,
  periodDuration: 2400,
  hasOvertime: false,
  overtimePeriods: 2,
  overtimeDuration: 600,
  hasShootout: true,
  clockDirection: "up",
};

// Debounce utility
const debounce = (func, delay) => {
  let timeoutId;
  const debounced = (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
};

const useGameStore = create((set, get) => {
  // Create debounced save function
  const debouncedSave = debounce(async (gameData) => {
    if (!gameData?.id) return;
    try {
      console.log(`Auto-saving game ${gameData.id} to DB...`);
      await apiFetch("games", "PUT", gameData);
    } catch (error) {
      console.error("Failed to auto-save game to DB:", error);
    }
  }, 2000);

  return {
    // State
    game: null,
    otConfig: null,
    isLoading: false,
    error: null,

    // ==================== INITIALIZATION ====================

    initializeGame: async (gameId, teamSeasonId) => {
      set({ isLoading: true, error: null });

      try {
        // Fetch game from DB
        const [dbGame] = await apiFetch("v_games", "GET", null, null, {
          filters: { game_id: gameId },
        });

        if (!dbGame) {
          set({ error: "Game not found", isLoading: false });
          return { notFound: true };
        }

        // Fetch OT configuration
        const [otConfig] = await apiFetch(
          "games_overtimes",
          "GET",
          null,
          null,
          {
            filters: { game_id: gameId },
          }
        );

        // Build game settings from DB and OT config
        const settings = {
          ...DEFAULT_GAME_SETTINGS,
          periodCount: parseInt(dbGame.default_reg_periods) || 2,
          hasOvertime: otConfig?.ot_if_tied === 1,
          overtimePeriods: otConfig?.max_ot_periods
            ? parseInt(otConfig.max_ot_periods)
            : DEFAULT_GAME_SETTINGS.overtimePeriods,
          overtimeDuration: otConfig?.default_ot_1_minutes
            ? parseInt(otConfig.default_ot_1_minutes) * 60
            : DEFAULT_GAME_SETTINGS.overtimeDuration,
          hasShootout: otConfig?.so_if_tied === 1,
        };

        // Check localStorage for live game state
        const localGame = get().loadFromStorage();
        const isLocalGameCurrent = localGame?.id === gameId;

        const finalGame = isLocalGameCurrent
          ? { ...localGame, settings }
          : { ...dbGame, settings };
        const { home_team_season_id, away_team_season_id } = dbGame;
        const isHome = teamSeasonId == home_team_season_id;

        const opponentClub = isHome
          ? dbGame.away_club_name
          : dbGame.home_club_name;
        const opponentTeamName = isHome
          ? dbGame.away_team_name
          : dbGame.home_team_name;

        const opponent = {
          opponentId: isHome ? away_team_season_id : home_team_season_id,
          opponentClub,
          opponentTeamName,
          opponentName: `${opponentClub} ${opponentTeamName}`,
        };

        set({
          game: { ...finalGame, ...opponent, homeScore: 0, awayScore: 0 },
          otConfig,
          isLoading: false,
        });

        get().saveToStorage(finalGame);
        return finalGame;
      } catch (error) {
        if (error.message.includes("404")) {
          set({ error: "Game not found", isLoading: false });
          return { notFound: true };
        }

        console.error("Error loading game:", error);
        set({ error: error.message, isLoading: false });
        return null;
      }
    },

    createNewGame: (settings = {}) => {
      const newGame = {
        id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        settings: { ...DEFAULT_GAME_SETTINGS, ...settings },
        stage: GAME_STAGES.BEFORE_START,
        periods: [],
        stoppages: [],
        currentPeriodIndex: -1,
        currentStoppageIndex: -1,
        firstPeriodStartTime: null,
      };

      set({ game: newGame });
      get().saveToStorage(newGame);
      return newGame;
    },

    // ==================== PERSISTENCE ====================

    loadFromStorage: () => {
      if (typeof window === "undefined") return null;

      try {
        const stored = window.localStorage.getItem("game");
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.error("Error loading game from storage:", error);
        return null;
      }
    },

    saveToStorage: (gameData) => {
      if (typeof window === "undefined" || !gameData) return;

      try {
        window.localStorage.setItem("game", JSON.stringify(gameData));
        // Trigger debounced DB save
        debouncedSave(gameData);
      } catch (error) {
        console.error("Error saving game to storage:", error);
      }
    },

    updateGame: (updates) => {
      const currentGame = get().game;
      if (!currentGame) return;

      const updatedGame = { ...currentGame, ...updates };
      set({ game: updatedGame });
      get().saveToStorage(updatedGame);
    },

    // ==================== GAME STAGE CALCULATION ====================

    getGameStage: () => {
      const game = get().game;
      if (!game?.firstPeriodStartTime) return GAME_STAGES.BEFORE_START;

      const currentPeriod = game.periods[game.currentPeriodIndex];

      // Check active stoppage
      if (game.currentStoppageIndex >= 0) {
        const currentStoppage = game.stoppages[game.currentStoppageIndex];
        if (!currentStoppage.endTime) return GAME_STAGES.IN_STOPPAGE;
      }

      // Check current period
      if (currentPeriod && !currentPeriod.endTime) {
        return GAME_STAGES.DURING_PERIOD;
      }

      // Check if game is over
      const totalPeriods =
        game.settings.periodCount +
        (game.settings.hasOvertime ? game.settings.overtimePeriods : 0);

      if (
        game.currentPeriodIndex >= totalPeriods - 1 &&
        currentPeriod?.endTime
      ) {
        return GAME_STAGES.END_GAME;
      }

      return GAME_STAGES.BETWEEN_PERIODS;
    },

    // ==================== TIME CALCULATIONS ====================

    getGameTime: () => {
      const game = get().game;
      if (!game?.firstPeriodStartTime) return 0;
      return Math.floor((Date.now() - game.firstPeriodStartTime) / 1000);
    },

    getPeriodTime: () => {
      const game = get().game;
      const currentPeriod = game?.periods[game.currentPeriodIndex];
      if (!currentPeriod?.startTime) return 0;

      const now = currentPeriod.endTime || Date.now();
      const elapsedRealTime = Math.floor(
        (now - currentPeriod.startTime) / 1000
      );

      const stoppageTime = get().calculateStoppageTimeForPeriod(
        game.currentPeriodIndex
      );

      if (game.settings.clockDirection === "up") {
        return elapsedRealTime - stoppageTime;
      } else {
        const netElapsed = elapsedRealTime - stoppageTime;
        const periodDuration = get().getPeriodDuration(game.currentPeriodIndex);
        return Math.max(0, periodDuration - netElapsed);
      }
    },

    getPeriodDuration: (periodIndex) => {
      const game = get().game;
      if (!game) return 0;

      const regularPeriods = game.settings.periodCount;
      return periodIndex < regularPeriods
        ? game.settings.periodDuration
        : game.settings.overtimeDuration;
    },

    calculateStoppageTimeForPeriod: (periodIndex) => {
      const game = get().game;
      const period = game?.periods[periodIndex];
      if (!period) return 0;

      const periodStartGameTime = get().calculateGameTimeAtTimestamp(
        period.startTime
      );
      const periodEndGameTime = period.endTime
        ? get().calculateGameTimeAtTimestamp(period.endTime)
        : get().getGameTime();

      return game.stoppages
        .filter((s) => {
          const stoppageStart = s.startTime;
          const stoppageEnd = s.endTime || get().getGameTime();
          return (
            s.shouldPausePeriodClock &&
            stoppageStart >= periodStartGameTime &&
            stoppageStart < periodEndGameTime
          );
        })
        .reduce((total, s) => {
          const duration = (s.endTime || get().getGameTime()) - s.startTime;
          return total + duration;
        }, 0);
    },

    calculateGameTimeAtTimestamp: (timestamp) => {
      const game = get().game;
      if (!game?.firstPeriodStartTime) return 0;
      return Math.floor((timestamp - game.firstPeriodStartTime) / 1000);
    },

    // ==================== GAME ACTIONS ====================

    startGame: async () => {
      const game = get().game;
      if (!game) return;

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
      };

      get().updateGame(updates);
    },

    endPeriod: async () => {
      const game = get().game;
      if (!game) return;

      const now = Date.now();
      const updatedPeriods = [...game.periods];
      updatedPeriods[game.currentPeriodIndex] = {
        ...updatedPeriods[game.currentPeriodIndex],
        endTime: now,
      };

      get().updateGame({ periods: updatedPeriods });
    },

    startNextPeriod: async () => {
      const game = get().game;
      if (!game) return;

      const now = Date.now();
      const nextIndex = game.currentPeriodIndex + 1;

      const newPeriod = {
        index: nextIndex,
        startTime: now,
        endTime: null,
      };

      get().updateGame({
        currentPeriodIndex: nextIndex,
        periods: [...game.periods, newPeriod],
      });
    },

    startStoppage: async (shouldPausePeriodClock = true, reason = "") => {
      const game = get().game;
      if (!game) return;

      const gameTime = get().getGameTime();
      const newStoppage = {
        id: `stoppage_${Date.now()}`,
        startTime: gameTime,
        endTime: null,
        shouldPausePeriodClock,
        reason,
        periodIndex: game.currentPeriodIndex,
      };

      get().updateGame({
        stoppages: [...game.stoppages, newStoppage],
        currentStoppageIndex: game.stoppages.length,
      });
    },

    endStoppage: async () => {
      const game = get().game;
      if (!game || game.currentStoppageIndex < 0) return;

      const gameTime = get().getGameTime();
      const updatedStoppages = [...game.stoppages];
      updatedStoppages[game.currentStoppageIndex] = {
        ...updatedStoppages[game.currentStoppageIndex],
        endTime: gameTime,
      };

      get().updateGame({
        stoppages: updatedStoppages,
        currentStoppageIndex: -1,
      });
    },

    // ==================== HELPER FUNCTIONS ====================

    getCurrentPeriodNumber: () => {
      const game = get().game;
      if (!game || game.currentPeriodIndex < 0) return 0;
      return game.currentPeriodIndex + 1;
    },

    getPeriodLabel: (periodIndex) => {
      const game = get().game;
      if (!game) return "";

      const regularPeriods = game.settings.periodCount;
      if (periodIndex < regularPeriods) {
        return `Period ${periodIndex + 1}`;
      }
      return `OT ${periodIndex - regularPeriods + 1}`;
    },

    getCurrentPeriodLabel: () => {
      const game = get().game;
      if (!game || game.currentPeriodIndex < 0) return "";
      return get().getPeriodLabel(game.currentPeriodIndex);
    },

    // Constants
    GAME_STAGES,
  };
});

export default useGameStore;
