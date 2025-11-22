import { Card } from "../Card";

// Recent Form Card Component
function RecentFormCard({ recentGames }) {
  if (!recentGames || recentGames.length === 0) {
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
          {recentGames.slice(0, 5).map((game, idx) => (
            <div
              key={idx}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getResultColor(
                game.result
              )}`}
            >
              {game.result}
            </div>
          ))}
        </div>

        {/* Recent Games List */}
        <div className='space-y-2'>
          {recentGames.slice(0, 3).map((game, idx) => (
            <div
              key={idx}
              className='p-2 bg-surface rounded-lg border border-border hover:border-primary/50 transition'
            >
              <div className='flex items-center justify-between mb-1'>
                <span className='text-sm font-medium text-text truncate'>
                  {game.opponent_name}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium ${getResultColor(
                    game.result
                  )}`}
                >
                  {getResultText(game.result)}
                </span>
              </div>
              <div className='flex items-center justify-between text-xs text-muted'>
                <span>{game.score || "—"}</span>
                <span>{new Date(game.date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default RecentFormCard;
