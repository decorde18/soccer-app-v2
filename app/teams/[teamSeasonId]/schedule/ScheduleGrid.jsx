"use client";
import { Card } from "@/components/ui/Card";

export default function ScheduleGrid({ games, teamSeasonId }) {
  // Helper to format time (13:00:00 -> 1:00 PM)
  const formatTime = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (!games || games.length === 0) {
    return (
      <Card className='text-center'>
        <p className='text-muted'>No games scheduled yet.</p>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      {games.map((game) => {
        const isHome = game.home_team_season_id === parseInt(teamSeasonId);
        const opponent = isHome ? game.away_team_name : game.home_team_name;
        const opponentClub = isHome ? game.away_club_name : game.home_club_name;

        const hasScore =
          game.score_us !== undefined &&
          game.score_them !== undefined &&
          game.score_us !== null &&
          game.score_them !== null;

        // Game header with date, time, and home/away badge
        const gameHeader = (
          <div className='flex items-center gap-3 flex-wrap'>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                isHome ? "bg-primary/10 text-primary" : "bg-muted/20 text-muted"
              }`}
            >
              {isHome ? "HOME" : "AWAY"}
            </span>
            <span className='text-muted text-sm'>
              {new Date(game.start_date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            {game.start_time && (
              <span className='text-muted text-sm'>
                • {formatTime(game.start_time)} {game.timezone_label}
              </span>
            )}
          </div>
        );

        // Game body with opponent and location
        const gameBody = (
          <div className='flex justify-between items-start gap-4'>
            <div className='flex-1 min-w-0'>
              <h3 className='text-lg text-text'>vs {opponentClub}</h3>

              {opponentClub !== opponent && (
                <p className='text-sm text-muted mt-1'>{opponent}</p>
              )}

              {game.location_name && (
                <p className='text-muted text-sm mt-2 flex items-center gap-1'>
                  <span>📍</span>
                  <span>
                    {game.location_name}
                    {game.sublocation_name && ` - ${game.sublocation_name}`}
                  </span>
                </p>
              )}
            </div>

            {/* Score Display / Status */}
            <div className='text-right flex-shrink-0'>
              {hasScore ? (
                <div>
                  <div className='text-3xl font-bold'>
                    <span
                      className={
                        game.score_us > game.score_them
                          ? "text-success"
                          : game.score_us < game.score_them
                          ? "text-danger"
                          : "text-muted"
                      }
                    >
                      {game.score_us}
                    </span>
                    <span className='text-muted mx-2'>-</span>
                    <span className='text-text'>{game.score_them}</span>
                  </div>
                  <div className='text-xs text-muted mt-1'>
                    {game.score_us > game.score_them
                      ? "Win"
                      : game.score_us < game.score_them
                      ? "Loss"
                      : "Draw"}
                  </div>
                </div>
              ) : (
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-md ${
                    game.status === "scheduled"
                      ? "text-primary bg-primary/10"
                      : game.status === "canceled"
                      ? "text-accent bg-accent/10"
                      : "text-muted bg-muted/10"
                  }`}
                >
                  {game.status?.charAt(0).toUpperCase() + game.status?.slice(1)}
                </span>
              )}
            </div>
          </div>
        );

        return (
          <Card
            key={game.game_id}
            header={gameHeader}
            subTitle={game.league_names}
            variant='hover'
          >
            {gameBody}
          </Card>
        );
      })}
    </div>
  );
}
