// GameSummarySubs.jsx
import { formatSecondsToMmss } from "@/lib/dateTimeUtils";

function GameSummarySubs({ substitutions }) {
  if (!substitutions || substitutions.length === 0) return null;

  return (
    <div className='bg-surface rounded-lg shadow-md p-4'>
      <h2 className='text-xl font-heading font-bold text-text mb-3'>
        Substitutions
      </h2>
      <div className='space-y-2'>
        {substitutions.map((sub) => (
          <div
            key={sub.subId}
            className='flex items-center gap-3 p-2 border border-border rounded-lg'
          >
            <div className='text-base'>🔄</div>
            <div className='flex-1 min-w-0'>
              {sub.inPlayer && (
                <div className='font-semibold text-success text-sm'>
                  IN: {sub.inPlayer.fullName} (#{sub.inPlayer.jerseyNumber})
                </div>
              )}
              {sub.outPlayer && (
                <div className='font-semibold text-danger text-sm'>
                  OUT: {sub.outPlayer.fullName} (#{sub.outPlayer.jerseyNumber})
                </div>
              )}
            </div>
            <div className='text-xs text-muted'>
              {formatSecondsToMmss(sub.gameTime)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GameSummarySubs;
