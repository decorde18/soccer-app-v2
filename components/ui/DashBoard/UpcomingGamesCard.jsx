import { formatMySqlTime } from "@/lib/dateTimeUtils";
import { Card } from "../Card";

// Upcoming Games Card Component
function UpcomingGamesCard({ upcomingGames, team }) {
  if (!upcomingGames || upcomingGames.length === 0) {
    return (
      <Card variant='outlined' padding='md' className='h-full'>
        <div className='flex items-center gap-3 mb-4'>
          <span className='text-3xl'>⚽</span>
          <h3 className='font-semibold text-lg text-text'>Upcoming Games</h3>
        </div>
        <div className='text-center text-muted py-8'>
          <p className='text-sm'>No upcoming games scheduled</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      variant='hover'
      shadow
      padding='md'
      title='Upcoming Games'
      icon='⚽'
      className='h-full'
    >
      <div className='space-y-2'>
        {upcomingGames.map((game, idx) => (
          <div
            key={idx}
            className='p-3 bg-surface rounded-lg border border-border hover:border-primary/50 transition'
          >
            <div className='flex items-start justify-between mb-2'>
              <div className='flex-1'>
                <div className='font-medium text-text mb-1'>
                  {game.home_team_season_id === team ? "vs" : "@"}{" "}
                  <span className='text-primary'>
                    {game.home_team_season_id === team
                      ? `${game.away_club_name} ${game.away_team_name}`
                      : `${game.home_club_name} ${game.home_team_name}`}
                  </span>
                </div>
                {game.location_id && (
                  <div className='text-xs text-muted flex items-center gap-1'>
                    <span>📍</span>
                    <span className='truncate'>{`${game.location_name} ${game.sublocation_name}`}</span>
                  </div>
                )}
              </div>
            </div>
            <div className='flex items-center justify-between text-xs'>
              <span className='text-muted'>
                {new Date(game.start_date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {game.start_time && (
                <span className='font-medium text-text'>
                  {formatMySqlTime(game.start_time)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
export default UpcomingGamesCard;
