"use client";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameSubsStore from "@/stores/gameSubsStore";
import useGameStore from "@/stores/gameStore";
import { useMemo, useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Dialog from "@/components/ui/Dialog";

function PendingSubs({ hideIndividualEnter = false }) {
  const allPlayers = useGamePlayersStore((s) => s.players);
  const game = useGameStore((s) => s.game);

  const getPendingSubs = useGameSubsStore((s) => s.getPendingSubs);
  const confirmSub = useGameSubsStore((s) => s.confirmSub);
  const confirmAllPendingSubs = useGameSubsStore(
    (s) => s.confirmAllPendingSubs
  );
  const cancelSub = useGameSubsStore((s) => s.cancelSub);
  const updatePendingSub = useGameSubsStore((s) => s.updatePendingSub);

  const [editingSubId, setEditingSubId] = useState(null);
  const [editingInPlayer, setEditingInPlayer] = useState("");
  const [editingOutPlayer, setEditingOutPlayer] = useState("");
  const [confirmError, setConfirmError] = useState(null);
  const [pendingSubs, setPendingSubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: "confirm",
    title: "",
    message: "",
    onConfirm: null,
  });

  // Fetch pending subs on mount and when players change
  useEffect(() => {
    const fetchPendingSubs = async () => {
      if (!game?.game_id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const subs = await getPendingSubs();
      setPendingSubs(subs || []);
      setIsLoading(false);
    };

    fetchPendingSubs();
  }, [allPlayers, getPendingSubs, game?.game_id]);

  const players = allPlayers.filter((p) =>
    ["dressed", "starter", "goalkeeper"].includes(p.gameStatus)
  );

  const subsWithPlayerInfo = useMemo(() => {
    return pendingSubs.map((sub) => {
      const inPlayer = sub.inPlayerId
        ? players.find((p) => p.playerGameId === sub.inPlayerId)
        : null;
      const outPlayer = sub.outPlayerId
        ? players.find((p) => p.playerGameId === sub.outPlayerId)
        : null;

      return {
        ...sub,
        inPlayer,
        outPlayer,
        inPlayerName: inPlayer
          ? `#${inPlayer.jerseyNumber} ${inPlayer.fullName}`
          : null,
        outPlayerName: outPlayer
          ? `#${outPlayer.jerseyNumber} ${outPlayer.fullName}`
          : null,
        isGkSub:
          sub.gkSub ||
          inPlayer?.gameStatus === "goalkeeper" ||
          outPlayer?.gameStatus === "goalkeeper",
      };
    });
  }, [pendingSubs, players]);

  // Get available players for dropdowns
  const getAvailableBenchPlayers = (currentSubId) => {
    const currentSub = pendingSubs.find((s) => s.subId === currentSubId);
    const pendingInPlayerIds = new Set(
      pendingSubs
        .filter((s) => s.inPlayerId && s.subId !== currentSubId)
        .map((s) => s.inPlayerId)
    );

    return players
      .filter((p) => {
        if (
          currentSub?.inPlayerId &&
          p.playerGameId === currentSub.inPlayerId
        ) {
          return true;
        }
        if (p.fieldStatus !== "onBench") return false;
        if (pendingInPlayerIds.has(p.playerGameId)) return false;
        return true;
      })
      .map((p) => ({
        value: p.playerGameId,
        label: `#${p.jerseyNumber} ${p.fullName}`,
      }));
  };

  const getAvailableFieldPlayers = (currentSubId) => {
    const currentSub = pendingSubs.find((s) => s.subId === currentSubId);
    const pendingOutPlayerIds = new Set(
      pendingSubs
        .filter((s) => s.outPlayerId && s.subId !== currentSubId)
        .map((s) => s.outPlayerId)
    );

    return players
      .filter((p) => {
        if (
          currentSub?.outPlayerId &&
          p.playerGameId === currentSub.outPlayerId
        ) {
          return true;
        }
        if (p.fieldStatus !== "onField" && p.fieldStatus !== "onFieldGk")
          return false;
        if (pendingOutPlayerIds.has(p.playerGameId)) return false;
        return true;
      })
      .map((p) => ({
        value: p.playerGameId,
        label: `#${p.jerseyNumber} ${p.fullName}`,
      }));
  };

  const refreshPendingSubs = async () => {
    const subs = await getPendingSubs();
    setPendingSubs(subs || []);
  };

  const handleStartEdit = (sub) => {
    setEditingSubId(sub.subId);
    setEditingInPlayer(sub.inPlayerId?.toString() || "");
    setEditingOutPlayer(sub.outPlayerId?.toString() || "");
  };

  const handleSaveEdit = async () => {
    if (!game?.game_id) return;

    const updates = {};
    if (editingInPlayer) updates.in_player_id = parseInt(editingInPlayer);
    if (editingOutPlayer) updates.out_player_id = parseInt(editingOutPlayer);

    await updatePendingSub(editingSubId, updates);
    await refreshPendingSubs();

    setEditingSubId(null);
    setEditingInPlayer("");
    setEditingOutPlayer("");
  };

  const handleCancelEdit = () => {
    setEditingSubId(null);
    setEditingInPlayer("");
    setEditingOutPlayer("");
  };

  const validateAndConfirmSub = async (sub) => {
    // Validation logic
    if (sub.outPlayerId && !sub.inPlayerId) {
      const player = players.find((p) => p.playerGameId === sub.outPlayerId);
      const playerName = player
        ? `#${player.jerseyNumber} ${player.fullName}`
        : "Unknown";

      return new Promise((resolve) => {
        setDialog({
          isOpen: true,
          type: "warning",
          title: "Incomplete Substitution",
          message: `Player coming out without replacement:\n${playerName}\n\nConfirm this substitution?`,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
    }

    if (sub.inPlayerId && !sub.outPlayerId) {
      const currentFieldCount = players.filter(
        (p) =>
          p.fieldStatus === "onField" ||
          p.fieldStatus === "subbingIn" ||
          p.fieldStatus === "onFieldGk"
      ).length;

      if (currentFieldCount >= +game.settings.playersOnField) {
        setDialog({
          isOpen: true,
          type: "error",
          title: "Maximum Players Reached",
          message:
            "You already have the maximum number of players on the field.",
          showCancel: false,
          onConfirm: () => {},
        });
        return false;
      }

      const player = players.find((p) => p.playerGameId === sub.inPlayerId);
      const playerName = player
        ? `#${player.jerseyNumber} ${player.fullName}`
        : "Unknown";

      return new Promise((resolve) => {
        setDialog({
          isOpen: true,
          type: "warning",
          title: "Incomplete Substitution",
          message: `Player coming in without replacement:\n${playerName}\n\nConfirm this substitution?`,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
    }

    return true;
  };

  const handleConfirmSingle = async (subId) => {
    if (!game?.game_id) return;

    const sub = pendingSubs.find((s) => s.subId === subId);
    if (!sub) return;

    if (!sub.isComplete) {
      const shouldProceed = await validateAndConfirmSub(sub);
      if (!shouldProceed) return;
    }

    await confirmSub(subId);
    await refreshPendingSubs();
  };

  const handleConfirmAll = async () => {
    if (!game?.game_id) return;

    setConfirmError(null);

    // Process ALL subs immediately, one at a time
    // Complete subs confirm without dialog, incomplete show validation dialog
    for (const sub of pendingSubs) {
      console.log(sub);
      if (!sub.isComplete) {
        // Show validation dialog for incomplete sub
        const shouldProceed = await validateAndConfirmSub(sub);
        if (shouldProceed) {
          await confirmSub(sub.subId);
        }
      } else {
        // Complete subs confirm immediately without dialog
        await confirmSub(sub.subId);
      }
    }

    await refreshPendingSubs();
  };

  const handleCancelSub = async (subId) => {
    if (!game?.game_id) return;

    await cancelSub(subId);
    await refreshPendingSubs();
  };

  const closeDialog = () => {
    setDialog({ ...dialog, isOpen: false });
  };

  if (!game?.game_id) {
    return <div className='text-center text-muted py-4'>No active game</div>;
  }

  if (isLoading) {
    return <div className='text-center text-muted py-4'>Loading...</div>;
  }

  if (subsWithPlayerInfo.length === 0) {
    return <div className='text-center text-muted py-4'>No pending subs</div>;
  }

  const completeSubs = subsWithPlayerInfo.filter((s) => s.isComplete);
  const incompleteSubs = subsWithPlayerInfo.filter((s) => !s.isComplete);

  return (
    <div className='w-full max-w-full overflow-hidden'>
      {/* Dialog Component */}
      <Dialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.type === "error" ? "OK" : "Confirm"}
        showCancel={dialog.type !== "alert" && dialog.type !== "error"}
        onConfirm={() => {
          if (dialog.onConfirm) {
            dialog.onConfirm();
          }
          closeDialog();
        }}
      />

      {/* Header with Enter All Button */}
      {(completeSubs.length > 0 || incompleteSubs.length > 0) && (
        <div className='mb-3 pb-3 border-b border-border'>
          <div className='flex items-center justify-between gap-2 mb-2'>
            <div className='text-xs text-muted'>
              {completeSubs.length} ready
              {incompleteSubs.length > 0 &&
                `, ${incompleteSubs.length} incomplete`}
            </div>
            <Button onClick={handleConfirmAll} variant='success' size='sm'>
              Enter All
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {confirmError && (
        <div className='mb-3 p-2 bg-warningbg border border-warningborder text-warningtext rounded text-xs'>
          {confirmError}
        </div>
      )}

      {/* Substitutions List */}
      <div className='space-y-2 max-h-[400px] overflow-y-auto pr-1'>
        {subsWithPlayerInfo.map((sub) => {
          const isEditing = editingSubId === sub.subId;
          const availableBenchPlayers = isEditing
            ? getAvailableBenchPlayers(sub.subId)
            : [];
          const availableFieldPlayers = isEditing
            ? getAvailableFieldPlayers(sub.subId)
            : [];

          return (
            <div
              key={sub.subId}
              className={`p-2 rounded-lg border ${
                sub.isComplete
                  ? "bg-surface border-border"
                  : "bg-warningbg border-warningborder"
              }`}
            >
              {/* Player Info */}
              <div className='space-y-1 mb-2'>
                {/* IN Player */}
                <div className='flex items-center gap-1.5'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-3 w-3 text-success flex-shrink-0'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span className='text-xs text-text-label font-medium uppercase flex-shrink-0'>
                    In:
                  </span>
                  {isEditing ? (
                    <Select
                      value={editingInPlayer}
                      onChange={(e) => setEditingInPlayer(e.target.value)}
                      options={availableBenchPlayers}
                      placeholder='Select Player In'
                      className='text-xs flex-1 min-w-0'
                    />
                  ) : (
                    <div className='text-xs font-medium text-text truncate flex-1 min-w-0'>
                      {sub.inPlayerName || (
                        <span className='text-muted italic'>Not selected</span>
                      )}
                    </div>
                  )}
                  {sub.isGkSub && (
                    <span className='px-1 py-0.5 bg-primary text-white text-xs rounded flex-shrink-0'>
                      GK
                    </span>
                  )}
                </div>

                {/* OUT Player */}
                <div className='flex items-center gap-1.5'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-3 w-3 text-danger flex-shrink-0'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span className='text-xs text-text-label font-medium uppercase flex-shrink-0'>
                    Out:
                  </span>
                  {isEditing ? (
                    <Select
                      value={editingOutPlayer}
                      onChange={(e) => setEditingOutPlayer(e.target.value)}
                      options={availableFieldPlayers}
                      placeholder='Select Player Out'
                      className='text-xs flex-1 min-w-0'
                    />
                  ) : (
                    <div className='text-xs font-medium text-text truncate flex-1 min-w-0'>
                      {sub.outPlayerName || (
                        <span className='text-muted italic'>Not selected</span>
                      )}
                    </div>
                  )}
                  {!sub.isComplete && (
                    <span className='px-1 py-0.5 bg-accent text-white text-xs rounded flex-shrink-0'>
                      !
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-2 flex-wrap'>
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSaveEdit}
                      variant='success'
                      size='sm'
                      className='flex-1'
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant='outline'
                      size='sm'
                      className='flex-1'
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => handleStartEdit(sub)}
                      variant='outline'
                      size='sm'
                      className='flex-1'
                    >
                      Edit
                    </Button>
                    {!hideIndividualEnter && (
                      <Button
                        onClick={() => handleConfirmSingle(sub.subId)}
                        variant='success'
                        size='sm'
                        className='flex-1'
                      >
                        Enter
                      </Button>
                    )}
                    <Button
                      onClick={() => handleCancelSub(sub.subId)}
                      variant='danger'
                      size='sm'
                      className='flex-1'
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PendingSubs;
