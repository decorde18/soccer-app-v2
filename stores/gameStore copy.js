// stores/gameStore.js
import { create } from "zustand";
import { apiFetch } from "@/app/api/fetcher";
import { calculateGameTime, calculatePeriodTime } from "@/lib/dateTimeUtils";
import useGameSubsStore from "./gameSubsStore"; // ADD THIS IMPORT

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
  periodDuration: 2400, // 40 minutes in seconds
  hasOvertime: false,
  overtimePeriods: 2,
  overtimeDuration: 600, // 10 minutes in seconds
  hasShootout: true,
  clockDirection: "up",
};

const useGameStore = create((set, get) => {
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
        // Fetch existing periods (start_time and end_time are BIGINT Unix ms)
        const existingPeriods = await apiFetch(
          "game_periods",
          "GET",
          null,
          null,
          {
            filters: { game_id: gameId },
          }
        );
        const allSubs = await apiFetch("game_subs", "GET", null, null, {
          filters: { game_id: gameId },
        });
        const gameSubs = allSubs.filter((s) => s.sub_time !== null);
        const pendingSubs = allSubs.filter((s) => s.sub_time === null);
        // Fetch stoppages (stored as game seconds in INT columns)
        const stoppageEvents = await apiFetch(
          "game_events",
          "GET",
          null,
          null,
          {
            filters: { game_id: gameId },
          }
        );
        const playerActions = await apiFetch(
          "game_events_player_actions",
          "GET",
          null,
          null,
          { filters: { game_id: gameId } }
        );
        const gameEventsTeam = await apiFetch(
          "game_events_team",
          "GET",
          null,
          null,
          { filters: { game_id: gameId } }
        );
        const gameEventsMajor = await apiFetch(
          "game_events_major",
          "GET",
          null,
          null,
          {
            filters: { game_id: gameId },
          }
        );
        //todo need goals data
        //todo need discipline data
        //todo need pk data

        // Build game settings
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

        // Build periods array (all timestamps are Unix ms from DB BIGINT)
        const periods = existingPeriods
          .sort((a, b) => a.period_number - b.period_number)
          .map((p) => ({
            id: p.id,
            periodNumber: p.period_number,
            index: p.period_number - 1,
            startTime: p.start_time, // Unix ms
            endTime: p.end_time || null, // Unix ms or null
          }));

        // Build stoppages array (times are game seconds)
        const stoppages = stoppageEvents
          .filter((event) => event.event_category !== "team")
          .map((e) => ({
            id: e.id,
            startTime: e.stoppage_start_time || e.game_time, // game seconds
            endTime: e.stoppage_end_time, // game seconds or null
            reason: e.details || "",
            periodNumber: e.period,
            category: e.event_category,
            type: e.event_type,
            teamSeasonId: e.team_season_id,
          }));

        const gameEvents = gameEventsMajor.map((e) => ({
          //Show none goal game stoppages
          id: e.id,
          startTime: e.game_time,
          endTime: e.end_time, // game seconds or null
          details: e.details || "",
          periodNumber: e.period,
          type: e.event_type,
          clock_should_run: e.clock_should_run === 1,
        }));
        //todo delete stoppages and stoppageEvents
        //todo create goalsFor and goalsAgainst - add to finalGame
        // Determine current state
        const gameStartTime = periods.length > 0 ? periods[0].startTime : null;
        const currentPeriodIndex = periods.length > 0 ? periods.length - 1 : -1;

        // Build opponent info
        const { home_team_season_id, away_team_season_id } = dbGame;
        const isHome = teamSeasonId == home_team_season_id;
        const opponent = {
          opponentId: isHome ? away_team_season_id : home_team_season_id,
          opponentClub: isHome ? dbGame.away_club_name : dbGame.home_club_name,
          opponentTeamName: isHome
            ? dbGame.away_team_name
            : dbGame.home_team_name,
          opponentName: isHome
            ? `${dbGame.away_club_name} ${dbGame.away_team_name}`
            : `${dbGame.home_club_name} ${dbGame.home_team_name}`,
        };

        const finalGame = {
          ...dbGame,
          ...opponent,
          isHome,
          settings,
          periods,
          gameEvents,
          stoppages, //todo remove
          currentPeriodIndex,
          gameStartTime,
          gameSubs,
          pendingSubs,
          playerActions,
          gameEventsTeam,
          homeScore: dbGame.home_score || 0, //todo refactor
          awayScore: dbGame.away_score || 0, //todo refactor
        };
        console.log(finalGame);
        set({
          game: finalGame,
          otConfig,
          isLoading: false,
        });

        // Calculate and sync game stage/status
        await get().syncGameStatus();

        return finalGame;
      } catch (error) {
        console.error("Error loading game:", error);
        set({ error: error.message, isLoading: false });
        return null;
      }
    },
    updateGame: (updates) => {
      const currentGame = get().game;
      if (!currentGame) return;

      const updatedGame = { ...currentGame, ...updates };
      set({ game: updatedGame });
    },
    startGame: () => {},
    endGame: () => {
      //be sure to change status to completed
      // remove any pending subs
    },
    startPeriod: () => {},
    endPeriod: () => {},
    // ==================== GAME STAGE CALCULATION ====================

    getGameStage: () => {
      const game = get().game;
      if (!game?.gameStartTime) return GAME_STAGES.BEFORE_START;

      const currentPeriod = game.periods[game.currentPeriodIndex];

      // Check for active stoppage
      const activeStoppage = game.stoppages.find(
        (s) =>
          s.endTime === null && s.periodNumber === game.currentPeriodIndex + 1
      );
      if (activeStoppage && currentPeriod && !currentPeriod.endTime) {
        return GAME_STAGES.IN_STOPPAGE;
      }

      // Check if currently in a period
      if (currentPeriod && !currentPeriod.endTime) {
        return GAME_STAGES.DURING_PERIOD;
      }

      // Calculate total periods including overtime
      const regularPeriods = game.settings.periodCount;
      const maxPeriods =
        regularPeriods +
        (game.settings.hasOvertime ? game.settings.overtimePeriods : 0);

      // Check if game should be over
      const allRegularPeriodsComplete =
        game.currentPeriodIndex >= regularPeriods - 1 && currentPeriod?.endTime;

      if (allRegularPeriodsComplete) {
        const isTied = game.homeScore === game.awayScore;

        if (isTied && game.settings.hasOvertime) {
          if (game.currentPeriodIndex >= maxPeriods - 1) {
            return GAME_STAGES.END_GAME;
          }
          return GAME_STAGES.BETWEEN_PERIODS;
        }

        return GAME_STAGES.END_GAME;
      }

      return GAME_STAGES.BETWEEN_PERIODS;
    },
    syncGameStatus: async () => {
      const game = get().game;
      if (!game) return;

      const stage = get().getGameStage();
      let newStatus = game.status;

      if (stage === GAME_STAGES.BEFORE_START) {
        newStatus = "scheduled";
      } else if (stage === GAME_STAGES.END_GAME) {
        newStatus = "completed";
      } else {
        newStatus = "in_progress";
      }

      // Update game stage in state
      get().updateGame({ gameStage: stage });

      // Update DB if status changed
      if (newStatus !== game.status) {
        try {
          await apiFetch(`games?id=${game.game_id}`, "PUT", {
            status: newStatus,
          });
          get().updateGame({ status: newStatus });
        } catch (error) {
          console.error("Error syncing game status:", error);
        }
      }
    },

    // ==================== TIME CALCULATIONS ====================

    /**
     * Gets current game time in seconds (wall clock time since game started).
     * Game time NEVER pauses.
     */
    getGameTime: () => {
      const game = get().game;
      if (!game || !game.gameStartTime) return 0;

      let currentMs;

      // If game ended, use the last period's end time
      if (game.gameStage === GAME_STAGES.END_GAME && game.periods.length > 0) {
        const latestPeriod = game.periods.reduce((latest, current) => {
          return !latest || current.periodNumber > latest.periodNumber
            ? current
            : latest;
        }, null);

        if (latestPeriod?.endTime) {
          currentMs = latestPeriod.endTime;
        }
      }

      // Otherwise use current time
      if (!currentMs) {
        currentMs = Date.now();
      }

      return calculateGameTime(game.gameStartTime, currentMs);
    },

    /**
     * Gets current period time (playing time, excluding stoppages).
     */
    getPeriodTime: () => {
      const game = get().game;
      if (!game) return 0;

      const currentPeriod = game.periods[game.currentPeriodIndex];
      if (!currentPeriod?.startTime) return 0;

      const currentMs = currentPeriod.endTime || Date.now();
      const periodStoppages = game.stoppages.filter(
        (s) => s.periodNumber === currentPeriod.periodNumber
      );

      return calculatePeriodTime(
        currentPeriod.startTime,
        currentMs,
        periodStoppages
      );
    },

    getPeriodDuration: (periodIndex) => {
      const game = get().game;
      if (!game) return 0;

      const regularPeriods = game.settings.periodCount;
      return periodIndex < regularPeriods
        ? game.settings.periodDuration
        : game.settings.overtimeDuration;
    },

    // ==================== GAME ACTIONS ====================
    startNextPeriod: async () => {
      const game = get().game;
      if (!game) return;

      const nowMs = Date.now();
      const isFirstPeriod = game.periods.length === 0;
      const nextIndex = isFirstPeriod ? 0 : game.currentPeriodIndex + 1;
      const nextNumber = nextIndex + 1;

      try {
        // Create new period in DB (store Unix ms as BIGINT)
        const periodData = await apiFetch("game_periods", "POST", {
          game_id: game.game_id,
          period_number: nextNumber,
          start_time: nowMs,
          end_time: null,
        });

        const newPeriod = {
          id: periodData.id,
          periodNumber: nextNumber,
          index: nextIndex,
          startTime: nowMs,
          endTime: null,
        };

        get().updateGame({
          ...(isFirstPeriod && {
            gameStartTime: nowMs,
            stoppages: [],
          }),
          currentPeriodIndex: nextIndex,
          periods: [...game.periods, newPeriod],
        });

        if (isFirstPeriod) {
          await get().syncGameStatus();
        }

        // Auto-confirm any pending subs at time 0 of new period
        // FIXED: Access gameSubsStore correctly
        const gameSubsStore = useGameSubsStore.getState();
        const pendingSubs = await gameSubsStore.getPendingSubs(game.game_id);
        const completeSubs = pendingSubs.filter((sub) => sub.isComplete);

        if (completeSubs.length > 0) {
          console.log(
            `Auto-confirming ${completeSubs.length} subs at start of period ${nextNumber}`
          );

          // Get game time (should be 0 for start of period)
          const gameTime = get().getGameTime();

          // Confirm each sub
          await Promise.all(
            completeSubs.map((sub) =>
              gameSubsStore.confirmSub(sub.subId, gameTime)
            )
          );
        }
      } catch (error) {
        console.error("Error starting next period:", error);
      }
    },
    endPeriod: async () => {
      const game = get().game;
      if (!game) return;

      const nowMs = Date.now();
      const currentPeriod = game.periods[game.currentPeriodIndex];

      try {
        // Update period in DB (store Unix ms as BIGINT)
        await apiFetch(`game_periods?id=${currentPeriod.id}`, "PUT", {
          end_time: nowMs, // BIGINT Unix ms
        });

        const updatedPeriods = [...game.periods];
        updatedPeriods[game.currentPeriodIndex] = {
          ...updatedPeriods[game.currentPeriodIndex],
          endTime: nowMs,
        };

        get().updateGame({ periods: updatedPeriods });
        await get().syncGameStatus();
      } catch (error) {
        console.error("Error ending period:", error);
      }
    },

    startStoppage: async (reason = "") => {
      const game = get().game;
      if (!game) return;

      const gameTime = get().getGameTime();
      const period = get().getCurrentPeriodNumber();

      try {
        // Create stoppage event (times stored as game seconds)
        const stoppageEvent = await apiFetch("game_events", "POST", {
          game_id: game.game_id,
          player_game_id: null,
          event_category: "major",
          event_type: "stoppage",
          game_time: gameTime, // INT game seconds
          period: period,

          stoppage_start_time: gameTime, // INT game seconds
          stoppage_end_time: null,
          clock_should_run: 0,
          details: reason,
        });

        const newStoppage = {
          id: stoppageEvent.id,
          startTime: gameTime,
          endTime: null,
          reason,
          periodNumber: period,
        };

        get().updateGame({
          stoppages: [...game.stoppages, newStoppage],
        });
      } catch (error) {
        console.error("Error starting stoppage:", error);
      }
    },

    endStoppage: async (stoppageId) => {
      const game = get().game;
      if (!game) return;

      const gameTime = get().getGameTime();

      try {
        await apiFetch(`game_events?id=${stoppageId}`, "PUT", {
          stoppage_end_time: gameTime, // INT game seconds
        });

        const updatedStoppages = game.stoppages.map((s) =>
          s.id === stoppageId ? { ...s, endTime: gameTime } : s
        );

        get().updateGame({ stoppages: updatedStoppages });
      } catch (error) {
        console.error("Error ending stoppage:", error);
      }
    },

    endGame: async () => {
      const game = get().game;
      if (!game) return;

      try {
        await apiFetch(`games?id=${game.game_id}`, "PUT", {
          status: "completed",
        });

        get().updateGame({ status: "completed" });
      } catch (error) {
        console.error("Error ending game:", error);
      }
    },

    // ==================== MANUAL MANAGEMENT ====================

    deletePeriod: async (periodId) => {
      try {
        await apiFetch(`game_periods?id=${periodId}`, "DELETE");

        const game = get().game;
        if (!game) return;

        const updatedPeriods = game.periods.filter((p) => p.id !== periodId);
        get().updateGame({
          periods: updatedPeriods,
          currentPeriodIndex: Math.max(0, updatedPeriods.length - 1),
        });

        await get().syncGameStatus();
      } catch (error) {
        console.error("Error deleting period:", error);
        throw error;
      }
    },

    updatePeriod: async (periodId, updates) => {
      try {
        await apiFetch(`game_periods?id=${periodId}`, "PUT", updates);

        const game = get().game;
        if (!game) return;

        const updatedPeriods = game.periods.map((p) =>
          p.id === periodId
            ? {
                ...p,
                startTime: updates.start_time || p.startTime,
                endTime:
                  updates.end_time !== undefined ? updates.end_time : p.endTime,
              }
            : p
        );
        get().updateGame({ periods: updatedPeriods });

        await get().syncGameStatus();
      } catch (error) {
        console.error("Error updating period:", error);
        throw error;
      }
    },

    deleteEvent: async (eventId) => {
      try {
        await apiFetch(`game_events?id=${eventId}`, "DELETE");

        const game = get().game;
        if (game) {
          const updatedStoppages = game.stoppages.filter(
            (s) => s.id !== eventId
          );
          get().updateGame({ stoppages: updatedStoppages });
        }
      } catch (error) {
        console.error("Error deleting event:", error);
        throw error;
      }
    },

    updateEvent: async (eventId, updates) => {
      try {
        await apiFetch(`game_events?id=${eventId}`, "PUT", updates);
      } catch (error) {
        console.error("Error updating event:", error);
        throw error;
      }
    },

    deleteSub: async (subId) => {
      try {
        await apiFetch(`game_subs?id=${subId}`, "DELETE");
      } catch (error) {
        console.error("Error deleting sub:", error);
        throw error;
      }
    },

    updateSub: async (subId, updates) => {
      try {
        await apiFetch(`game_subs?id=${subId}`, "PUT", updates);
      } catch (error) {
        console.error("Error updating sub:", error);
        throw error;
      }
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

    GAME_STAGES,
  };
});

export default useGameStore;
