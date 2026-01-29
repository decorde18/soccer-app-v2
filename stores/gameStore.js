// stores/gameStore.js
import { create } from "zustand";
import { apiFetch } from "@/app/api/fetcher";
import { calculateGameTime, calculatePeriodTime } from "@/lib/dateTimeUtils";
import useGameSubsStore from "./gameSubsStore";

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
          },
        );

        // Fetch existing periods (start_time and end_time are BIGINT Unix ms)
        const existingPeriods = await apiFetch(
          "game_periods",
          "GET",
          null,
          null,
          {
            filters: { game_id: gameId },
          },
        );

        // Fetch subs
        const allSubs = await apiFetch("game_subs", "GET", null, null, {
          filters: { game_id: gameId },
        });
        const gameSubs = allSubs.filter((s) => s.sub_time !== null);
        const pendingSubs = allSubs.filter((s) => s.sub_time === null);

        // Fetch all game events in parallel
        const [
          gameEventsGoals,
          gameEventsDiscipline,
          gameEventsPenalties,
          gameEventsMajor,
          playerActions,
          gameEventsTeam,
        ] = await Promise.all([
          apiFetch("v_game_events_goals_complete", "GET", null, null, {
            filters: { game_id: gameId },
          }),
          apiFetch("v_game_events_discipline_complete", "GET", null, null, {
            filters: { game_id: gameId },
          }),
          apiFetch("v_game_events_penalties_complete", "GET", null, null, {
            filters: { game_id: gameId },
          }),
          apiFetch("game_events_major", "GET", null, null, {
            filters: { game_id: gameId },
          }),
          apiFetch("game_events_player_actions", "GET", null, null, {
            filters: { game_id: gameId },
          }),
          apiFetch("game_events_team", "GET", null, null, {
            filters: { game_id: gameId },
          }),
        ]);

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

        // Calculate scores based on goals
        const goalsFor = gameEventsGoals.filter(
          (g) => g.team_season_id == teamSeasonId,
        ).length;
        const goalsAgainst = gameEventsGoals.filter(
          (g) => g.team_season_id != teamSeasonId,
        ).length;

        // Determine current state
        const gameStartTime = periods.length > 0 ? periods[0].startTime : null;
        const currentPeriodIndex = periods.length > 0 ? periods.length - 1 : -1;

        // Calculate team stat totals
        const teamStatTotals = get().calculateTeamStatTotals({
          gameEventsTeam,
          playerActions,
          isHome,
          home_team_season_id,
          away_team_season_id,
        });

        const finalGame = {
          ...dbGame,
          ...opponent,
          isHome,
          settings,
          periods,
          gameEventsGoals,
          gameEventsDiscipline,
          gameEventsPenalties,
          gameEventsMajor,
          playerActions,
          gameEventsTeam,
          currentPeriodIndex,
          gameStartTime,
          gameSubs,
          pendingSubs,
          goalsFor,
          goalsAgainst,
          ourName: isHome
            ? `${dbGame.home_club_name} ${dbGame.home_team_name}`
            : `${dbGame.away_club_name} ${dbGame.away_team_name}`,
          teamStatTotals,
        };

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

      // If we updated actions or events, recalculate the totals
      if (updates.playerActions || updates.gameEventsTeam) {
        updatedGame.teamStatTotals = get().calculateTeamStatTotals(updatedGame);
      }

      set({ game: updatedGame });
    },

    // ==================== GAME STAGE CALCULATION ====================

    getGameStage: () => {
      const game = get().game;
      if (!game?.gameStartTime) return GAME_STAGES.BEFORE_START;

      const currentPeriod = game.periods[game.currentPeriodIndex];

      // Check for active stoppage in major events
      const activeStoppage = game.gameEventsMajor.find(
        (s) =>
          s.end_time === null &&
          s.period === game.currentPeriodIndex + 1 &&
          s.clock_should_run === 0,
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
        const isTied = game.goalsFor === game.goalsAgainst;

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

    getGameTime: () => {
      const game = get().game;
      if (!game || !game.gameStartTime) return 0;

      let currentMs;

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

      if (!currentMs) {
        currentMs = Date.now();
      }

      return calculateGameTime(game.gameStartTime, currentMs);
    },

    getPeriodTime: () => {
      const game = get().game;
      if (!game) return 0;

      const currentPeriod = game.periods[game.currentPeriodIndex];
      if (!currentPeriod?.startTime) return 0;

      const currentMs = currentPeriod.endTime || Date.now();

      const periodStoppages = game.gameEventsMajor
        .filter(
          (s) =>
            s.period === currentPeriod.periodNumber && s.clock_should_run === 0,
        )
        .map((e) => ({
          startTime: e.game_time,
          endTime: e.end_time,
        }));

      return calculatePeriodTime(
        currentPeriod.startTime,
        currentMs,
        periodStoppages,
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
            gameEventsGoals: [],
            gameEventsDiscipline: [],
            gameEventsPenalties: [],
            gameEventsMajor: [],
            playerActions: [],
            gameEventsTeam: [],
            goalsFor: 0,
            goalsAgainst: 0,
          }),
          currentPeriodIndex: nextIndex,
          periods: [...game.periods, newPeriod],
        });

        if (isFirstPeriod) {
          await get().syncGameStatus();
        }

        // Auto-confirm any pending subs at time 0 of new period
        const gameSubsStore = useGameSubsStore.getState();
        const pendingSubs = await gameSubsStore.getPendingSubs(game.game_id);
        const completeSubs = pendingSubs.filter((sub) => sub.isComplete);

        if (completeSubs.length > 0) {
          const gameTime = get().getGameTime();
          await Promise.all(
            completeSubs.map((sub) =>
              gameSubsStore.confirmSub(sub.subId, gameTime),
            ),
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
        await apiFetch(`game_periods?id=${currentPeriod.id}`, "PUT", {
          end_time: nowMs,
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

    startStoppage: async (reason = "", eventType = "other") => {
      const game = get().game;
      if (!game) return;

      const gameTime = get().getGameTime();
      const period = get().getCurrentPeriodNumber();

      try {
        const stoppageEvent = await apiFetch("game_events_major", "POST", {
          game_id: game.game_id,
          event_type: eventType,
          game_time: gameTime,
          end_time: null,
          period: period,
          clock_should_run: 0,
          details: reason,
        });

        const newStoppage = {
          id: stoppageEvent.id,
          game_id: game.game_id,
          event_type: eventType,
          game_time: gameTime,
          end_time: null,
          period: period,
          clock_should_run: 0,
          details: reason,
        };

        get().updateGame({
          gameEventsMajor: [...game.gameEventsMajor, newStoppage],
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
        await apiFetch(`game_events_major?id=${stoppageId}`, "PUT", {
          end_time: gameTime,
        });

        const updatedStoppages = game.gameEventsMajor.map((s) =>
          s.id === stoppageId ? { ...s, end_time: gameTime } : s,
        );

        get().updateGame({ gameEventsMajor: updatedStoppages });
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
            : p,
        );
        get().updateGame({ periods: updatedPeriods });

        await get().syncGameStatus();
      } catch (error) {
        console.error("Error updating period:", error);
        throw error;
      }
    },

    updateEvent: async (eventId, updates, eventType = "major") => {
      try {
        const tableMap = {
          major: "game_events_major",
          goal: "game_events_goals",
          discipline: "game_events_discipline",
          penalty: "game_events_penalties",
          player_action: "game_events_player_actions",
          team: "game_events_team",
        };

        const table = tableMap[eventType] || "game_events_major";
        await apiFetch(`${table}?id=${eventId}`, "PUT", updates);
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

    // ==================== OPTIMISTIC UPDATE METHODS ====================

    addTeamEvent: (teamEvent) => {
      const game = get().game;
      if (!game) return;

      const updatedGame = {
        ...game,
        gameEventsTeam: [...game.gameEventsTeam, teamEvent],
      };

      updatedGame.teamStatTotals = get().calculateTeamStatTotals(updatedGame);

      set({ game: updatedGame });
    },

    replaceTeamEvent: (oldId, newEvent) => {
      const game = get().game;
      if (!game) return;

      const updatedGame = {
        ...game,
        gameEventsTeam: game.gameEventsTeam.map((e) =>
          e.id === oldId ? newEvent : e,
        ),
      };

      updatedGame.teamStatTotals = get().calculateTeamStatTotals(updatedGame);

      set({ game: updatedGame });
    },

    removeTeamEvent: (eventId) => {
      const game = get().game;
      if (!game) return;

      const updatedGame = {
        ...game,
        gameEventsTeam: game.gameEventsTeam.filter((e) => e.id !== eventId),
      };

      updatedGame.teamStatTotals = get().calculateTeamStatTotals(updatedGame);

      set({ game: updatedGame });
    },
    deleteEvent: async (eventId, eventType = "major") => {
      try {
        const tableMap = {
          major: "game_events_major",
          goal: "game_events_goals",
          discipline: "game_events_discipline",
          penalty: "game_events_penalties",
          player_action: "game_events_player_actions",
          team: "game_events_team",
        };

        const table = tableMap[eventType] || "game_events_major";
        await apiFetch(`${table}?id=${eventId}`, "DELETE");

        const game = get().game;
        if (game) {
          const updates = {};
          switch (eventType) {
            case "major":
              updates.gameEventsMajor = game.gameEventsMajor.filter(
                (s) => s.id !== eventId,
              );
              break;
            case "goal":
              updates.gameEventsGoals = game.gameEventsGoals.filter(
                (g) => g.goal_id !== eventId,
              );
              const teamSeasonId = game.isHome
                ? game.home_team_season_id
                : game.away_team_season_id;
              updates.goalsFor = updates.gameEventsGoals.filter(
                (g) => g.team_season_id === teamSeasonId && !g.is_own_goal,
              ).length;
              updates.goalsAgainst = updates.gameEventsGoals.filter(
                (g) =>
                  (g.team_season_id !== teamSeasonId && !g.is_own_goal) ||
                  (g.team_season_id === teamSeasonId && g.is_own_goal),
              ).length;
              break;
            case "discipline":
              updates.gameEventsDiscipline = game.gameEventsDiscipline.filter(
                (d) => d.discipline_id !== eventId,
              );
              break;
            case "penalty":
              updates.gameEventsPenalties = game.gameEventsPenalties.filter(
                (p) => p.penalty_id !== eventId,
              );
              break;
            case "player_action":
              updates.playerActions = game.playerActions.filter(
                (a) => a.id !== eventId,
              );
              updates.teamStatTotals = get().calculateTeamStatTotals({
                ...game,
                ...updates,
              });
              break;
            case "team":
              updates.gameEventsTeam = game.gameEventsTeam.filter(
                (t) => t.id !== eventId,
              );
              updates.teamStatTotals = get().calculateTeamStatTotals({
                ...game,
                ...updates,
              });
              break;
          }
          get().updateGame(updates);
        }
      } catch (error) {
        console.error("Error deleting event:", error);
        throw error;
      }
    },
    // Add these methods to gameStore.js

    replaceGoalEvent: (
      optimisticGoalId,
      realGoalEvent,
      optimisticMajorId,
      realMajorEvent,
    ) => {
      const game = get().game;
      if (!game) return;

      const teamSeasonId = game.isHome
        ? game.home_team_season_id
        : game.away_team_season_id;

      const updatedGame = {
        ...game,
        gameEventsGoals: game.gameEventsGoals.map((g) =>
          g.id === optimisticGoalId || g.goal_id === optimisticGoalId
            ? realGoalEvent
            : g,
        ),
        gameEventsMajor: game.gameEventsMajor.map((m) =>
          m.id === optimisticMajorId ? realMajorEvent : m,
        ),
      };

      set({ game: updatedGame });
    },

    removeGoalEvent: (goalId, majorEventId) => {
      const game = get().game;
      if (!game) return;

      const teamSeasonId = game.isHome
        ? game.home_team_season_id
        : game.away_team_season_id;

      // Find the goal to determine if it was ours or theirs
      const goalToRemove = game.gameEventsGoals.find(
        (g) => g.id === goalId || g.goal_id === goalId,
      );
      const isOurGoal =
        goalToRemove &&
        goalToRemove.team_season_id === teamSeasonId &&
        !goalToRemove.is_own_goal;
      const isTheirGoal =
        goalToRemove &&
        (goalToRemove.team_season_id !== teamSeasonId ||
          goalToRemove.is_own_goal);

      const updatedGame = {
        ...game,
        gameEventsGoals: game.gameEventsGoals.filter(
          (g) => g.id !== goalId && g.goal_id !== goalId,
        ),
        gameEventsMajor: game.gameEventsMajor.filter(
          (m) => m.id !== majorEventId,
        ),
        goalsFor: game.goalsFor - (isOurGoal ? 1 : 0),
        goalsAgainst: game.goalsAgainst - (isTheirGoal ? 1 : 0),
      };

      set({ game: updatedGame });
    },
    addPlayerAction: (action) => {
      const game = get().game;
      if (!game) return;

      const updatedActions = [...(game.playerActions || []), action];
      const updatedGame = { ...game, playerActions: updatedActions };

      set({
        game: {
          ...updatedGame,
          teamStatTotals: get().calculateTeamStatTotals(updatedGame),
        },
      });
    },
    replacePlayerAction: (optimisticActionId, realAction) => {
      const game = get().game;
      if (!game) return;

      const updatedActions = game.playerActions.map((a) =>
        a.id === optimisticActionId ? realAction : a,
      );
      const updatedGame = { ...game, playerActions: updatedActions };

      set({
        game: {
          ...updatedGame,
          teamStatTotals: get().calculateTeamStatTotals(updatedGame),
        },
      });
    },
    removePlayerAction: (actionId) => {
      const game = get().game;
      if (!game) return;

      const updatedActions = game.playerActions.filter(
        (a) => a.id !== actionId,
      );
      const updatedGame = { ...game, playerActions: updatedActions };

      set({
        game: {
          ...updatedGame,
          teamStatTotals: get().calculateTeamStatTotals(updatedGame),
        },
      });
    },

    addGoalEvent: (goalEvent, majorEvent) => {
      const game = get().game;
      if (!game) return;

      const teamSeasonId = game.isHome
        ? game.home_team_season_id
        : game.away_team_season_id;

      const isOurGoal =
        goalEvent.team_season_id === teamSeasonId && !goalEvent.is_own_goal;
      const isTheirGoal =
        goalEvent.team_season_id !== teamSeasonId || goalEvent.is_own_goal;

      const updatedGame = {
        ...game,
        gameEventsGoals: [...game.gameEventsGoals, goalEvent],
        gameEventsMajor: [...game.gameEventsMajor, majorEvent],
        goalsFor: game.goalsFor + (isOurGoal ? 1 : 0),
        goalsAgainst: game.goalsAgainst + (isTheirGoal ? 1 : 0),
      };

      set({ game: updatedGame });
    },
    // Add these methods to gameStore.js

    replaceGoalEvent: (
      optimisticGoalId,
      realGoalEvent,
      optimisticMajorId,
      realMajorEvent,
    ) => {
      const game = get().game;
      if (!game) return;

      const teamSeasonId = game.isHome
        ? game.home_team_season_id
        : game.away_team_season_id;

      const updatedGame = {
        ...game,
        gameEventsGoals: game.gameEventsGoals.map((g) =>
          g.id === optimisticGoalId || g.goal_id === optimisticGoalId
            ? realGoalEvent
            : g,
        ),
        gameEventsMajor: game.gameEventsMajor.map((m) =>
          m.id === optimisticMajorId ? realMajorEvent : m,
        ),
      };

      set({ game: updatedGame });
    },
    removeGoalEvent: (goalId, majorEventId) => {
      const game = get().game;
      if (!game) return;

      const teamSeasonId = game.isHome
        ? game.home_team_season_id
        : game.away_team_season_id;

      // Find the goal to determine if it was ours or theirs
      const goalToRemove = game.gameEventsGoals.find(
        (g) => g.id === goalId || g.goal_id === goalId,
      );
      const isOurGoal =
        goalToRemove &&
        goalToRemove.team_season_id === teamSeasonId &&
        !goalToRemove.is_own_goal;
      const isTheirGoal =
        goalToRemove &&
        (goalToRemove.team_season_id !== teamSeasonId ||
          goalToRemove.is_own_goal);

      const updatedGame = {
        ...game,
        gameEventsGoals: game.gameEventsGoals.filter(
          (g) => g.id !== goalId && g.goal_id !== goalId,
        ),
        gameEventsMajor: game.gameEventsMajor.filter(
          (m) => m.id !== majorEventId,
        ),
        goalsFor: game.goalsFor - (isOurGoal ? 1 : 0),
        goalsAgainst: game.goalsAgainst - (isTheirGoal ? 1 : 0),
      };

      set({ game: updatedGame });
    },
    addDisciplineEvent: (disciplineEvent, majorEvent) => {
      const game = get().game;
      if (!game) return;

      const updatedGame = {
        ...game,
        gameEventsDiscipline: [...game.gameEventsDiscipline, disciplineEvent],
        gameEventsMajor: [...game.gameEventsMajor, majorEvent],
      };

      set({ game: updatedGame });
    },
    replaceDisciplineEvent: (
      optimisticCardId,
      realCardEvent,
      optimisticMajorId,
      realMajorEvent,
    ) => {
      const game = get().game;
      if (!game) return;

      const updatedGame = {
        ...game,
        gameEventsDiscipline: game.gameEventsDiscipline.map((d) =>
          d.id === optimisticCardId || d.discipline_id === optimisticCardId
            ? realCardEvent
            : d,
        ),
        gameEventsMajor: game.gameEventsMajor.map((m) =>
          m.id === optimisticMajorId ? realMajorEvent : m,
        ),
      };

      set({ game: updatedGame });
    },
    removeDisciplineEvent: (cardId, majorEventId) => {
      const game = get().game;
      if (!game) return;

      const updatedGame = {
        ...game,
        gameEventsDiscipline: game.gameEventsDiscipline.filter(
          (d) => d.id !== cardId && d.discipline_id !== cardId,
        ),
        gameEventsMajor: game.gameEventsMajor.filter(
          (m) => m.id !== majorEventId,
        ),
      };

      set({ game: updatedGame });
    },
    addPenaltyEvent: (
      penaltyEvent,
      majorEvent,
      goalEvent = null,
      saveAction = null,
    ) => {
      const game = get().game;
      if (!game) return;

      const teamSeasonId = game.isHome
        ? game.home_team_season_id
        : game.away_team_season_id;

      let updatedGame = {
        ...game,
        gameEventsPenalties: [...game.gameEventsPenalties, penaltyEvent],
        gameEventsMajor: [...game.gameEventsMajor, majorEvent],
      };

      if (goalEvent) {
        const isOurGoal = goalEvent.team_season_id === teamSeasonId;
        updatedGame.gameEventsGoals = [...game.gameEventsGoals, goalEvent];
        updatedGame.goalsFor = game.goalsFor + (isOurGoal ? 1 : 0);
        updatedGame.goalsAgainst = game.goalsAgainst + (isOurGoal ? 0 : 1);
      }

      if (saveAction) {
        updatedGame.playerActions = [...game.playerActions, saveAction];
        updatedGame.teamStatTotals = get().calculateTeamStatTotals(updatedGame);
      }

      set({ game: updatedGame });
    },

    calculateTeamStatTotals: (gameData) => {
      const game = gameData || get().game;
      if (!game) return {};

      const teamSeasonId = game.isHome
        ? game.home_team_season_id
        : game.away_team_season_id;

      return {
        ...(game.gameEventsTeam?.reduce(
          (acc, e) => {
            const eventType = e.event_type;
            if (!acc[eventType]) {
              acc[eventType] = { us: 0, them: 0 };
            }

            const side = e.team_season_id === teamSeasonId ? "us" : "them";
            acc[eventType][side]++;

            return acc;
          },
          {
            corner: { us: 0, them: 0 },
            offside: { us: 0, them: 0 },
            foul: { us: 0, them: 0 },
          },
        ) || {
          corner: { us: 0, them: 0 },
          offside: { us: 0, them: 0 },
          foul: { us: 0, them: 0 },
        }),
        shots:
          game.playerActions?.filter(
            (e) => e.event_type === "shot" || e.event_type === "shot_on_target",
          ).length || 0,
        saves:
          game.playerActions?.filter((e) => e.event_type === "save").length ||
          0,
      };
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
