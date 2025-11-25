import { Card } from "../Card";

// Recent Form Card Component
function RecentFormCard({ recentGames, team }) {
  const gamesWithResult = recentGames.map((game) => {
    const isHome = game.home_team_season_id === team;
    const home = game.home_score;
    const away = game.away_score;

    let result = null;
    if (home != null && away != null) {
      if (isHome) {
        result = home > away ? "W" : home < away ? "L" : "D";
      } else {
        result = away > home ? "W" : away < home ? "L" : "D";
      }
    }

    const opponent_name = isHome
      ? `${game.away_club_name} ${game.away_team_name}`
      : `${game.home_club_name} ${game.home_team_name}`;

    // Display league name if available, otherwise show game type
    const gameContext = game.league_names || game.game_type || "Match";

    return {
      ...game,
      result,
      opponent_name,
      gameContext,
    };
  });

  if (!gamesWithResult || gamesWithResult.length === 0) {
    return (
      <Card variant='outlined' padding='md' className='h-full'>
        <div className='flex items-center gap-3 mb-4'>
          <span className='text-3xl'>📊</span>
          <h3 className='font-semibold text-lg text-text'>Recent Form</h3>
        </div>
        <div className='text-center text-muted py-8'>
          <p className='text-sm'>No recent games</p>
        </div>
      </Card>
    );
  }

  const getResultColor = (result) => {
    if (result === "W") return "bg-success text-white";
    if (result === "D") return "bg-muted text-white";
    if (result === "L") return "bg-danger text-white";
    return "bg-border text-text";
  };

  const getResultText = (result) => {
    if (result === "W") return "Win";
    if (result === "D") return "Draw";
    if (result === "L") return "Loss";
    return "—";
  };

  return (
    <Card
      variant='hover'
      shadow
      padding='md'
      title='Recent Form'
      icon='📊'
      className='h-full'
    >
      <div className='space-y-3'>
        {/* Form Indicators */}
        <div className='flex gap-2 justify-center pb-3 border-b border-border'>
          {gamesWithResult.slice(0, 5).map((game, idx) => (
            <div
              key={idx}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getResultColor(
                game.result
              )}`}
            >
              {game.result ? game.result : "N/A"}
            </div>
          ))}
        </div>

        {/* Recent Games List */}
        <div className='space-y-2'>
          {gamesWithResult.slice(0, 5).map((game, idx) => (
            <div
              key={idx}
              className='p-2 bg-surface rounded-lg border border-border hover:border-primary/50 transition'
            >
              <div className='flex items-center justify-between gap-2 mb-1'>
                <div className='min-w-0 flex-1'>
                  <span className='text-sm font-medium text-text block truncate'>
                    {game.opponent_name}
                  </span>
                  <span className='text-xs text-muted block truncate'>
                    {game.gameContext}
                  </span>
                </div>
                {game.result ? (
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap flex-shrink-0 ${getResultColor(
                      game.result
                    )}`}
                  >
                    {getResultText(game.result)}
                  </span>
                ) : (
                  <span className='text-xs text-muted whitespace-nowrap flex-shrink-0'>
                    No Result
                  </span>
                )}
              </div>
              <div className='flex items-center justify-between text-xs text-muted'>
                <span>{game.score || "—"}</span>
                <span>{new Date(game.start_date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default RecentFormCard;
