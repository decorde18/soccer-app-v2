"use client";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import { useMemo, useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";

function PendingSubs() {
  const players = useGamePlayersStore((s) => s.players);
  const getPendingSubs = useGamePlayersStore((s) => s.getPendingSubs);
  const confirmSub = useGamePlayersStore((s) => s.confirmSub);
  const confirmAllPendingSubs = useGamePlayersStore(
    (s) => s.confirmAllPendingSubs
  );
  const cancelSub = useGamePlayersStore((s) => s.cancelSub);
  const updatePendingSub = useGamePlayersStore((s) => s.updatePendingSub);

  const [editingSubId, setEditingSubId] = useState(null);
  const [editingInPlayer, setEditingInPlayer] = useState("");
  const [editingOutPlayer, setEditingOutPlayer] = useState("");
  const [confirmError, setConfirmError] = useState(null);
  const [pendingSubs, setPendingSubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch pending subs on mount and when players change
  useEffect(() => {
    const fetchPendingSubs = async () => {
      setIsLoading(true);
      const subs = await getPendingSubs();
      setPendingSubs(subs);
      setIsLoading(false);
    };
    fetchPendingSubs();
  }, [players, getPendingSubs]);

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
  const availableBenchPlayers = useMemo(() => {
    const pendingInPlayerIds = new Set(
      pendingSubs.filter((s) => s.inPlayerId).map((s) => s.inPlayerId)
    );

    return players
      .filter((p) => {
        if (p.fieldStatus !== "onBench") return false;
        if (pendingInPlayerIds.has(p.playerGameId)) return false;
        return true;
      })
      .map((p) => ({
        value: p.playerGameId,
        label: `#${p.jerseyNumber} ${p.fullName}`,
      }));
  }, [players, pendingSubs]);

  const availableFieldPlayers = useMemo(() => {
    const pendingOutPlayerIds = new Set(
      pendingSubs.filter((s) => s.outPlayerId).map((s) => s.outPlayerId)
    );

    return players
      .filter((p) => {
        if (p.fieldStatus !== "onField" && p.fieldStatus !== "onFieldGk")
          return false;
        if (pendingOutPlayerIds.has(p.playerGameId)) return false;
        return true;
      })
      .map((p) => ({
        value: p.playerGameId,
        label: `#${p.jerseyNumber} ${p.fullName}`,
      }));
  }, [players, pendingSubs]);

  const handleStartEdit = (sub) => {
    setEditingSubId(sub.subId);
    setEditingInPlayer(sub.inPlayerId?.toString() || "");
    setEditingOutPlayer(sub.outPlayerId?.toString() || "");
  };

  const handleSaveEdit = async () => {
    const updates = {};
    if (editingInPlayer) updates.in_player_id = parseInt(editingInPlayer);
    if (editingOutPlayer) updates.out_player_id = parseInt(editingOutPlayer);

    await updatePendingSub(editingSubId, updates);

    const subs = await getPendingSubs();
    setPendingSubs(subs);

    setEditingSubId(null);
    setEditingInPlayer("");
    setEditingOutPlayer("");
  };

  const handleCancelEdit = () => {
    setEditingSubId(null);
    setEditingInPlayer("");
    setEditingOutPlayer("");
  };

  const handleConfirmAll = async () => {
    setConfirmError(null);
    const result = await confirmAllPendingSubs();

    if (result.errors && result.errors.length > 0) {
      setConfirmError(result.errors.join("; "));
    } else if (result.confirmed > 0) {
      console.log(`Confirmed ${result.confirmed} substitutions`);
    } else if (result.pending) {
      setConfirmError(
        `${result.pending} subs will be confirmed at start of next period`
      );
    }

    const subs = await getPendingSubs();
    setPendingSubs(subs);
  };

  const handleConfirmSingle = async (subId) => {
    await confirmSub(subId);
    const subs = await getPendingSubs();
    setPendingSubs(subs);
  };

  const handleCancelSub = async (subId) => {
    await cancelSub(subId);
    const subs = await getPendingSubs();
    setPendingSubs(subs);
  };

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
      {/* Header with Enter All Button */}
      {completeSubs.length > 0 && (
        <div className='mb-3 pb-3 border-b border-border'>
          <div className='flex items-center justify-between gap-2 mb-2'>
            <div className='text-xs text-muted'>
              {completeSubs.length} ready
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

      {/* Substitutions List - Max height with scroll */}
      <div className='space-y-2 max-h-[400px] overflow-y-auto pr-1'>
        {subsWithPlayerInfo.map((sub) => {
          const isEditing = editingSubId === sub.subId;

          return (
            <div
              key={sub.subId}
              className={`p-2 rounded-lg border ${
                sub.isComplete
                  ? "bg-surface border-border"
                  : "bg-warningbg border-warningborder"
              }`}
            >
              {/* Player Info - Compact Layout */}
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
                      options={[
                        { value: "", label: "Select..." },
                        ...availableBenchPlayers,
                      ]}
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
                      options={[
                        { value: "", label: "Select..." },
                        ...availableFieldPlayers,
                      ]}
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
                    {sub.isComplete && (
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
