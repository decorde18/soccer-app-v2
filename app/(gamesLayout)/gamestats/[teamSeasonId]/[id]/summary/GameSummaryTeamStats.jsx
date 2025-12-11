// GameSummaryTeamStats.jsx
function GameSummaryTeamStats({ teamStats }) {
  return (
    <div className='bg-[hsl(var(--color-surface))] rounded-lg shadow-md p-4'>
      <h2 className='text-xl font-heading font-bold text-[hsl(var(--color-text))] mb-3'>
        Team Statistics
      </h2>
      {teamStats ? (
        <div className='grid grid-cols-2 gap-2'>
          <div className='text-center p-2 bg-[hsl(var(--color-background))] rounded-lg'>
            <div className='text-xs text-[hsl(var(--color-muted))] mb-1'>
              Shots
            </div>
            <div className='text-2xl font-bold text-[hsl(var(--color-primary))]'>
              {teamStats.shots || 0}
            </div>
            <div className='text-xs text-[hsl(var(--color-muted))]'>
              on target: {teamStats.shots_on_target || 0}
            </div>
          </div>
          <div className='text-center p-2 bg-[hsl(var(--color-background))] rounded-lg'>
            <div className='text-xs text-[hsl(var(--color-muted))] mb-1'>
              Saves
            </div>
            <div className='text-2xl font-bold text-[hsl(var(--color-primary))]'>
              {teamStats.saves || 0}
            </div>
          </div>
          <div className='text-center p-2 bg-[hsl(var(--color-background))] rounded-lg'>
            <div className='text-xs text-[hsl(var(--color-muted))] mb-1'>
              Corners
            </div>
            <div className='text-lg font-bold'>
              <span className='text-[hsl(var(--color-primary))]'>
                {teamStats.corners_for || 0}
              </span>
              <span className='text-[hsl(var(--color-muted))] mx-1'>-</span>
              <span className='text-[hsl(var(--color-accent))]'>
                {teamStats.corners_against || 0}
              </span>
            </div>
          </div>
          <div className='text-center p-2 bg-[hsl(var(--color-background))] rounded-lg'>
            <div className='text-xs text-[hsl(var(--color-muted))] mb-1'>
              Fouls
            </div>
            <div className='text-lg font-bold'>
              <span className='text-[hsl(var(--color-primary))]'>
                {teamStats.fouls_committed || 0}
              </span>
              <span className='text-[hsl(var(--color-muted))] mx-1'>/</span>
              <span className='text-[hsl(var(--color-accent))]'>
                {teamStats.fouls_drawn || 0}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className='text-center text-[hsl(var(--color-muted))] py-3 text-sm'>
          No team stats available
        </div>
      )}
    </div>
  );
}

export default GameSummaryTeamStats;
