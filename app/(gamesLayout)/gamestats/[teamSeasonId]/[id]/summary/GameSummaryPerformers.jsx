// GameSummaryPerformers.jsx
function GameSummaryPerformers({ topPerformers }) {
  if (!topPerformers) return null;

  return (
    <>
      {/* Goalkeeper Performance */}
      {topPerformers.topGK && (
        <div className='bg-[hsl(var(--color-surface))] rounded-lg shadow-md p-4'>
          <h2 className='text-xl font-heading font-bold text-[hsl(var(--color-text))] mb-3'>
            Goalkeeper
          </h2>
          <div className='grid grid-cols-3 gap-2'>
            <div className='text-center p-3 bg-blue-50 rounded-lg'>
              <div className='text-xs text-[hsl(var(--color-muted))] mb-1'>
                Player
              </div>
              <div className='text-base font-bold text-[hsl(var(--color-text))]'>
                {topPerformers.topGK.fullName}
              </div>
              <div className='text-xs text-[hsl(var(--color-muted))]'>
                #{topPerformers.topGK.jerseyNumber}
              </div>
            </div>
            <div className='text-center p-3 bg-blue-50 rounded-lg'>
              <div className='text-xs text-[hsl(var(--color-muted))] mb-1'>
                Saves
              </div>
              <div className='text-2xl font-bold text-[hsl(var(--color-primary))]'>
                {topPerformers.topGK.saves}
              </div>
            </div>
            <div className='text-center p-3 bg-blue-50 rounded-lg'>
              <div className='text-xs text-[hsl(var(--color-muted))] mb-1'>
                GA
              </div>
              <div className='text-2xl font-bold text-[hsl(var(--color-accent))]'>
                {topPerformers.topGK.goalsAgainst}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers */}
      {(topPerformers.topScorer || topPerformers.topAssist) && (
        <div className='bg-[hsl(var(--color-surface))] rounded-lg shadow-md p-4'>
          <h2 className='text-xl font-heading font-bold text-[hsl(var(--color-text))] mb-3'>
            Top Performers
          </h2>
          <div className='grid grid-cols-1 gap-2'>
            {topPerformers.topScorer && (
              <div className='p-3 bg-green-50 rounded-lg'>
                <div className='text-xs text-[hsl(var(--color-muted))] mb-1'>
                  ⚽ Top Scorer
                </div>
                <div className='text-base font-bold text-[hsl(var(--color-text))]'>
                  {topPerformers.topScorer.fullName} (#
                  {topPerformers.topScorer.jerseyNumber})
                </div>
                <div className='text-2xl font-bold text-[hsl(var(--color-success))] mt-1'>
                  {topPerformers.topScorer.goals}{" "}
                  {topPerformers.topScorer.goals === 1 ? "goal" : "goals"}
                </div>
              </div>
            )}
            {topPerformers.topAssist && (
              <div className='p-3 bg-blue-50 rounded-lg'>
                <div className='text-xs text-[hsl(var(--color-muted))] mb-1'>
                  🎯 Most Assists
                </div>
                <div className='text-base font-bold text-[hsl(var(--color-text))]'>
                  {topPerformers.topAssist.fullName} (#
                  {topPerformers.topAssist.jerseyNumber})
                </div>
                <div className='text-2xl font-bold text-blue-600 mt-1'>
                  {topPerformers.topAssist.assists}{" "}
                  {topPerformers.topAssist.assists === 1 ? "assist" : "assists"}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default GameSummaryPerformers;
