// PlayersContext.js
"use client";
import { gameDayPlayers } from "@/mockData";
import React, { createContext, useContext, useState, useCallback } from "react";

const PlayersContext = createContext();

export function GamePlayersProvider({ children }) {
  const [players, setPlayers] = useState(gameDayPlayers);

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
        // If assigning goalkeeper, demote any existing goalkeeper
        if (
          action === "goalkeeper" &&
          p.id !== playerId &&
          p.gameStatus === "goalkeeper"
        ) {
          return { ...p, gameStatus: "starter" };
        }

        // Update the target player
        if (p.id === playerId) {
          return { ...p, gameStatus: updatedStatus };
        }

        return p;
      });
    });
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
