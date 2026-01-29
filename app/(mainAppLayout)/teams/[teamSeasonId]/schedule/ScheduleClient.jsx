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

  const handleAddGame = () => {
    setEditingGame(null);
    setIsModalOpen(true);
  };

  const handleEditGame = (game) => {
    setEditingGame(game);
    setIsModalOpen(true);
  };

  const handleDeleteGame = async (gameId) => {
    if (!confirm("Are you sure you want to delete this game?")) return;

    try {
      await deleteGame(gameId);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Error deleting game");
    }
  };

  const handleSaveGame = async (gameData) => {
    try {
      if (editingGame) {
        const gameId = editingGame.id || editingGame.game_id;
        await updateGame(gameId, gameData);
      } else {
        await addGame(gameData);
      }

      setIsModalOpen(false);
      setEditingGame(null);
    } catch (error) {
      console.error("Save failed:", error);
      alert("Error saving game");
    }
  };

  // Transform games data for display
  const gamesData = games.map((game) => {
    const isHome = game.home_team_season_id
      ? game.home_team_season_id === parseInt(teamSeasonId)
      : game.home_away === "home";

    const opponent = isHome ? game.away_team_name : game.home_team_name;
    const opponentClub = isHome ? game.away_club_name : game.home_club_name;

    const gameDate = game.start_date || game.game_date;
    const gameTime = game.start_time || game.game_time;
    const location = game.location_name || game.location;
    const sublocation = game.sublocation_name;

    // Check if game has been played and has scores
    const hasScore = game.status === "completed";

    const scoreUs = hasScore
      ? isHome
        ? game.home_score
        : game.away_score
      : null;
    const scoreThem = hasScore
      ? isHome
        ? game.away_score
        : game.home_score
      : null;

    const result = hasScore
      ? scoreUs > scoreThem
        ? "W"
        : scoreUs < scoreThem
          ? "L"
          : "D"
      : null;

    // Status display helper
    const statusDisplay =
      game.status === "completed"
        ? "Final"
        : game.status === "in_progress"
          ? "Live"
          : game.status === "postponed"
            ? "Postponed"
            : game.status === "cancelled"
              ? "Cancelled"
              : "Scheduled";

    return {
      id: game.id || game.game_id,
      date: gameDate,
      time: gameTime,
      timezone: game.timezone_label || "CST",
      homeAway: isHome ? "HOME" : "AWAY",
      opponent:
        opponentClub !== opponent
          ? `${opponentClub} (${opponent})`
          : opponentClub,
      opponentClub,
      location: location || "-",
      sublocation: sublocation || "",
      league: game.league_names || "Friendly",
      scoreUs: hasScore ? (scoreUs ?? 0) : "-",
      scoreThem: hasScore ? (scoreThem ?? 0) : "-",
      result: result || "-",
      status: game.status,
      statusDisplay,
      isHome,
      hasScore,
      rawGame: game,
    };
  });

  return (
    <>
      <ViewWrapper
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
        {canEdit && (
          <Button variant='primary' onClick={handleAddGame}>
            + Add Game
          </Button>
        )}
      </ViewWrapper>

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
