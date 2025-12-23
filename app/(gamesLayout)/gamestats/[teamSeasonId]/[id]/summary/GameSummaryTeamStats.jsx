function GameSummaryTeamStats({
  teamStats,
  teamSeasonId,

  majorEvents,
}) {
  // Calculate card counts from major events
  const ourYellowCards =
    majorEvents?.filter(
      (e) =>
        e.stoppage_type === "discipline" && e.isOurs && e.card_type === "yellow"
    ).length || 0;

  const theirYellowCards =
    majorEvents?.filter(
      (e) =>
        e.stoppage_type === "discipline" &&
        !e.isOurs &&
        e.card_type === "yellow"
    ).length || 0;

  const ourRedCards =
    majorEvents?.filter(
      (e) =>
        e.stoppage_type === "discipline" && e.isOurs && e.card_type === "red"
    ).length || 0;

  const theirRedCards =
    majorEvents?.filter(
      (e) =>
        e.stoppage_type === "discipline" && !e.isOurs && e.card_type === "red"
    ).length || 0;

  return (
    <div className='bg-surface rounded-lg shadow-md p-4'>
      <h2 className='text-xl font-heading font-bold text-text mb-3'>
        Team Statistics
      </h2>
      {teamStats ? (
        <div className='grid grid-cols-3 gap-2'>
          <div className='text-center p-2 bg-background rounded-lg'>
            <div className='text-xs text-muted mb-1'>Shots</div>
            <div className='text-2xl font-bold text-primary'>
              {teamStats?.shot_on_target || 0}
            </div>
          </div>

          <div className='text-center p-2 bg-background rounded-lg'>
            <div className='text-xs text-muted mb-1'>Saves</div>
            <div className='text-2xl font-bold text-primary'>
              {teamStats?.save || 0}
            </div>
          </div>

          <div className='text-center p-2 bg-background rounded-lg'>
            <div className='text-xs text-muted mb-1'>Cards</div>
            <div className='text-lg font-bold'>
              <span className='text-yellow-500'>{ourYellowCards}</span>
              <span className='text-red-500'>/{ourRedCards}</span>
              <span className='text-muted mx-1'>-</span>
              <span className='text-yellow-500'>{theirYellowCards}</span>
              <span className='text-red-500'>/{theirRedCards}</span>
            </div>
          </div>

          <div className='text-center p-2 bg-background rounded-lg'>
            <div className='text-xs text-muted mb-1'>Offsides</div>
            <div className='text-lg font-bold'>
              <span className='text-primary'>{teamStats?.offside.us || 0}</span>
              <span className='text-muted mx-1'>-</span>
              <span className='text-accent'>
                {teamStats?.offside.them || 0}
              </span>
            </div>
          </div>

          <div className='text-center p-2 bg-background rounded-lg'>
            <div className='text-xs text-muted mb-1'>Corners</div>
            <div className='text-lg font-bold'>
              <span className='text-primary'>{teamStats?.corner.us || 0}</span>
              <span className='text-muted mx-1'>-</span>
              <span className='text-accent'>{teamStats?.corner.them || 0}</span>
            </div>
          </div>

          <div className='text-center p-2 bg-background rounded-lg'>
            <div className='text-xs text-muted mb-1'>Fouls</div>
            <div className='text-lg font-bold'>
              <span className='text-primary'>{teamStats?.foul.us || 0}</span>
              <span className='text-muted mx-1'>-</span>
              <span className='text-accent'>{teamStats?.foul.them || 0}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className='text-center text-muted py-3 text-sm'>
          No team stats available
        </div>
      )}
    </div>
  );
}

export default GameSummaryTeamStats;
