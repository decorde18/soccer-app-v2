// PlayersContext.js
"use client";
import { gameDayPlayers } from "@/mockData";
import React, { createContext, useContext, useState, useCallback } from "react";
import { useGame } from "./GameLiveContext";

const PlayersContext = createContext();

export function GamePlayersProvider({ children }) {
  const [players, setPlayers] = useState(gameDayPlayers);

  // Add error handling for the useGame hook
  const gameContext = useGame();
  const getGameTime = gameContext?.getGameTime || (() => 0);
  const game = gameContext?.game;

  const updatePlayer = useCallback((playerId, updates) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === playerId ? { ...player, ...updates } : player
      )
    );
  }, []);

  const updatePlayerStat = useCallback((playerId, stat, value) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === playerId ? { ...player, [stat]: value } : player
      )
    );
  }, []);

  const incrementPlayerStat = useCallback((playerId, stat, amount = 1) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === playerId
          ? { ...player, [stat]: player[stat] + amount }
          : player
      )
    );
  }, []);

  const updateFieldStatus = useCallback((row) => {
    const fieldStatusUpdates = {
      onField: "subbingOut",
      onBench: "subbingIn",
      subbingOut: "onField",
      subbingIn: "onBench",
      subbingOutGk: "onFieldGk",
      onFieldGk: "subbingOutGk",
    };
    const { id, fieldStatus } = row;

    setPlayers((prevPlayers) =>
      prevPlayers.map((player) => {
        if (player.id !== id) return player;
        return { ...player, fieldStatus: fieldStatusUpdates[fieldStatus] };
      })
    );
  }, []);

  const updateGameStatus = useCallback((playerId, action) => {
    setPlayers((prevPlayers) => {
      const currentPlayer = prevPlayers.find((p) => p.id === playerId);
      if (!currentPlayer) return prevPlayers;

      let updatedStatus = action;

      if (action === "toggle") {
        const cycle = {
          goalkeeper: "injured",
          starter: "injured",
          bench: "injured",
          available: "injured",
          unavailable: "available",
          injured: "unavailable",
        };
        updatedStatus =
          cycle[currentPlayer.gameStatus] || currentPlayer.gameStatus;
      }

      if (action === "goalkeeper") {
        if (currentPlayer.gameStatus === "goalkeeper") {
          updatedStatus = "starter";
        } else {
          updatedStatus = "goalkeeper";
        }
      }

      return prevPlayers.map((p) => {
        if (
          action === "goalkeeper" &&
          p.id !== playerId &&
          p.gameStatus === "goalkeeper"
        ) {
          return { ...p, gameStatus: "starter" };
        }

        if (p.id === playerId) {
          return { ...p, gameStatus: updatedStatus };
        }

        return p;
      });
    });
  }, []);

  // ==================== SUBSTITUTION TRACKING ====================

  const recordSubIn = useCallback(
    async (playerId) => {
      try {
        const currentGameTime = getGameTime();

        setPlayers((prevPlayers) =>
          prevPlayers.map((player) => {
            if (player.id !== playerId) return player;

            const ins = player.ins || [];
            return {
              ...player,
              ins: [...ins, currentGameTime],
            };
          })
        );

        // Sync to database immediately
        const updates = {
          playerId,
          action: "sub_in",
          gameTime: currentGameTime,
          timestamp: Date.now(),
        };

        await syncSubToDatabase(updates);
      } catch (error) {
        console.error("Error recording sub in:", error);
        // Don't throw - let the UI continue working
      }
    },
    [getGameTime, game]
  );

  const recordSubOut = useCallback(
    async (playerId) => {
      try {
        const currentGameTime = getGameTime();

        setPlayers((prevPlayers) =>
          prevPlayers.map((player) => {
            if (player.id !== playerId) return player;

            const outs = player.outs || [];
            return {
              ...player,
              outs: [...outs, currentGameTime],
            };
          })
        );

        const updates = {
          playerId,
          action: "sub_out",
          gameTime: currentGameTime,
          timestamp: Date.now(),
        };

        await syncSubToDatabase(updates);
      } catch (error) {
        console.error("Error recording sub out:", error);
        // Don't throw - let the UI continue working
      }
    },
    [getGameTime, game]
  );

  async function syncSubToDatabase(updates) {
    try {
      if (!game?.id) {
        console.warn("No game ID available for sync");
        return false;
      }

      const response = await fetch("/api/subs/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game.id,
          ...updates,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sub sync failed: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Database sync error for substitution:", error);
      // Don't throw - log and continue
      return false;
    }
  }

  // Rest of your time calculation functions remain the same...
  const calculateTotalTimeOnField = useCallback((player, currentGameTime) => {
    if (!player) return 0;

    const ins = player.ins || [];
    const outs = player.outs || [];

    const effectiveIns =
      ins.length === 0 &&
      (player.gameStatus === "starter" || player.gameStatus === "goalkeeper")
        ? [0]
        : ins;

    let totalTime = 0;

    const minLength = Math.min(effectiveIns.length, outs.length);
    for (let i = 0; i < minLength; i++) {
      totalTime += outs[i] - effectiveIns[i];
    }

    if (effectiveIns.length > outs.length) {
      const lastIn = effectiveIns[effectiveIns.length - 1];
      totalTime += currentGameTime - lastIn;
    }

    return Math.max(0, totalTime);
  }, []);

  const calculateCurrentTimeOnField = useCallback((player, currentGameTime) => {
    if (!player) return 0;

    const ins = player.ins || [];
    const outs = player.outs || [];

    const isStarterNoSubs =
      (player.gameStatus === "starter" || player.gameStatus === "goalkeeper") &&
      ins.length === 0 &&
      outs.length === 0;

    if (isStarterNoSubs) {
      return currentGameTime;
    }

    const isOnField = ins.length > outs.length;
    if (!isOnField) return 0;

    const lastIn = ins[ins.length - 1];
    return Math.max(0, currentGameTime - lastIn);
  }, []);

  const calculateCurrentTimeOffField = useCallback(
    (player, currentGameTime) => {
      if (!player) return 0;

      const ins = player.ins || [];
      const outs = player.outs || [];

      const isStarterNoOuts =
        (player.gameStatus === "starter" ||
          player.gameStatus === "goalkeeper") &&
        ins.length === 0 &&
        outs.length === 0;

      if (isStarterNoOuts) {
        return 0;
      }

      const isOffField = outs.length >= ins.length;
      if (!isOffField) return 0;

      if (outs.length === 0) {
        return currentGameTime;
      }

      const lastOut = outs[outs.length - 1];
      return Math.max(0, currentGameTime - lastOut);
    },
    []
  );

  const isPlayerOnField = useCallback((player) => {
    if (!player) return false;

    const ins = player.ins || [];
    const outs = player.outs || [];

    if (
      (player.gameStatus === "starter" || player.gameStatus === "goalkeeper") &&
      ins.length === 0 &&
      outs.length === 0
    ) {
      return true;
    }

    return ins.length > outs.length;
  }, []);

  const getPlayersByFieldStatus = useCallback(
    (fieldStatus) => {
      return players.filter((player) => player.fieldStatus === fieldStatus);
    },
    [players]
  );

  const getPlayersByGameStatus = useCallback(
    (gameStatus) => {
      return players.filter((player) => player.gameStatus === gameStatus);
    },
    [players]
  );

  const value = {
    players,
    updatePlayer,
    updatePlayerStat,
    incrementPlayerStat,
    updateFieldStatus,
    updateGameStatus,
    getPlayersByFieldStatus,
    getPlayersByGameStatus,
    recordSubIn,
    recordSubOut,
    calculateTotalTimeOnField,
    calculateCurrentTimeOnField,
    calculateCurrentTimeOffField,
    isPlayerOnField,
  };

  return (
    <PlayersContext.Provider value={value}>{children}</PlayersContext.Provider>
  );
}

export function usePlayers() {
  const context = useContext(PlayersContext);
  if (!context) {
    throw new Error("usePlayers must be used within a PlayersProvider");
  }
  return context;
}
