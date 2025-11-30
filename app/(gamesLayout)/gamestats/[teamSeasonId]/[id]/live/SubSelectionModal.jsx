"use client";
import { useState, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import useGamePlayersStore from "@/stores/gamePlayersStore";

function SubSelectionModal({ isOpen = true, onClose, triggerPlayer, mode }) {
  const players = useGamePlayersStore((s) => s.players);
  const createPendingSub = useGamePlayersStore((s) => s.createPendingSub);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [createWithoutPair, setCreateWithoutPair] = useState(false);

  // Get available players based on mode
  const availablePlayers = useMemo(() => {
    if (mode === "selectIn") {
      // Show bench players for subbing in
      return players
        .filter((p) => p.fieldStatus === "onBench")
        .map((p) => ({
          value: p.playerGameId,
          label: `#${p.jerseyNumber} ${p.fullName}`,
        }));
    } else {
      // Show on-field players for subbing out
      return players
        .filter(
          (p) => p.fieldStatus === "onField" || p.fieldStatus === "onFieldGk"
        )
        .map((p) => ({
          value: p.playerGameId,
          label: `#${p.jerseyNumber} ${p.fullName}`,
        }));
    }
  }, [players, mode]);

  const handleCreateSub = async () => {
    if (!triggerPlayer) return;

    const isGkSub =
      triggerPlayer.gameStatus === "goalkeeper" ||
      (selectedPlayerId &&
        players.find((p) => p.playerGameId === parseInt(selectedPlayerId))
          ?.gameStatus === "goalkeeper");

    if (mode === "selectIn") {
      // triggerPlayer is coming OUT, selectedPlayer is going IN
      const inPlayerId = selectedPlayerId ? parseInt(selectedPlayerId) : null;
      await createPendingSub(inPlayerId, triggerPlayer.playerGameId, isGkSub);
    } else {
      // triggerPlayer is going IN, selectedPlayer is coming OUT
      const outPlayerId = selectedPlayerId ? parseInt(selectedPlayerId) : null;
      await createPendingSub(triggerPlayer.playerGameId, outPlayerId, isGkSub);
    }

    setSelectedPlayerId("");
    setCreateWithoutPair(false);
    onClose();
  };

  const handleCreatePartialSub = async () => {
    if (!triggerPlayer) return;

    const isGkSub = triggerPlayer.gameStatus === "goalkeeper";

    if (mode === "selectIn") {
      // Creating OUT without IN
      await createPendingSub(null, triggerPlayer.playerGameId, isGkSub);
    } else {
      // Creating IN without OUT
      await createPendingSub(triggerPlayer.playerGameId, null, isGkSub);
    }

    setSelectedPlayerId("");
    setCreateWithoutPair(false);
    onClose();
  };

  if (!triggerPlayer) return null;

  const title =
    mode === "selectIn"
      ? `Select Player to Sub IN for #${triggerPlayer.jerseyNumber} ${triggerPlayer.fullName}`
      : `Select Player to Sub OUT for #${triggerPlayer.jerseyNumber} ${triggerPlayer.fullName}`;

  const canCreatePartial = !selectedPlayerId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size='md'
      footer={
        <>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          {canCreatePartial && (
            <Button variant='outline' onClick={handleCreatePartialSub}>
              Add Without {mode === "selectIn" ? "Replacement" : "Selection"}
            </Button>
          )}
          <Button
            variant='primary'
            onClick={handleCreateSub}
            disabled={!selectedPlayerId}
          >
            Create Substitution
          </Button>
        </>
      }
    >
      <div className='space-y-4'>
        <div className='bg-background p-4 rounded-lg border border-border'>
          <div className='text-sm text-muted mb-2'>
            {mode === "selectIn" ? "Coming OUT" : "Going IN"}
          </div>
          <div className='text-lg font-semibold text-text'>
            #{triggerPlayer.jerseyNumber} {triggerPlayer.fullName}
          </div>
          {triggerPlayer.gameStatus === "goalkeeper" && (
            <span className='inline-block mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded'>
              GOALKEEPER
            </span>
          )}
        </div>

        <Select
          label={
            mode === "selectIn"
              ? "Select player to sub IN (optional)"
              : "Select player to sub OUT (optional)"
          }
          value={selectedPlayerId}
          onChange={(e) => setSelectedPlayerId(e.target.value)}
          options={[
            { value: "", label: "Choose a player..." },
            ...availablePlayers,
          ]}
        />

        <div className='text-sm text-muted'>
          You can create this substitution now and select the{" "}
          {mode === "selectIn" ? "replacement" : "player to remove"} later in
          Pending Subs.
        </div>

        {availablePlayers.length === 0 && (
          <div className='text-center text-yellow-600 py-4 bg-yellow-50 rounded border border-yellow-200'>
            No available players for substitution
          </div>
        )}
      </div>
    </Modal>
  );
}

export default SubSelectionModal;
