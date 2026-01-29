// stores/gameEventsStore.js
// Write-only event recording with optimistic updates
import { create } from "zustand";
import useGameStore from "./gameStore";
import useGamePlayersStore from "./gamePlayersStore";
import { apiFetch } from "@/app/api/fetcher";

const useGameEventsStore = create((set, get) => ({
  // ==================== RECORDING STATE ====================
  isRecording: false,

  // ==================== STAT CALCULATION HELPERS ====================

  /**
   * Calculate team stats from gameStore data
   */
  calculateTeamStats: () => {
    const game = useGameStore.getState().game;
    if (!game) return null;

    const teamSeasonId = game.isHome
      ? game.home_team_season_id
      : game.away_team_season_id;

    const stats = {
      corner: { us: 0, them: 0 },
      offside: { us: 0, them: 0 },
      foul: { us: 0, them: 0 },
      throwIn: { us: 0, them: 0 },
      goalKick: { us: 0, them: 0 },
      freeKick: { us: 0, them: 0 },
      shot: 0,
      shotOnTarget: 0,
      save: 0,
    };

    // Team events
    game.gameEventsTeam.forEach((event) => {
      const isUs = event.team_season_id === teamSeasonId;

      switch (event.event_type) {
        case "corner":
          isUs ? stats.corner.us++ : stats.corner.them++;
          break;
        case "offside":
          isUs ? stats.offside.us++ : stats.offside.them++;
          break;
        case "foul":
          isUs ? stats.foul.us++ : stats.foul.them++;
          break;
        case "throw_in":
          isUs ? stats.throwIn.us++ : stats.throwIn.them++;
          break;
        case "goal_kick":
          isUs ? stats.goalKick.us++ : stats.goalKick.them++;
          break;
        case "free_kick":
          isUs ? stats.freeKick.us++ : stats.freeKick.them++;
          break;
      }
    });

    // Player actions
    game.playerActions.forEach((action) => {
      if (action.event_type === "shot") stats.shot++;
      if (action.event_type === "shot_on_target") stats.shotOnTarget++;
      if (action.event_type === "save") stats.save++;
    });

    return stats;
  },

  /**
   * Get goal scorers with details
   */
  getGoalScorers: () => {
    const game = useGameStore.getState().game;
    if (!game) return [];

    const teamSeasonId = game.isHome
      ? game.home_team_season_id
      : game.away_team_season_id;

    return game.gameEventsGoals
      .filter((g) => g.team_season_id === teamSeasonId)
      .map((goal) => ({
        id: goal.goal_id,
        scorerName: goal.scorer_name,
        scorerJersey: goal.scorer_jersey_number,
        assistName: goal.assist_name,
        assistJersey: goal.assist_jersey_number,
        gameTime: goal.game_time,
        period: goal.period,
        isOwnGoal: goal.is_own_goal,
        goalTypes: goal.goal_types,
      }));
  },

  /**
   * Get discipline events (cards)
   */
  getDisciplineEvents: () => {
    const game = useGameStore.getState().game;
    if (!game) return [];

    const teamSeasonId = game.isHome
      ? game.home_team_season_id
      : game.away_team_season_id;

    return game.gameEventsDiscipline.map((card) => ({
      id: card.discipline_id,
      playerName: card.player_name,
      jerseyNumber: card.jersey_number,
      cardType: card.card_type,
      cardReason: card.card_reason,
      gameTime: card.game_time,
      period: card.period,
      isOurTeam: card.team_season_id === teamSeasonId,
    }));
  },

  /**
   * Get penalty kick events
   */
  getPenaltyKicks: () => {
    const game = useGameStore.getState().game;
    if (!game) return [];

    return game.gameEventsPenalties.map((pk) => ({
      id: pk.penalty_id,
      shooterName: pk.shooter_name,
      shooterJersey: pk.shooter_jersey_number,
      gkName: pk.gk_name,
      outcome: pk.outcome,
      isShootout: pk.is_shootout,
      shootoutRound: pk.shootout_round,
      gameTime: pk.game_time,
      period: pk.period,
    }));
  },

  // ==================== RECORD GOAL ====================

  // recordGoal: async (goalData) => {
  //   const gameStore = useGameStore.getState();
  //   const playersStore = useGamePlayersStore.getState();
  //   const game = gameStore.game;
  //   const gameTime = gameStore.getGameTime();
  //   const period = gameStore.getCurrentPeriodNumber();

  //   set({ isRecording: true });

  //   try {
  //     // 1. Create major event (stoppage)
  //     const majorEvent = await apiFetch("game_events_major", "POST", {
  //       game_id: game.game_id,
  //       event_type: "goal",
  //       game_time: gameTime,
  //       end_time: null,
  //       period: period,
  //       clock_should_run: 1,
  //       details: goalData.details || null,
  //     });

  //     // 2. Determine team_season_id
  //     let teamSeasonId = goalData.teamSeasonId;
  //     let scorerPlayerGameId = goalData.scorerPlayerGameId;
  //     let opponentJerseyNumber = goalData.opponentJerseyNumber || null;

  //     if (!teamSeasonId && scorerPlayerGameId) {
  //       const player = playersStore.getPlayerByPlayerGameId(scorerPlayerGameId);
  //       if (player) {
  //         teamSeasonId = player.teamSeasonId;
  //       }
  //     }

  //     if (!teamSeasonId) {
  //       teamSeasonId = game.isHome
  //         ? game.home_team_season_id
  //         : game.away_team_season_id;
  //     }

  //     // 3. Determine defending GK
  //     let defendingGkPlayerGameId = goalData.defendingGkPlayerGameId;

  //     // If not provided and it's a goal against us, find current GK
  //     const ourTeamSeasonId = game.isHome
  //       ? game.home_team_season_id
  //       : game.away_team_season_id;
  //     const isGoalAgainstUs = teamSeasonId !== ourTeamSeasonId;

  //     if (!defendingGkPlayerGameId && isGoalAgainstUs) {
  //       const currentGK = playersStore.getCurrentGoalkeeper();
  //       if (currentGK) {
  //         defendingGkPlayerGameId = currentGK.playerGameId;
  //       }
  //     }

  //     // 4. Create goal event
  //     const goalEventResponse = await apiFetch("game_events_goals", "POST", {
  //       major_event_id: majorEvent.id,
  //       team_season_id: teamSeasonId,
  //       scorer_player_game_id: scorerPlayerGameId || null,
  //       opponent_jersey_number: opponentJerseyNumber,
  //       assist_player_game_id: goalData.assistPlayerGameId || null,
  //       defending_gk_player_game_id: defendingGkPlayerGameId || null,
  //       is_own_goal: goalData.isOwnGoal || 0,
  //       goal_types: goalData.goalTypes
  //         ? JSON.stringify(goalData.goalTypes)
  //         : null,
  //     });

  //     // Ensure the goal event has all the fields we need for display/delete
  //     const goalEvent = {
  //       ...goalEventResponse,
  //       id: goalEventResponse.id, // Ensure id is set
  //       goal_id: goalEventResponse.id, // Also set goal_id for views compatibility
  //       major_event_id: majorEvent.id,
  //       team_season_id: teamSeasonId,
  //       game_time: gameTime,
  //       period: period,
  //     };

  //     // 5. Optimistically update the game store
  //     gameStore.addGoalEvent(goalEvent, majorEvent);

  //     // 6. Trigger plus/minus recalculation
  //     playersStore.calculateAndUpdatePlusMinus(game.game_id);

  //     set({ isRecording: false });
  //     return goalEvent;
  //   } catch (error) {
  //     console.error("Error recording goal:", error);
  //     set({ isRecording: false });
  //     throw error;
  //   }
  // },
  recordGoal: async (goalData) => {
    const gameStore = useGameStore.getState();
    const playersStore = useGamePlayersStore.getState();
    const game = gameStore.game;
    const gameTime = gameStore.getGameTime();
    const period = gameStore.getCurrentPeriodNumber();

    // Determine team_season_id
    let teamSeasonId = goalData.teamSeasonId;
    if (!teamSeasonId && goalData.scorerPlayerGameId) {
      const player = playersStore.getPlayerByPlayerGameId(
        goalData.scorerPlayerGameId,
      );
      if (player) teamSeasonId = player.teamSeasonId;
    }
    if (!teamSeasonId) {
      teamSeasonId = game.isHome
        ? game.home_team_season_id
        : game.away_team_season_id;
    }

    // Determine defending GK
    let defendingGkPlayerGameId = goalData.defendingGkPlayerGameId;
    const ourTeamSeasonId = game.isHome
      ? game.home_team_season_id
      : game.away_team_season_id;
    const isGoalAgainstUs = teamSeasonId !== ourTeamSeasonId;

    if (!defendingGkPlayerGameId && isGoalAgainstUs) {
      const currentGK = playersStore.getCurrentGoalkeeper();
      if (currentGK) defendingGkPlayerGameId = currentGK.playerGameId;
    }

    // CREATE OPTIMISTIC DATA IMMEDIATELY
    const optimisticMajorEvent = {
      id: `temp_major_${Date.now()}_${Math.random()}`,
      game_id: game.game_id,
      event_type: "goal",
      game_time: gameTime,
      end_time: null,
      period: period,
      clock_should_run: 1,
      details: goalData.details || null,
    };

    const optimisticGoalEvent = {
      id: `temp_goal_${Date.now()}_${Math.random()}`,
      goal_id: `temp_goal_${Date.now()}_${Math.random()}`, // For compatibility
      major_event_id: optimisticMajorEvent.id,
      team_season_id: teamSeasonId,
      scorer_player_game_id: goalData.scorerPlayerGameId || null,
      opponent_jersey_number: goalData.opponentJerseyNumber || null,
      assist_player_game_id: goalData.assistPlayerGameId || null,
      defending_gk_player_game_id: defendingGkPlayerGameId || null,
      is_own_goal: goalData.isOwnGoal || 0,
      goal_types: goalData.goalTypes
        ? JSON.stringify(goalData.goalTypes)
        : null,
      game_time: gameTime,
      period: period,
      // Add display names for immediate UI rendering
      scorer_name: goalData.scorerPlayerGameId
        ? playersStore.getPlayerByPlayerGameId(goalData.scorerPlayerGameId)
            ?.fullName
        : null,
      scorer_jersey_number: goalData.scorerPlayerGameId
        ? playersStore.getPlayerByPlayerGameId(goalData.scorerPlayerGameId)
            ?.jerseyNumber
        : null,
      assist_name: goalData.assistPlayerGameId
        ? playersStore.getPlayerByPlayerGameId(goalData.assistPlayerGameId)
            ?.fullName
        : null,
      assist_jersey_number: goalData.assistPlayerGameId
        ? playersStore.getPlayerByPlayerGameId(goalData.assistPlayerGameId)
            ?.jerseyNumber
        : null,
    };

    // UPDATE UI IMMEDIATELY
    gameStore.addGoalEvent(optimisticGoalEvent, optimisticMajorEvent);
    playersStore.calculateAndUpdatePlusMinus(game.game_id);

    set({ isRecording: true });

    try {
      // NOW send to server in background
      const majorEvent = await apiFetch("game_events_major", "POST", {
        game_id: game.game_id,
        event_type: "goal",
        game_time: gameTime,
        end_time: null,
        period: period,
        clock_should_run: 1,
        details: goalData.details || null,
      });

      const goalEventResponse = await apiFetch("game_events_goals", "POST", {
        major_event_id: majorEvent.id,
        team_season_id: teamSeasonId,
        scorer_player_game_id: goalData.scorerPlayerGameId || null,
        opponent_jersey_number: goalData.opponentJerseyNumber || null,
        assist_player_game_id: goalData.assistPlayerGameId || null,
        defending_gk_player_game_id: defendingGkPlayerGameId || null,
        is_own_goal: goalData.isOwnGoal || 0,
        goal_types: goalData.goalTypes
          ? JSON.stringify(goalData.goalTypes)
          : null,
      });

      // Replace optimistic with real data
      const realGoalEvent = {
        ...goalEventResponse,
        goal_id: goalEventResponse.id,
        major_event_id: majorEvent.id,
        team_season_id: teamSeasonId,
        game_time: gameTime,
        period: period,
      };

      gameStore.replaceGoalEvent(
        optimisticGoalEvent.id,
        realGoalEvent,
        optimisticMajorEvent.id,
        majorEvent,
      );

      set({ isRecording: false });
      return realGoalEvent;
    } catch (error) {
      console.error("Error recording goal:", error);

      // ROLLBACK: Remove optimistic data
      gameStore.removeGoalEvent(
        optimisticGoalEvent.id,
        optimisticMajorEvent.id,
      );
      playersStore.calculateAndUpdatePlusMinus(game.game_id);

      set({ isRecording: false });
      throw error;
    }
  },
  // ==================== RECORD DISCIPLINE (CARD) ====================

  // recordCard: async (cardData) => {
  //   const gameStore = useGameStore.getState();
  //   const game = gameStore.game;
  //   const gameTime = gameStore.getGameTime();
  //   const period = gameStore.getCurrentPeriodNumber();

  //   set({ isRecording: true });

  //   try {
  //     // 1. Create major event
  //     const majorEvent = await apiFetch("game_events_major", "POST", {
  //       game_id: game.game_id,
  //       event_type: "discipline",
  //       game_time: gameTime,
  //       end_time: null,
  //       period: period,
  //       clock_should_run: 1,
  //       details: cardData.cardReason || null,
  //     });

  //     // 2. Determine team_season_id
  //     let teamSeasonId = cardData.teamSeasonId;
  //     let playerGameId = cardData.playerGameId;
  //     let opponentJerseyNumber = cardData.opponentJerseyNumber || null;

  //     if (!teamSeasonId && playerGameId) {
  //       const playersStore = useGamePlayersStore.getState();
  //       const player = playersStore.getPlayerByPlayerGameId(playerGameId);
  //       if (player) {
  //         teamSeasonId = player.teamSeasonId;
  //       }
  //     }

  //     if (!teamSeasonId) {
  //       teamSeasonId = game.isHome
  //         ? game.home_team_season_id
  //         : game.away_team_season_id;
  //     }

  //     // 3. Create discipline event
  //     const cardEvent = await apiFetch("game_events_discipline", "POST", {
  //       major_event_id: majorEvent.id,
  //       team_season_id: teamSeasonId,
  //       player_game_id: playerGameId || null,
  //       opponent_jersey_number: opponentJerseyNumber,
  //       card_type: cardData.cardType,
  //       card_reason: cardData.cardReason || null,
  //     });

  //     // 4. Optimistically update the game store
  //     gameStore.addDisciplineEvent(cardEvent, majorEvent);

  //     set({ isRecording: false });
  //     return cardEvent;
  //   } catch (error) {
  //     console.error("Error recording card:", error);
  //     set({ isRecording: false });
  //     throw error;
  //   }
  // },

  // ==================== RECORD PENALTY KICK ====================
  recordCard: async (cardData) => {
    const gameStore = useGameStore.getState();
    const playersStore = useGamePlayersStore.getState();
    const game = gameStore.game;
    const gameTime = gameStore.getGameTime();
    const period = gameStore.getCurrentPeriodNumber();

    // CREATE OPTIMISTIC DATA
    const optimisticMajorEvent = {
      id: `temp_major_${Date.now()}_${Math.random()}`,
      game_id: game.game_id,
      event_type: "discipline",
      game_time: gameTime,
      end_time: null,
      period: period,
      clock_should_run: 1,
      details: cardData.details || null,
    };

    const player = cardData.playerGameId
      ? playersStore.getPlayerByPlayerGameId(cardData.playerGameId)
      : null;

    const optimisticCardEvent = {
      id: `temp_card_${Date.now()}_${Math.random()}`,
      discipline_id: `temp_card_${Date.now()}_${Math.random()}`,
      major_event_id: optimisticMajorEvent.id,
      player_game_id: cardData.playerGameId || null,
      team_season_id:
        player?.teamSeasonId ||
        (game.isHome ? game.home_team_season_id : game.away_team_season_id),
      opponent_jersey_number: cardData.opponentJerseyNumber || null,
      card_type: cardData.cardType,
      card_reason: cardData.cardReason || null,
      game_time: gameTime,
      period: period,
      // Display names
      player_name: player?.fullName || null,
      jersey_number: player?.jerseyNumber || null,
    };

    // UPDATE UI IMMEDIATELY
    gameStore.addDisciplineEvent(optimisticCardEvent, optimisticMajorEvent);

    set({ isRecording: true });

    try {
      // Send to server
      const majorEvent = await apiFetch("game_events_major", "POST", {
        game_id: game.game_id,
        event_type: "discipline",
        game_time: gameTime,
        end_time: null,
        period: period,
        clock_should_run: 1,
        details: cardData.details || null,
      });

      const cardEventResponse = await apiFetch(
        "game_events_discipline",
        "POST",
        {
          major_event_id: majorEvent.id,
          player_game_id: cardData.playerGameId || null,
          team_season_id:
            player?.teamSeasonId ||
            (game.isHome ? game.home_team_season_id : game.away_team_season_id),
          opponent_jersey_number: cardData.opponentJerseyNumber || null,
          card_type: cardData.cardType,
          card_reason: cardData.cardReason || null,
        },
      );

      const realCardEvent = {
        ...cardEventResponse,
        discipline_id: cardEventResponse.id,
        major_event_id: majorEvent.id,
        game_time: gameTime,
        period: period,
      };

      // Replace optimistic with real
      gameStore.replaceDisciplineEvent(
        optimisticCardEvent.id,
        realCardEvent,
        optimisticMajorEvent.id,
        majorEvent,
      );

      set({ isRecording: false });
      return realCardEvent;
    } catch (error) {
      console.error("Error recording card:", error);

      // ROLLBACK
      gameStore.removeDisciplineEvent(
        optimisticCardEvent.id,
        optimisticMajorEvent.id,
      );

      set({ isRecording: false });
      throw error;
    }
  },
  recordPenaltyKick: async (penaltyData) => {
    const gameStore = useGameStore.getState();
    const playersStore = useGamePlayersStore.getState();
    const game = gameStore.game;
    const gameTime = gameStore.getGameTime();
    const period = gameStore.getCurrentPeriodNumber();

    set({ isRecording: true });

    try {
      // 1. Create major event
      const majorEvent = await apiFetch("game_events_major", "POST", {
        game_id: game.game_id,
        event_type: "penalty",
        game_time: gameTime,
        end_time: null,
        period: period,
        clock_should_run: 1,
        details: penaltyData.details || null,
      });

      // 2. Determine team_season_id
      let teamSeasonId = penaltyData.teamSeasonId;
      const shooterPlayerGameId = penaltyData.shooterPlayerGameId;

      if (!teamSeasonId && shooterPlayerGameId) {
        const player =
          playersStore.getPlayerByPlayerGameId(shooterPlayerGameId);
        if (player) {
          teamSeasonId = player.teamSeasonId;
        }
      }

      if (!teamSeasonId) {
        teamSeasonId = game.isHome
          ? game.home_team_season_id
          : game.away_team_season_id;
      }

      // 3. Determine defending GK
      let gkPlayerGameId = penaltyData.gkPlayerGameId;

      // If not provided, find current GK (they're defending this penalty)
      if (!gkPlayerGameId) {
        const currentGK = playersStore.getCurrentGoalkeeper();
        if (currentGK) {
          gkPlayerGameId = currentGK.playerGameId;
        }
      }

      // 4. Create penalty event
      const penaltyEvent = await apiFetch("game_events_penalties", "POST", {
        major_event_id: majorEvent.id,
        game_id: penaltyData.isShootout ? game.game_id : null,
        team_season_id: teamSeasonId,
        shooter_player_game_id: shooterPlayerGameId || null,
        opponent_jersey_number: penaltyData.opponentJerseyNumber || null,
        gk_player_game_id: gkPlayerGameId || null,
        outcome: penaltyData.outcome,
        is_shootout: penaltyData.isShootout || 0,
        shootout_round: penaltyData.shootoutRound || null,
        game_time: penaltyData.isShootout ? gameTime : null,
        period: penaltyData.isShootout ? period : null,
        goal_id: null,
      });

      let goalEvent = null;

      // 5. If outcome is 'goal', create goal event
      if (penaltyData.outcome === "goal") {
        const goalEventResponse = await apiFetch("game_events_goals", "POST", {
          major_event_id: majorEvent.id,
          team_season_id: teamSeasonId,
          scorer_player_game_id: shooterPlayerGameId || null,
          opponent_jersey_number: penaltyData.opponentJerseyNumber || null,
          assist_player_game_id: null,
          defending_gk_player_game_id: gkPlayerGameId || null,
          is_own_goal: 0,
          goal_types: JSON.stringify(["penalty"]),
        });

        // Ensure the goal event has all the fields we need
        goalEvent = {
          ...goalEventResponse,
          id: goalEventResponse.id,
          goal_id: goalEventResponse.id,
          major_event_id: majorEvent.id,
          team_season_id: teamSeasonId,
          game_time: gameTime,
          period: period,
        };

        await apiFetch(`game_events_penalties?id=${penaltyEvent.id}`, "PUT", {
          goal_id: goalEvent.id,
        });
      }

      // 6. If outcome is 'saved', create save action for GK
      let saveAction = null;
      if (penaltyData.outcome === "saved" && gkPlayerGameId) {
        saveAction = await apiFetch("game_events_player_actions", "POST", {
          game_id: game.game_id,
          player_game_id: gkPlayerGameId,
          event_type: "save",
          game_time: gameTime,
          period: period,
        });
      }

      // 7. Optimistically update the game store
      gameStore.addPenaltyEvent(
        penaltyEvent,
        majorEvent,
        goalEvent,
        saveAction,
      );

      // 8. Trigger plus/minus recalculation if goal scored
      if (goalEvent) {
        playersStore.calculateAndUpdatePlusMinus(game.game_id);
      }

      set({ isRecording: false });
      return penaltyEvent;
    } catch (error) {
      console.error("Error recording penalty kick:", error);
      set({ isRecording: false });
      throw error;
    }
  },

  // ==================== RECORD PLAYER ACTION ====================

  // recordPlayerAction: async (actionData) => {
  //   const gameStore = useGameStore.getState();
  //   const game = gameStore.game;
  //   const gameTime = gameStore.getGameTime();
  //   const period = gameStore.getCurrentPeriodNumber();

  //   set({ isRecording: true });

  //   try {
  //     const actionEvent = await apiFetch("game_events_player_actions", "POST", {
  //       game_id: game.game_id,
  //       player_game_id: actionData.playerGameId,
  //       event_type: actionData.eventType,
  //       game_time: gameTime,
  //       period: period,
  //     });

  //     // Optimistically update the game store
  //     gameStore.addPlayerAction(actionEvent);

  //     set({ isRecording: false });
  //     return actionEvent;
  //   } catch (error) {
  //     console.error("Error recording player action:", error);
  //     set({ isRecording: false });
  //     throw error;
  //   }
  // },
  recordPlayerAction: async (actionData) => {
    const gameStore = useGameStore.getState();
    const playersStore = useGamePlayersStore.getState();
    const game = gameStore.game;
    const gameTime = gameStore.getGameTime();
    const period = gameStore.getCurrentPeriodNumber();

    const player = playersStore.getPlayerByPlayerGameId(
      actionData.playerGameId,
    );
    if (!player) {
      console.error("Player not found");
      return null;
    }

    // CREATE OPTIMISTIC ACTION
    const optimisticAction = {
      id: `temp_action_${Date.now()}_${Math.random()}`,
      game_id: game.game_id,
      player_game_id: actionData.playerGameId,
      event_type: actionData.eventType,
      game_time: gameTime,
      period: period,
      details: actionData.details || null,
    };

    // UPDATE UI IMMEDIATELY
    gameStore.addPlayerAction(optimisticAction);

    set({ isRecording: true });

    try {
      const serverAction = await apiFetch(
        "game_events_player_actions",
        "POST",
        {
          game_id: game.game_id,
          player_game_id: actionData.playerGameId,
          event_type: actionData.eventType,
          game_time: gameTime,
          period: period,
        },
      );

      // Replace optimistic with real
      gameStore.replacePlayerAction(optimisticAction.id, serverAction);

      set({ isRecording: false });
      return serverAction;
    } catch (error) {
      console.error("Error recording player action:", error);

      // ROLLBACK
      gameStore.removePlayerAction(optimisticAction.id);

      set({ isRecording: false });
      throw error;
    }
  },
  // ==================== RECORD TEAM EVENT ====================

  recordTeamEvent: async (teamEventData) => {
    const gameStore = useGameStore.getState();
    const game = gameStore.game;
    const gameTime = gameStore.getGameTime();
    const period = gameStore.getCurrentPeriodNumber();

    // Determine which team
    let teamSeasonId = teamEventData.teamSeasonId;

    if (!teamSeasonId) {
      if (teamEventData.forYourTeam) {
        teamSeasonId = game.isHome
          ? game.home_team_season_id
          : game.away_team_season_id;
      } else {
        teamSeasonId = game.isHome
          ? game.away_team_season_id
          : game.home_team_season_id;
      }
    }

    // Create optimistic event immediately
    const optimisticEvent = {
      id: `temp_${Date.now()}`, // Temporary ID
      game_id: game.game_id,
      team_season_id: teamSeasonId,
      event_type: teamEventData.eventType,
      game_time: gameTime,
      period: period,
    };

    // Optimistically update the game store immediately
    gameStore.addTeamEvent(optimisticEvent);

    set({ isRecording: true });

    try {
      const teamEvent = await apiFetch("game_events_team", "POST", {
        game_id: game.game_id,
        team_season_id: teamSeasonId,
        event_type: teamEventData.eventType,
        game_time: gameTime,
        period: period,
      });

      // Replace optimistic event with real one
      gameStore.replaceTeamEvent(optimisticEvent.id, teamEvent);

      set({ isRecording: false });
      return teamEvent;
    } catch (error) {
      console.error("Error recording team event:", error);
      // Remove optimistic event on error
      gameStore.removeTeamEvent(optimisticEvent.id);
      set({ isRecording: false });
      throw error;
    }
  },

  // ==================== DELETE EVENT ====================

  /**
   * Delete an event with cascade support for major events
   * @param {number} eventId - The event ID to delete
   * @param {string} eventType - Type: 'major', 'goal', 'discipline', 'penalty', 'player_action', 'team'
   * @param {boolean} cascade - If true and eventType is 'major', delete all child records first
   */
  deleteEvent: async (eventId, eventType = "major", cascade = false) => {
    const gameStore = useGameStore.getState();
    const playersStore = useGamePlayersStore.getState();
    const game = gameStore.game;

    try {
      // Handle cascade delete for major events
      if (eventType === "major" && cascade) {
        console.log(`Cascade deleting major event ${eventId}`);

        // Find all child records
        const childGoals = game.gameEventsGoals?.filter(
          (g) => g.major_event_id === eventId,
        );
        const childCards = game.gameEventsDiscipline?.filter(
          (d) => d.major_event_id === eventId,
        );
        const childPenalties = game.gameEventsPenalties?.filter(
          (p) => p.major_event_id === eventId,
        );

        // Delete goals first
        if (childGoals && childGoals.length > 0) {
          console.log(`Deleting ${childGoals.length} child goal(s)`);
          await Promise.all(
            childGoals.map((g) =>
              apiFetch(`game_events_goals?id=${g.goal_id}`, "DELETE"),
            ),
          );
        }

        // Delete cards
        if (childCards && childCards.length > 0) {
          console.log(`Deleting ${childCards.length} child card(s)`);
          await Promise.all(
            childCards.map((c) =>
              apiFetch(
                `game_events_discipline?id=${c.discipline_id}`,
                "DELETE",
              ),
            ),
          );
        }

        // Delete penalties
        if (childPenalties && childPenalties.length > 0) {
          console.log(`Deleting ${childPenalties.length} child penalty(ies)`);
          await Promise.all(
            childPenalties.map((p) =>
              apiFetch(`game_events_penalties?id=${p.penalty_id}`, "DELETE"),
            ),
          );
        }

        // Now delete the major event itself
        await apiFetch(`game_events_major?id=${eventId}`, "DELETE");

        // Update game store - remove major event and all children
        const updates = {
          gameEventsMajor: game.gameEventsMajor.filter((e) => e.id !== eventId),
        };

        if (childGoals && childGoals.length > 0) {
          updates.gameEventsGoals = game.gameEventsGoals.filter(
            (g) => g.major_event_id !== eventId,
          );
          // Recalculate scores
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
          // Use requestAnimationFrame to ensure state has propagated
          requestAnimationFrame(() => {
            console.log("Recalculating plus/minus after goal delete");
            playersStore.calculateAndUpdatePlusMinus(game.game_id);
          });
        }

        if (childCards && childCards.length > 0) {
          updates.gameEventsDiscipline = game.gameEventsDiscipline.filter(
            (d) => d.major_event_id !== eventId,
          );
        }

        if (childPenalties && childPenalties.length > 0) {
          updates.gameEventsPenalties = game.gameEventsPenalties.filter(
            (p) => p.major_event_id !== eventId,
          );
        }

        gameStore.updateGame(updates);

        console.log("Cascade delete complete");
        return true;
      }

      // Use gameStore's delete function for non-cascade deletes
      await gameStore.deleteEvent(eventId, eventType);

      return true;
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  },

  // ==================== CONVENIENCE RECORDING METHODS ====================

  recordShot: async (playerGameId, onTarget = false) => {
    return get().recordPlayerAction({
      playerGameId,
      eventType: onTarget ? "shot_on_target" : "shot",
    });
  },

  recordSave: async (playerGameId) => {
    return get().recordPlayerAction({
      playerGameId,
      eventType: "save",
    });
  },

  recordCorner: async (forYourTeam = true) => {
    return get().recordTeamEvent({
      eventType: "corner",
      forYourTeam,
    });
  },

  recordOffside: async (forYourTeam = true) => {
    return get().recordTeamEvent({
      eventType: "offside",
      forYourTeam,
    });
  },

  recordFoul: async (forYourTeam = true) => {
    return get().recordTeamEvent({
      eventType: "foul",
      forYourTeam,
    });
  },

  // ==================== QUERY HELPERS (using views) ====================

  getTeamStats: async (gameId, teamSeasonId) => {
    try {
      const [stats] = await apiFetch("v_team_game_stats", "GET", null, null, {
        filters: { game_id: gameId, team_season_id: teamSeasonId },
      });
      return stats;
    } catch (error) {
      console.error("Error fetching team stats:", error);
      return null;
    }
  },

  getPeriodStats: async (gameId, playerId) => {
    try {
      const stats = await apiFetch("v_player_period_stats", "GET", null, null, {
        filters: { game_id: gameId, player_id: playerId },
      });
      return stats;
    } catch (error) {
      console.error("Error fetching period stats:", error);
      return [];
    }
  },

  getPlayerSeasonStats: async (teamSeasonId, playerId) => {
    try {
      const [stats] = await apiFetch(
        "v_player_season_stats_calculated",
        "GET",
        null,
        null,
        { filters: { team_season_id: teamSeasonId, player_id: playerId } },
      );
      return stats;
    } catch (error) {
      console.error("Error fetching season stats:", error);
      return null;
    }
  },

  getPlayerCareerStats: async (playerId) => {
    try {
      const [stats] = await apiFetch(
        "v_player_career_stats",
        "GET",
        null,
        null,
        { filters: { player_id: playerId } },
      );
      return stats;
    } catch (error) {
      console.error("Error fetching career stats:", error);
      return null;
    }
  },
}));

export default useGameEventsStore;
