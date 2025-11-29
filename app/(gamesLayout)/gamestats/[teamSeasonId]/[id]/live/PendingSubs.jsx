"use client";
import { useMemo } from "react";
import Button from "@/components/ui/Button";
import useGamePlayersStore from "@/stores/gamePlayersStore";

function PendingSubsComponent() {
  const players = useGamePlayersStore((s) => s.players);
  const getPendingSubs = useGamePlayersStore((s) => s.getPendingSubs);
  const confirmSub = useGamePlayersStore((s) => s.confirmSub);
  const cancelSub = useGamePlayersStore((s) => s.cancelSub);

  const pendingSubs = getPendingSubs();

  const subsWithPlayerInfo = useMemo(() => {
    return pendingSubs.map((sub) => {
      const inPlayer = players.find((p) => p.id === sub.inPlayerId);
      const outPlayer = players.find((p) => p.id === sub.outPlayerId);

      return {
        ...sub,
        inPlayerName: inPlayer
          ? `#${inPlayer.jerseyNumber} ${inPlayer.fullName}`
          : "Unknown",
        outPlayerName: outPlayer
          ? `#${outPlayer.jerseyNumber} ${outPlayer.fullName}`
          : "Unknown",
      };
    });
  }, [pendingSubs, players]);

  if (subsWithPlayerInfo.length === 0) {
    return (
      <div className='text-center text-muted py-4'>
        No pending substitutions
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      {subsWithPlayerInfo.map((sub) => (
        <div
          key={sub.subId}
          className='flex items-center justify-between p-3 bg-surface rounded-lg border border-border'
        >
          <div className='flex-1'>
            <div className='flex items-center gap-3'>
              <div className='flex flex-col'>
                <span className='text-xs text-muted uppercase'>In</span>
                <span className='text-sm font-medium text-text'>
                  {sub.inPlayerName}
                </span>
              </div>

              <div className='text-muted'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>

              <div className='flex flex-col'>
                <span className='text-xs text-muted uppercase'>Out</span>
                <span className='text-sm font-medium text-text'>
                  {sub.outPlayerName}
                </span>
              </div>

              {sub.gkSub && (
                <span className='ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded'>
                  GK
                </span>
              )}
            </div>
          </div>

          <div className='flex gap-2 ml-4'>
            <Button
              onClick={() => confirmSub(sub.subId)}
              variant='success'
              size='sm'
            >
              Confirm
            </Button>
            <Button
              onClick={() => cancelSub(sub.subId)}
              variant='danger'
              size='sm'
            >
              Cancel
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PendingSubsComponent;
