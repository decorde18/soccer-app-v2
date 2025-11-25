"use client";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatMySqlTime } from "@/lib/dateTimeUtils";

export default function ScheduleGrid({
  games,
  teamSeasonId,
  // Optional admin props
  onEdit,
  onDelete,
  showActions = false,
}) {
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
        // Game header with date, time, and home/away badge
        const gameHeader = (
          <div className='flex items-center gap-3 flex-wrap'>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                game.isHome
                  ? "bg-primary/10 text-primary"
                  : "bg-muted/20 text-muted"
              }`}
            >
              {game.isHome ? "HOME" : "AWAY"}
            </span>
            <span className='text-muted text-sm'>
              {new Date(game.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            {game.time && (
              <span className='text-muted text-sm'>
                • {formatMySqlTime(game.time)} {game.timezone_label}
              </span>
            )}
          </div>
        );

        // Game body with opponent and location
        const gameBody = (
          <div className='flex justify-between items-start gap-4'>
            <div className='flex-1 min-w-0'>
              <h3 className='text-lg text-text'>vs {game.opponentClub}</h3>

              {game.opponentClub !== game.opponent && (
                <p className='text-sm text-muted mt-1'>{game.opponent}</p>
              )}

              {game.location && (
                <p className='text-muted text-sm mt-2 flex items-center gap-1'>
                  <span>📍</span>
                  <span>
                    {game.location}
                    {game.sublocation && ` - ${game.sublocation}`}
                  </span>
                </p>
              )}
            </div>

            {/* Score Display / Status */}
            <div className='text-right flex-shrink-0'>
              {game.hasScore ? (
                <div>
                  <div className='text-3xl font-bold'>
                    <span
                      className={
                        game.scoreUs > game.scoreThem
                          ? "text-success"
                          : game.scoreUs < game.scoreThem
                          ? "text-danger"
                          : "text-muted"
                      }
                    >
                      {game.scoreUs}
                    </span>
                    <span className='text-muted mx-2'>-</span>
                    <span className='text-text'>{game.scoreThem}</span>
                  </div>
                  <div className='text-xs text-muted mt-1'>
                    {game.scoreUs > game.scoreThem
                      ? "Win"
                      : game.scoreUs < game.scoreThem
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

        // Optional admin actions footer
        const gameFooter =
          showActions && onEdit && onDelete ? (
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onEdit(game.rawGame)}
              >
                Edit
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onDelete(game.id || game.game_id)}
                className='text-danger hover:bg-danger/10'
              >
                Delete
              </Button>
            </div>
          ) : undefined;

        return (
          <Card
            key={game.id || game.game_id}
            header={gameHeader}
            subTitle={game.league_names}
            footer={gameFooter}
            variant='hover'
          >
            {gameBody}
          </Card>
        );
      })}
    </div>
  );
}
