// app/teams/[teamSeasonId]/roster/RosterClient.jsx
"use client";

import { useState } from "react";
import ViewWrapper from "@/components/ui/ViewWrapper";
import RosterGrid from "@/components/ui/roster/RosterGrid";
import RosterTable from "@/components/ui/roster/RosterTable";
import Button from "@/components/ui/Button";
import PlayerModal from "./PlayerModal";
import { useApiData } from "@/hooks/useApiData";

export default function RosterClient({ teamSeasonId, canEdit }) {
  const {
    data: players,
    loading,
    error,
    setData: setPlayers,
    create,
    update,
    remove,
  } = useApiData("players_view", {
    filters: { team_season_id: teamSeasonId },
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  // Add new player
  const handleAddPlayer = () => {
    setEditingPlayer(null);
    setIsModalOpen(true);
  };

  // Edit existing player
  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    setIsModalOpen(true);
  };

  // Delete player
  const handleDeletePlayer = async (playerId) => {
    if (
      !confirm("Are you sure you want to remove this player from the roster?")
    )
      return;

    try {
      await remove(playerId);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Error deleting player");
    }
  };

  // Save player (create or update)
  const handleSavePlayer = async (playerData) => {
    try {
      if (editingPlayer) {
        // Update existing player
        const playerId = editingPlayer.id || editingPlayer.player_id;
        await update(playerId, playerData);
      } else {
        // Create new player
        await create(playerData);
      }

      // Close modal on success
      setIsModalOpen(false);
      setEditingPlayer(null);
    } catch (error) {
      console.error("Save failed:", error);
      alert("Error saving player");
    }
  };

  return (
    <>
      <ViewWrapper
        title='Roster'
        defaultView='table'
        loading={loading}
        error={error}
        gridView={
          <RosterGrid
            players={players}
            teamSeasonId={teamSeasonId}
            showActions={canEdit}
            onEdit={handleEditPlayer}
            onDelete={handleDeletePlayer}
          />
        }
        tableView={
          <RosterTable
            players={players}
            teamSeasonId={teamSeasonId}
            showActions={canEdit}
            onEdit={handleEditPlayer}
            onDelete={handleDeletePlayer}
          />
        }
      >
        {/* Only show buttons if user can edit */}
        {canEdit && (
          <div className='flex gap-2'>
            <Button
              variant='secondary'
              href={`/teams/${teamSeasonId}/roster/upload`}
            >
              Upload Roster
            </Button>
            <Button variant='primary' onClick={handleAddPlayer}>
              + Add Player
            </Button>
          </div>
        )}
      </ViewWrapper>

      {/* Only render modal if user can edit */}
      {canEdit && (
        <PlayerModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPlayer(null);
          }}
          onSave={handleSavePlayer}
          player={editingPlayer}
        />
      )}
    </>
  );
}
