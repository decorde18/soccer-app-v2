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
        // Get game type badge info
        const getGameTypeBadge = () => {
          const gameType =
            game.rawGame?.game_type || game.game_type || "league";

          let colorClass = "";

          // Color coding for different game types
          switch (gameType) {
            // case "tournament":
            //   colorClass =
            //     "bg-purple-500 text-white dark:bg-purple-600 dark:text-white";
            //   break;
            case "friendly":
              colorClass =
                "bg-green-500 text-white dark:bg-green-600 dark:text-white";
              break;
            case "scrimmage":
              colorClass =
                "bg-amber-500 text-white dark:bg-amber-600 dark:text-white";
              break;
            case "playoff":
              colorClass =
                "bg-red-500 text-white dark:bg-red-600 dark:text-white";
              break;
            case "exhibition":
              colorClass =
                "bg-orange-500 text-white dark:bg-orange-600 dark:text-white";
              break;
            default:
              colorClass =
                "bg-gray-500 text-white dark:bg-gray-600 dark:text-white";
          }

          return { type: gameType, colorClass };
        };

        const gameTypeInfo = getGameTypeBadge();

        // Get leagues array for multiple badges
        const leaguesArray = game.rawGame?.leagues_array || [];
        const hasLeagues = leaguesArray.length > 0;

        // Game header with date, time, home/away badge, and game type
        const gameHeader = (
          <div className='flex items-center justify-between gap-3 flex-wrap'>
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
            <div className='flex gap-2 flex-wrap items-center'>
              {/* League / Tournament / Other Game-Type Badges */}

              {hasLeagues &&
                leaguesArray.map((league) => {
                  const isTournament = league.is_tournament === 1;

                  let colorClass = "";
                  if (isTournament) {
                    // Tournament color
                    colorClass =
                      "bg-violet-500 text-white dark:bg-violet-600 dark:text-white";
                  } else {
                    // League color
                    colorClass =
                      "bg-blue-500 text-white dark:bg-blue-600 dark:text-white";
                  }

                  return (
                    <span
                      key={league.league_id}
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${colorClass}`}
                      title={`${league.league_name}${
                        league.league_node_name
                          ? ` - ${league.league_node_name}`
                          : ""
                      }`}
                    >
                      {league.league_abbreviation || league.league_name}
                      {league.league_node_name && (
                        <span className='ml-1 opacity-90'>
                          ({league.league_node_name})
                        </span>
                      )}
                    </span>
                  );
                })}

              {/* Game type badge for non-league games */}
              {!hasLeagues &&
                gameTypeInfo.type !== "league" &&
                gameTypeInfo.type !== "tournament" && (
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${gameTypeInfo.colorClass}`}
                  >
                    {gameTypeInfo.type.charAt(0).toUpperCase() +
                      gameTypeInfo.type.slice(1)}
                  </span>
                )}
            </div>
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
