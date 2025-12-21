// stores/gamePlayerTimeStore.js
// Player time calculations with stoppage time handling and period boundary fixes
import { create } from "zustand";
import useGameStore from "./gameStore";
import useGamePlayersStore from "./gamePlayersStore";

/**
 * Splits a game_time segment into chunks that fall within actual periods
 * Excludes time between periods (breaks)
 * @param {Object} segment - { start: gameTime, end: gameTime }
 * @param {Array} periods - Array of period objects
 * @param {Number} gameStartTime - Unix ms timestamp of first period start
 * @returns {Array} Array of chunks with periodNumber
 */
const splitSegmentByPeriods = (segment, periods, gameStartTime) => {
  const chunks = [];

  periods.forEach((period) => {
    if (!period.startTime) return;

    // Convert period timestamps to game_time seconds
    const periodStartGameTime = Math.floor(
      (period.startTime - gameStartTime) / 1000
    );
    const periodEndGameTime = period.endTime
      ? Math.floor((period.endTime - gameStartTime) / 1000)
      : Infinity;

    // Find overlap between segment and this period
    const chunkStart = Math.max(segment.start, periodStartGameTime);
    const chunkEnd = Math.min(segment.end, periodEndGameTime);

    if (chunkEnd > chunkStart) {
      chunks.push({
        start: chunkStart,
        end: chunkEnd,
        periodNumber: period.periodNumber,
      });
    }
  });

  return chunks;
};

/**
 * Helper: Calculate stoppage time within a specific time range
 */
const calculateStoppageTimeInRange = (
  stoppages,
  rangeStart,
  rangeEnd,
  periodNumber
) => {
  return stoppages
    .filter((s) => s.periodNumber === periodNumber && s.endTime !== null)
    .reduce((total, stoppage) => {
      const overlapStart = Math.max(stoppage.startTime, rangeStart);
      const overlapEnd = Math.min(stoppage.endTime, rangeEnd);

      if (overlapEnd > overlapStart) {
        return total + (overlapEnd - overlapStart);
      }
      return total;
    }, 0);
};

/**
 * Helper: Find which period a game time falls into
 * NOTE: This is kept for backwards compatibility but may not be needed
 */
const findPeriodForGameTime = (periods, gameTime, gameStartTime) => {
  for (const period of periods) {
    if (!period.startTime) continue;

    const periodStartGameTime = Math.floor(
      (period.startTime - gameStartTime) / 1000
    );
    const periodEndGameTime = period.endTime
      ? Math.floor((period.endTime - gameStartTime) / 1000)
      : Infinity;

    if (gameTime >= periodStartGameTime && gameTime < periodEndGameTime) {
      return period;
    }
  }

  return null;
};

