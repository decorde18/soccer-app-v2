// hooks/useGameTime.js
import { useState, useEffect } from "react";
import useGameStore from "@/stores/gameStore";

/**
 * Hook that provides real-time game time updates
 * @param {number} updateInterval - Update interval in milliseconds (default: 1000)
 * @returns {number} Current game time in seconds
 */
export function useGameTime(updateInterval = 1000) {
  const getGameTime = useGameStore((s) => s.getGameTime);
  const [gameTime, setGameTime] = useState(getGameTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setGameTime(getGameTime());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [getGameTime, updateInterval]);

  return gameTime;
}

/**
 * Hook that provides real-time period time updates
 * @param {number} updateInterval - Update interval in milliseconds (default: 1000)
 * @returns {number} Current period time in seconds
 */
export function usePeriodTime(updateInterval = 1000) {
  const getPeriodTime = useGameStore((s) => s.getPeriodTime);
  const [periodTime, setPeriodTime] = useState(getPeriodTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setPeriodTime(getPeriodTime());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [getPeriodTime, updateInterval]);

  return periodTime;
}

/**
 * Hook that provides the current game stage
 * @returns {string} Current game stage
 */
export function useGameStage() {
  const gameStage = useGameStore((s) => s.getGameStage());
  return gameStage;
}

/**
 * Hook that provides formatted game time with auto-updates
 * @param {Function} formatter - Time formatting function (default: formatTime)
 * @param {number} updateInterval - Update interval in milliseconds (default: 1000)
 * @returns {string} Formatted game time
 */
export function useFormattedGameTime(formatter = null, updateInterval = 1000) {
  const getGameTime = useGameStore((s) => s.getGameTime);
  const [formattedTime, setFormattedTime] = useState("00:00");

  // Import formatTime dynamically if no formatter provided
  useEffect(() => {
    const updateTime = async () => {
      const time = getGameTime();

      if (formatter) {
        setFormattedTime(formatter(time));
      } else {
        // Dynamically import formatTime if no formatter provided
        const { formatTime } = await import("@/lib/timeUtils");
        setFormattedTime(formatTime(time));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, updateInterval);

    return () => clearInterval(interval);
  }, [getGameTime, formatter, updateInterval]);

  return formattedTime;
}

/**
 * Hook that provides formatted period time with auto-updates
 * @param {Function} formatter - Time formatting function (default: formatTime)
 * @param {number} updateInterval - Update interval in milliseconds (default: 1000)
 * @returns {string} Formatted period time
 */
export function useFormattedPeriodTime(
  formatter = null,
  updateInterval = 1000
) {
  const getPeriodTime = useGameStore((s) => s.getPeriodTime);
  const [formattedTime, setFormattedTime] = useState("00:00");

  useEffect(() => {
    const updateTime = async () => {
      const time = getPeriodTime();

      if (formatter) {
        setFormattedTime(formatter(time));
      } else {
        const { formatTime } = await import("@/lib/timeUtils");
        setFormattedTime(formatTime(time));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, updateInterval);

    return () => clearInterval(interval);
  }, [getPeriodTime, formatter, updateInterval]);

  return formattedTime;
}

/**
 * Hook that provides player time on field with auto-updates
 * @param {object} player - Player object
 * @param {number} updateInterval - Update interval in milliseconds (default: 1000)
 * @returns {object} Object with totalTime, currentTimeOnField, currentTimeOffField
 */
export function usePlayerTimeOnField(player, updateInterval = 1000) {
  const getGameTime = useGameStore((s) => s.getGameTime);
  const gamePlayersStore = require("@/stores/gamePlayersStore").default;

  const calculateTotalTimeOnField = gamePlayersStore(
    (s) => s.calculateTotalTimeOnField
  );
  const calculateCurrentTimeOnField = gamePlayersStore(
    (s) => s.calculateCurrentTimeOnField
  );
  const calculateCurrentTimeOffField = gamePlayersStore(
    (s) => s.calculateCurrentTimeOffField
  );

  const [times, setTimes] = useState({
    totalTime: 0,
    currentTimeOnField: 0,
    currentTimeOffField: 0,
  });

  useEffect(() => {
    if (!player) return;

    const updateTimes = () => {
      const currentGameTime = getGameTime();

      setTimes({
        totalTime: calculateTotalTimeOnField(player, currentGameTime),
        currentTimeOnField: calculateCurrentTimeOnField(
          player,
          currentGameTime
        ),
        currentTimeOffField: calculateCurrentTimeOffField(
          player,
          currentGameTime
        ),
      });
    };

    updateTimes();
    const interval = setInterval(updateTimes, updateInterval);

    return () => clearInterval(interval);
  }, [
    player,
    getGameTime,
    calculateTotalTimeOnField,
    calculateCurrentTimeOnField,
    calculateCurrentTimeOffField,
    updateInterval,
  ]);

  return times;
}

/**
 * Hook that provides game info summary
 * @returns {object} Object with current period, stage, times, etc.
 */
export function useGameInfo() {
  const game = useGameStore((s) => s.game);
  const gameStage = useGameStore((s) => s.getGameStage());
  const getCurrentPeriodLabel = useGameStore((s) => s.getCurrentPeriodLabel());
  const getCurrentPeriodNumber = useGameStore((s) =>
    s.getCurrentPeriodNumber()
  );
  const gameTime = useGameTime();
  const periodTime = usePeriodTime();

  return {
    game,
    gameStage,
    currentPeriodLabel: getCurrentPeriodLabel,
    currentPeriodNumber: getCurrentPeriodNumber,
    gameTime,
    periodTime,
  };
}

/**
 * Hook that checks if game is in a specific stage
 * @param {string} stage - Game stage to check
 * @returns {boolean} True if game is in specified stage
 */
export function useIsGameStage(stage) {
  const currentStage = useGameStage();
  return currentStage === stage;
}

/**
 * Hook that provides game actions
 * @returns {object} Object with game control functions
 */
export function useGameActions() {
  const startGame = useGameStore((s) => s.startGame);
  const endPeriod = useGameStore((s) => s.endPeriod);
  const startNextPeriod = useGameStore((s) => s.startNextPeriod);
  const startStoppage = useGameStore((s) => s.startStoppage);
  const endStoppage = useGameStore((s) => s.endStoppage);

  return {
    startGame,
    endPeriod,
    startNextPeriod,
    startStoppage,
    endStoppage,
  };
}
