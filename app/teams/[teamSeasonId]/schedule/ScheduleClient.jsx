"use client";

import { useState } from "react";
import ViewWrapper from "@/components/ui/ViewWrapper";
import ScheduleGrid from "@/components/ui/schedule/ScheduleGrid";
import ScheduleTable from "@/components/ui/schedule/ScheduleTable";
import Button from "@/components/ui/Button";
import GameModal from "./GameModal";
import { useTeamSeasonGames } from "@/hooks/useTeamSeasonGames";

export default function ScheduleClient({ teamSeasonId, canEdit }) {
  const { games, loading, error, setGames } = useTeamSeasonGames(teamSeasonId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);

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
      const res = await fetch(`/api/games/${gameId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Optimistically update UI
        setGames((prev) => prev.filter((g) => (g.id || g.game_id) !== gameId));
      } else {
        alert("Failed to delete game");
      }
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
        const res = await fetch(`/api/games/${gameId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gameData),
        });

        if (res.ok) {
          const updatedGame = await res.json();
          setGames((prev) =>
            prev.map((g) =>
              (g.id || g.game_id) === gameId ? { ...g, ...updatedGame } : g
            )
          );
        } else {
          alert("Failed to update game");
          return;
        }
      } else {
        // Create new game
        const res = await fetch(`/api/teams/${teamSeasonId}/games`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gameData),
        });

        if (res.ok) {
          const newGame = await res.json();
          setGames((prev) => [...prev, newGame]);
        } else {
          alert("Failed to add game");
          return;
        }
      }

      // Close modal on success
      setIsModalOpen(false);
      setEditingGame(null);
    } catch (error) {
      console.error("Save failed:", error);
      alert("Error saving game");
    }
  };

  return (
    <>
      <ViewWrapper
        title='Schedule'
        defaultView='grid'
        loading={loading}
        error={error}
        gridView={
          <ScheduleGrid
            games={games}
            teamSeasonId={teamSeasonId}
            showActions={canEdit}
            onEdit={handleEditGame}
            onDelete={handleDeleteGame}
          />
        }
        tableView={
          <ScheduleTable
            games={games}
            teamSeasonId={teamSeasonId}
            showActions={canEdit}
            onEdit={handleEditGame}
            onDelete={handleDeleteGame}
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
        />
      )}
    </>
  );
}