const useGamePlayerTimeStore = create((set, get) => ({
  // ==================== TIME CALCULATIONS ====================

  /**
   * Calculate total active playing time for a player
   * Accounts for stoppages and only counts time during active periods
   * Excludes time between periods (breaks)
   */
  calculateTotalTimeOnField: (player, currentGameTime) => {
    if (!player) return 0;

    const game = useGameStore.getState().game;
    if (!game || !game.gameStartTime) return 0;

    const stoppages = game.stoppages || [];
    const periods = game.periods || [];

    const ins = (player.ins || []).filter((sub) => sub.gameTime !== null);
    const outs = (player.outs || []).filter((sub) => sub.gameTime !== null);

    const isStarter = ["starter", "goalkeeper"].includes(player.gameStatus);

    // Build time segments when player was on field
    const segments = [];

    if (isStarter) {
      if (outs.length === 0) {
        segments.push({ start: 0, end: currentGameTime });
      } else {
        segments.push({ start: 0, end: outs[0].gameTime });

        for (let i = 0; i < ins.length; i++) {
          const inTime = ins[i].gameTime;
          const outTime = outs[i + 1] ? outs[i + 1].gameTime : currentGameTime;
          segments.push({ start: inTime, end: outTime });
        }
      }
    } else {
      for (let i = 0; i < ins.length; i++) {
        const inTime = ins[i].gameTime;
        const outTime = outs[i] ? outs[i].gameTime : currentGameTime;
        segments.push({ start: inTime, end: outTime });
      }
    }

    // Calculate active time for each segment, excluding stoppages and breaks
    let totalActiveTime = 0;

    for (const segment of segments) {
      // Split segment by period boundaries
      const chunks = splitSegmentByPeriods(
        segment,
        periods,
        game.gameStartTime
      );

      // Calculate time for each chunk (within a single period)
      chunks.forEach((chunk) => {
        const chunkTime = chunk.end - chunk.start;

        const stoppageTime = calculateStoppageTimeInRange(
          stoppages,
          chunk.start,
          chunk.end,
          chunk.periodNumber
        );

        totalActiveTime += Math.max(0, chunkTime - stoppageTime);
      });
    }

    return Math.round(totalActiveTime);
  },

  /**
   * Calculate current continuous time on field (since last sub in)
   * This is the duration since the player's most recent sub in
   */
  calculateCurrentTimeOnField: (player, currentGameTime) => {
    if (!player) return 0;

    const game = useGameStore.getState().game;
    if (!game || !game.gameStartTime) return 0;

    const ins = (player.ins || []).filter((sub) => sub.gameTime !== null);
    const outs = (player.outs || []).filter((sub) => sub.gameTime !== null);

    const isStarterNoSubs =
      (player.gameStatus === "starter" || player.gameStatus === "goalkeeper") &&
      ins.length === 0 &&
      outs.length === 0;

    if (isStarterNoSubs) {
      return get().calculateTotalTimeOnField(player, currentGameTime);
    }

    const isOnField = ins.length > outs.length;
    if (!isOnField) return 0;

    const lastIn = ins[ins.length - 1];
    const stoppages = game.stoppages || [];
    const periods = game.periods || [];

    // Find which period the last sub occurred in
    const segmentPeriod = findPeriodForGameTime(
      periods,
      lastIn.gameTime,
      game.gameStartTime
    );
    if (!segmentPeriod) return 0;

    // Split the segment from last sub to now by periods
    const segment = { start: lastIn.gameTime, end: currentGameTime };
    const chunks = splitSegmentByPeriods(segment, periods, game.gameStartTime);

    // Calculate total time excluding stoppages
    let totalTime = 0;
    chunks.forEach((chunk) => {
      const chunkTime = chunk.end - chunk.start;
      const stoppageTime = calculateStoppageTimeInRange(
        stoppages,
        chunk.start,
        chunk.end,
        chunk.periodNumber
      );
      totalTime += Math.max(0, chunkTime - stoppageTime);
    });

    return Math.round(totalTime);
  },

  /**
   * Calculate current continuous time off field (since last sub out)
   * This is the duration since the player's most recent sub out
   */
  calculateCurrentTimeOffField: (player, currentGameTime) => {
    if (!player) return 0;

    const ins = (player.ins || []).filter((sub) => sub.gameTime !== null);
    const outs = (player.outs || []).filter((sub) => sub.gameTime !== null);

    const isStarterNoOuts =
      (player.gameStatus === "starter" || player.gameStatus === "goalkeeper") &&
      ins.length === 0 &&
      outs.length === 0;

    if (isStarterNoOuts) return 0;

    const isOffField = outs.length >= ins.length;
    if (!isOffField) return 0;

    if (outs.length === 0) return Math.round(currentGameTime);

    const lastOut = outs[outs.length - 1];

    // Note: Time off field doesn't need stoppage adjustments
    // as the clock being stopped doesn't affect bench time
    return Math.max(0, Math.round(currentGameTime - lastOut.gameTime));
  },

  /**
   * Check if player is currently on field
   */
  isPlayerOnField: (player) => {
    if (!player) return false;

    const ins = (player.ins || []).filter((sub) => sub.gameTime !== null);
    const outs = (player.outs || []).filter((sub) => sub.gameTime !== null);

    if (
      (player.gameStatus === "starter" || player.gameStatus === "goalkeeper") &&
      ins.length === 0 &&
      outs.length === 0
    ) {
      return true;
    }

    return ins.length > outs.length;
  },

  /**
   * Check if player was on field at a specific game time
   * Used for plus/minus calculations
   */
  isPlayerOnFieldAtTime: (player, gameTime) => {
    if (!player) return false;

    const ins = (player.ins || []).filter((sub) => sub.gameTime !== null);
    const outs = (player.outs || []).filter((sub) => sub.gameTime !== null);

    const isStarter = ["starter", "goalkeeper"].includes(player.gameStatus);

    // Count effective ins/outs up to this game time
    const insBeforeTime = ins.filter((sub) => sub.gameTime <= gameTime).length;
    const outsBeforeTime = outs.filter(
      (sub) => sub.gameTime <= gameTime
    ).length;

    const effectiveIns = isStarter ? insBeforeTime + 1 : insBeforeTime;

    return effectiveIns > outsBeforeTime;
  },

  /**
   * Calculate plus/minus for a player
   * Plus/minus = goals for - goals against while player was on field
   */
  calculatePlusMinus: (player, gameId) => {
    if (!player) return 0;

    const game = useGameStore.getState().game;

    if (!game || game.game_id != gameId) return 0;

    // Get all goal events from game events store
    // Note: This assumes game events are loaded in the store

    const goalEvents = game.gameEventsGoals;
    let plusMinus = 0;
    goalEvents.forEach((goal) => {
      const wasOnField = get().isPlayerOnFieldAtTime(player, goal.game_time);

      if (wasOnField) {
        // Check if it was your team or opponent who scored
        if (goal.team_season_id === player.teamSeasonId) {
          plusMinus++; // Your team scored while you were on field
        } else {
          plusMinus--; // Opponent scored while you were on field
        }
      }
    });

    return plusMinus;
  },

  /**
   * Calculate plus/minus for all players in a game
   * Returns map of playerId -> plusMinus
   */
  calculateAllPlusMinus: (gameId) => {
    const players = useGamePlayersStore.getState().players;
    const plusMinusMap = {};

    players.forEach((player) => {
      plusMinusMap[player.id] = get().calculatePlusMinus(player, gameId);
    });

    return plusMinusMap;
  },

  /**
   * Get all players currently on field
   */
  getPlayersOnField: () => {
    const players = useGamePlayersStore.getState().players;
    return players.filter((player) => get().isPlayerOnField(player));
  },

  /**
   * Get all players currently on bench
   */
  getPlayersOnBench: () => {
    const players = useGamePlayersStore.getState().players;
    return players.filter((player) => !get().isPlayerOnField(player));
  },
  // ==================== GOALKEEPER TIME CALCULATIONS ====================

  /**
   * Calculate total time spent as goalkeeper
   * Accounts for stoppages and only counts time during active periods
   * Tracks GK status via gk_sub flag in substitutions
   */
  calculateGoalkeeperTime: (player, currentGameTime) => {
    if (!player) return 0;

    const game = useGameStore.getState().game;
    if (!game || !game.gameStartTime) return 0;

    const stoppages =
      game.gameEventsMajor.filter((s) => s.clock_should_run === 0) || [];
    const periods = game.periods || [];

    // Get all subs (confirmed only)
    const ins = (player.ins || []).filter((sub) => sub.gameTime !== null);
    const outs = (player.outs || []).filter((sub) => sub.gameTime !== null);

    // Check if started as goalkeeper
    const startedAsGK = player.gameStatus === "goalkeeper";

    // Build time segments when player was in goal
    const gkSegments = [];

    if (startedAsGK) {
      // Started as GK
      const firstGkOut = outs.find((sub) => sub.gkSub);

      if (!firstGkOut) {
        // Still in goal or subbed out as field player
        const regularOut = outs[0];
        gkSegments.push({
          start: 0,
          end: regularOut ? regularOut.gameTime : currentGameTime,
        });
      } else {
        // Subbed out as GK
        gkSegments.push({ start: 0, end: firstGkOut.gameTime });

        // Check for subsequent GK stints
        let gkIns = ins.filter((sub) => sub.gkSub);
        let gkOuts = outs.filter((sub) => sub.gkSub);

        for (let i = 0; i < gkIns.length; i++) {
          const inTime = gkIns[i].gameTime;
          const outTime = gkOuts[i + 1]
            ? gkOuts[i + 1].gameTime
            : currentGameTime;
          gkSegments.push({ start: inTime, end: outTime });
        }
      }
    } else {
      // Did not start as GK, check for GK subs in
      const gkIns = ins.filter((sub) => sub.gkSub);
      const gkOuts = outs.filter((sub) => sub.gkSub);

      for (let i = 0; i < gkIns.length; i++) {
        const inTime = gkIns[i].gameTime;
        const outTime = gkOuts[i] ? gkOuts[i].gameTime : currentGameTime;
        gkSegments.push({ start: inTime, end: outTime });
      }
    }

    // Calculate active time for each GK segment, excluding stoppages and breaks
    let totalGkTime = 0;

    for (const segment of gkSegments) {
      // Split segment by period boundaries
      const chunks = splitSegmentByPeriods(
        segment,
        periods,
        game.gameStartTime
      );

      // Calculate time for each chunk (within a single period)
      chunks.forEach((chunk) => {
        const chunkTime = chunk.end - chunk.start;

        const stoppageTime = calculateStoppageTimeInRange(
          stoppages,
          chunk.start,
          chunk.end,
          chunk.periodNumber
        );

        totalGkTime += Math.max(0, chunkTime - stoppageTime);
      });
    }

    return Math.round(totalGkTime);
  },

  /**
   * Check if player is currently goalkeeper
   */
  isPlayerCurrentlyGoalkeeper: (player) => {
    if (!player) return false;

    // If current game status is goalkeeper, they're the current GK
    if (player.gameStatus === "goalkeeper") return true;

    // Check if they're on field and their last sub was a GK sub in
    const ins = (player.ins || []).filter((sub) => sub.gameTime !== null);
    const outs = (player.outs || []).filter((sub) => sub.gameTime !== null);

    const isOnField = ins.length > outs.length;
    if (!isOnField) return false;

    const lastIn = ins[ins.length - 1];
    return lastIn && lastIn.gkSub === true;
  },

  /**
   * Calculate goalkeeper time for all players
   * Returns map of playerId -> goalkeeperTime
   */
  calculateAllGoalkeeperTime: (gameId, currentGameTime) => {
    const players = useGamePlayersStore.getState().players;
    const gkTimeMap = {};

    players.forEach((player) => {
      gkTimeMap[player.id] = get().calculateGoalkeeperTime(
        player,
        currentGameTime
      );
    });

    return gkTimeMap;
  },
}));
export default useGamePlayerTimeStore;
