// components/ui/game-form/GameLeagues.jsx
export function GameLeagues({ data, onChange, leagues }) {
  const showLeagues = ["league", "tournament", "playoff"].includes(
    data.game_type
  );

  if (!showLeagues) return null;

  const selectedIds = data.league_node_ids || [];

  const handleToggleLeague = (leagueId) => {
    const newIds = selectedIds.includes(leagueId)
      ? selectedIds.filter((id) => id !== leagueId)
      : [...selectedIds, leagueId];
    onChange("league_node_ids", newIds);
  };

  const handleSetPrimary = (leagueId) => {
    // Move selected league to front (primary position)
    const newIds = [leagueId, ...selectedIds.filter((id) => id !== leagueId)];
    onChange("league_node_ids", newIds);
  };

  return (
    <div className='space-y-4'>
      <h3 className='font-semibold text-lg mb-3'>
        {data.game_type === "tournament"
          ? "Tournaments"
          : data.game_type === "playoff"
          ? "Playoffs"
          : "Leagues"}
        <span className='text-accent'> *</span>
      </h3>

      <p className='text-sm text-muted mb-3'>
        Select all {data.game_type}s this game counts toward. The first one
        selected will be the primary.
      </p>

      {leagues.length === 0 ? (
        <div className='p-4 bg-muted/10 rounded-md text-sm text-muted'>
          No {data.game_type}s found for this team. The team must be enrolled in
          a {data.game_type} to schedule {data.game_type} games.
        </div>
      ) : (
        <div className='space-y-2 max-h-60 overflow-y-auto'>
          {leagues.map((league, index) => {
            const isSelected = selectedIds.includes(league.id);
            const isPrimary = selectedIds[0] === league.id;

            return (
              <div
                key={league.id}
                className={`p-3 rounded-md border-2 transition-all cursor-pointer ${
                  isSelected
                    ? isPrimary
                      ? "border-primary bg-primary/10"
                      : "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
                onClick={() => handleToggleLeague(league.id)}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <input
                      type='checkbox'
                      checked={isSelected}
                      onChange={() => handleToggleLeague(league.id)}
                      className='w-4 h-4'
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <div className='font-medium'>{league.league_name}</div>
                      {isPrimary && (
                        <span className='text-xs text-primary font-semibold'>
                          Primary
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && !isPrimary && (
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(league.id);
                      }}
                      className='text-xs px-2 py-1 border border-primary text-primary rounded hover:bg-primary/10'
                    >
                      Set as Primary
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
