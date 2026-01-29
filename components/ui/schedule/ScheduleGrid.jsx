"use client";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatMySqlTime } from "@/lib/dateTimeUtils";

export default function ScheduleGrid({
  games,
  teamSeasonId,
  onEdit,
  onDelete,
  onSelect,
  showActions = false,
}) {
  if (!games || games.length === 0) {
    return (
      <Card className='text-center'>
        <p className='text-muted'>No games scheduled yet.</p>
      </Card>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Separate games into upcoming and past
  const upcomingGames = games.filter((game) => new Date(game.date) >= today);
  const pastGames = games.filter((game) => new Date(game.date) < today);
  // Sort upcoming ascending (soonest first), past descending (most recent first)
  upcomingGames.sort((a, b) => new Date(a.date) - new Date(b.date));
  pastGames.sort((a, b) => new Date(b.date) - new Date(a.date));

  const renderGameCard = (game, isPast = false) => {
    const getGameTypeBadge = () => {
      const gameType = game.rawGame?.game_type || game.game_type || "league";
      let colorClass = "";

      switch (gameType) {
        case "friendly":
          colorClass =
            "bg-green-500 text-white dark:bg-green-600 dark:text-white";
          break;
        case "scrimmage":
          colorClass =
            "bg-amber-500 text-white dark:bg-amber-600 dark:text-white";
          break;
        case "playoff":
          colorClass = "bg-red-500 text-white dark:bg-red-600 dark:text-white";
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
    const leaguesArray =
      game.rawGame?.leagues_array.filter((league) => league.league_id) || [];
    const hasLeagues = leaguesArray.length > 0;

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
          {hasLeagues &&
            leaguesArray.map((league) => {
              const isTournament = league.is_tournament === 1;
              let colorClass = "";
              if (isTournament) {
                colorClass =
                  "bg-violet-500 text-white dark:bg-violet-600 dark:text-white";
              } else {
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

        <div className='text-right flex-shrink-0'>
          {game.hasScore || game.status === "in_progress" ? (
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
              {game.status === "completed" ? (
                <div className='text-xs text-muted mt-1'>
                  {game.scoreUs > game.scoreThem
                    ? "Win"
                    : game.scoreUs < game.scoreThem
                      ? "Loss"
                      : "Draw"}
                </div>
              ) : (
                <div className='text-xs text-muted mt-1'>In Progress</div>
              )}
            </div>
          ) : (
            <span
              className={`text-sm font-medium px-3 py-1 rounded-md ${
                game.status === "scheduled"
                  ? "text-primary bg-primary/10"
                  : game.status === "cancelled"
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

    const gameFooter =
      showActions && onEdit && onDelete ? (
        <div className='flex gap-2 justify-center items-center'>
          <Button
            variant='outline'
            size='md'
            className='w-48'
            onClick={() => onEdit(game.rawGame)}
          >
            Edit
          </Button>

          <Button
            disabled={
              game.status === "cancelled" || game.status === "postponed"
            }
            variant='outline'
            size='md'
            className='w-48'
            onClick={() => onSelect(game.rawGame)}
          >
            {game.status === "completed"
              ? "Review Game Stats"
              : "Enter Game Stats"}
          </Button>
          <Button
            variant='outline'
            size='md'
            onClick={() => onDelete(game.id || game.game_id)}
            className='text-danger hover:bg-danger/10 w-48'
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
        className={
          isPast ? "bg-muted/5 border-muted/30" : "bg-card border-border"
        }
      >
        {gameBody}
      </Card>
    );
  };

  return (
    <div className='space-y-8'>
      {/* Upcoming Games Section */}
      {upcomingGames.length > 0 && (
        <div>
          <div className='mb-4 pb-2 border-b-2 border-primary'>
            <h2 className='text-xl font-bold text-text'>
              Upcoming Games
              <span className='ml-2 text-sm font-normal text-muted'>
                ({upcomingGames.length})
              </span>
            </h2>
          </div>
          <div className='space-y-4'>
            {upcomingGames.map((game) => renderGameCard(game, false))}
          </div>
        </div>
      )}

      {/* Past Games Section */}
      {pastGames.length > 0 && (
        <div>
          <div className='mb-4 pb-2 border-b-2 border-muted/50 mt-8'>
            <h2 className='text-lg font-semibold text-muted flex items-center gap-2'>
              <span className='inline-block w-8 h-0.5 bg-muted/50'></span>
              Past Games
              <span className='ml-2 text-sm font-normal'>
                ({pastGames.length})
              </span>
            </h2>
          </div>
          <div className='space-y-4'>
            {pastGames.map((game) => renderGameCard(game, true))}
          </div>
        </div>
      )}
    </div>
  );
}
