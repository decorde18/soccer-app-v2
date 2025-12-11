// GameSummaryPeriods.jsx
function GameSummaryPeriods({ periodBreakdown }) {
  if (!periodBreakdown || periodBreakdown.length === 0) return null;

  return (
    <div className='bg-[hsl(var(--color-surface))] rounded-lg shadow-md p-4'>
      <h2 className='text-xl font-heading font-bold text-[hsl(var(--color-text))] mb-3'>
        Score by Period
      </h2>
      <div className='grid grid-cols-2 gap-2'>
        {periodBreakdown.map((period) => (
          <div
            key={period.period}
            className='text-center p-3 bg-[hsl(var(--color-background))] rounded-lg'
          >
            <div className='text-xs text-[hsl(var(--color-muted))] mb-1'>
              {period.label}
            </div>
            <div className='text-xl font-bold'>
              <span className='text-[hsl(var(--color-primary))]'>
                {period.ours}
              </span>
              <span className='text-[hsl(var(--color-muted))] mx-2'>-</span>
              <span className='text-[hsl(var(--color-accent))]'>
                {period.theirs}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GameSummaryPeriods;
