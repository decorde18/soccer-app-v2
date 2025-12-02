import { useState } from "react";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameSubsStore from "@/stores/gameSubsStore";

export function useSubManagement() {
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [triggerPlayer, setTriggerPlayer] = useState(null);
  const [subMode, setSubMode] = useState(null); // 'selectIn' or 'selectOut'

  const players = useGamePlayersStore((s) => s.players);
  const getPendingSubsSync = useGameSubsStore((s) => s.getPendingSubsSync);
  const cancelSub = useGameSubsStore((s) => s.cancelSub);

  const handleSubClick = async (playerId) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    const pendingSubs = getPendingSubsSync();

    // Check if player has a pending sub
    const playerPendingIn = pendingSubs.find(
      (s) => s.inPlayerId === player.playerGameId
    );
    const playerPendingOut = pendingSubs.find(
      (s) => s.outPlayerId === player.playerGameId
    );

    // If player has pending sub, cancel it
    if (player.fieldStatus === "subbingIn" && playerPendingIn) {
      await cancelSub(playerPendingIn.subId);
      return;
    }

    if (
      (player.fieldStatus === "subbingOut" ||
        player.fieldStatus === "subbingOutGk") &&
      playerPendingOut
    ) {
      await cancelSub(playerPendingOut.subId);
      return;
    }

    // Otherwise, open modal to create new sub
    if (player.fieldStatus === "onBench") {
      // Bench player - select who they're subbing in for
      setTriggerPlayer(player);
      setSubMode("selectOut");
      setSubModalOpen(true);
    } else if (
      player.fieldStatus === "onField" ||
      player.fieldStatus === "onFieldGk"
    ) {
      // Field player - select who's subbing in for them
      setTriggerPlayer(player);
      setSubMode("selectIn");
      setSubModalOpen(true);
    }
  };

  const closeSubModal = () => {
    setSubModalOpen(false);
    setTriggerPlayer(null);
    setSubMode(null);
  };

  return {
    subModalOpen,
    triggerPlayer,
    subMode,
    handleSubClick,
    closeSubModal,
  };
}
