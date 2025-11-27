"use client";

import { useState } from "react";
import ViewWrapper from "@/components/ui/ViewWrapper";
import ScheduleGrid from "@/components/ui/schedule/ScheduleGrid";
import ScheduleTable from "@/components/ui/schedule/ScheduleTable";
import Button from "@/components/ui/Button";
import GameModal from "./GameModal";
import { useTeamSeasonGames } from "@/hooks/useTeamSeasonGames";

export default function ScheduleClient({ teamSeasonId, canEdit }) {
  const { games, loading, error, updateGame, deleteGame, addGame } =
    useTeamSeasonGames(teamSeasonId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);

  const handleEnterGameStats = (game) => {
    window.open(`/gamestats/${teamSeasonId}/${game.game_id}`);
  };
  // Add new game
  const handleAddGame = () => {
    setEditingGame(null);
    setIsModalOpen(true);
  };

  // Edit existing game
  const handleEditGame = (game) => {
    setEditingGame(game);
    setIsModalOpen(true);
  };

  // Delete game
  const handleDeleteGame = async (gameId) => {
    if (!confirm("Are you sure you want to delete this game?")) return;

    try {
      await deleteGame(gameId);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Error deleting game");
    }
  };

  // Save game (create or update)
  const handleSaveGame = async (gameData) => {
    try {
      if (editingGame) {
        // Update existing game
        const gameId = editingGame.id || editingGame.game_id;
        await updateGame(gameId, gameData);
      } else {
        // Create new game
        await addGame(gameData);
      }

      // Close modal on success
      setIsModalOpen(false);
      setEditingGame(null);
    } catch (error) {
      console.error("Save failed:", error);
      alert("Error saving game");
    }
  };

  // Transform games data for display
  const gamesData = games.map((game) => {
    // Handle both data structures (API view vs direct DB)
    const isHome = game.home_team_season_id
      ? game.home_team_season_id === parseInt(teamSeasonId)
      : game.home_away === "home";

    const opponent = isHome ? game.away_team_name : game.home_team_name;
    const opponentClub = isHome ? game.away_club_name : game.home_club_name;

    // Score logic
    const scoreUs = isHome ? game.home_score : game.away_score;
    const scoreThem = isHome ? game.away_score : game.home_score;

    const gameDate = game.start_date || game.game_date;
    const gameTime = game.start_time || game.game_time;
    const location = game.location_name || game.location;
    const sublocation = game.sublocation_name;

    const hasScore =
      scoreUs !== undefined &&
      scoreThem !== undefined &&
      scoreUs !== null &&
      scoreThem !== null;

    const result = hasScore
      ? scoreUs > scoreThem
        ? "W"
        : scoreUs < scoreThem
        ? "L"
        : "D"
      : "-";

    return {
      id: game.id || game.game_id,
      date: gameDate,
      time: gameTime,
      timezone: game.timezone_label,
      homeAway: isHome ? "HOME" : "AWAY",
      opponent:
        opponentClub !== opponent
          ? `${opponentClub} (${opponent})`
          : opponentClub,
      opponentClub,
      location: location || "-",
      sublocation: sublocation || "",
      league: game.league_names || "-",
      scoreUs: scoreUs ?? "-",
      scoreThem: scoreThem ?? "-",
      result,
      status: game.status,
      isHome,
      hasScore,
      rawGame: game, // Keep original for edit
    };
  });

  return (
    <>
      <ViewWrapper
        title='Schedule'
        defaultView='grid'
        loading={loading}
        error={error}
        gridView={
          <ScheduleGrid
            games={gamesData}
            teamSeasonId={teamSeasonId}
            showActions={canEdit}
            onEdit={handleEditGame}
            onDelete={handleDeleteGame}
            onSelect={handleEnterGameStats}
          />
        }
        tableView={
          <ScheduleTable
            games={gamesData}
            teamSeasonId={teamSeasonId}
            showActions={canEdit}
            onEdit={handleEditGame}
            onDelete={handleDeleteGame}
            onSelect={handleEnterGameStats}
          />
        }
      >
        {/* Only show Add button if user can edit */}
        {canEdit && (
          <Button variant='primary' onClick={handleAddGame}>
            + Add Game
          </Button>
        )}
      </ViewWrapper>

      {/* Only render modal if user can edit */}
      {canEdit && (
        <GameModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingGame(null);
          }}
          onSave={handleSaveGame}
          game={editingGame}
          teamSeasonId={teamSeasonId}
        />
      )}
    </>
  );
}
