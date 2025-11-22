import { Card } from "../Card";

// League Standing Card Component
function LeagueStandingCard({ standings }) {
  if (!standings) {
    return (
      <Card variant='outlined' padding='md'>
        <div className='text-center text-muted py-8'>
          <p className='text-sm'>No standings data available</p>
        </div>
      </Card>
    );
  }

  const gamesPlayed =
    (standings.wins || 0) + (standings.draws || 0) + (standings.losses || 0);
  const gamesRemaining = (standings.total_games || 0) - gamesPlayed;

  return (
    <Card
      variant='hover'
      shadow
      padding='md'
      title={standings.league_name || "League Standing"}
      icon='🏆'
    >
      <div className='space-y-4'>
        {/* Position Badge */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full'>
              <span className='text-2xl font-bold text-primary'>
                {standings.position}
              </span>
            </div>
            <div className='text-xs text-muted'>
              <div>Position</div>
              <div className='font-medium text-text'>
                of {standings.total_teams || "—"}
              </div>
            </div>
          </div>
          <div className='text-right'>
            <div className='text-2xl font-bold text-text'>
              {standings.points || 0}
            </div>
            <div className='text-xs text-muted'>Points</div>
          </div>
        </div>

        {/* Record */}
        <div className='grid grid-cols-3 gap-2 p-3 bg-surface rounded-lg border border-border'>
          <div className='text-center'>
            <div className='text-lg font-bold text-success'>
              {standings.wins || 0}
            </div>
            <div className='text-xs text-muted'>Wins</div>
          </div>
          <div className='text-center'>
            <div className='text-lg font-bold text-muted'>
              {standings.draws || 0}
            </div>
            <div className='text-xs text-muted'>Draws</div>
          </div>
          <div className='text-center'>
            <div className='text-lg font-bold text-danger'>
              {standings.losses || 0}
            </div>
            <div className='text-xs text-muted'>Losses</div>
          </div>
        </div>

        {/* Games Info */}
        <div className='flex justify-between text-xs text-muted pt-2 border-t border-border'>
          <div>
            <span className='font-medium text-text'>{gamesPlayed}</span> Played
          </div>
          <div>
            <span className='font-medium text-text'>{gamesRemaining}</span>{" "}
            Remaining
          </div>
        </div>
      </div>
    </Card>
  );
}
export default LeagueStandingCard;
