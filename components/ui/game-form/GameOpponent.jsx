// components/ui/game-form/GameOpponent.jsx
export function GameOpponent({ data, onChange, clubs, teams, onAddClub }) {
  const filteredTeams = teams.filter((team) =>
    data.club_id ? team.club_id === data.club_id : true
  );

  return (
    <div className='space-y-4'>
      <h3 className='font-semibold text-lg mb-3'>Opponent</h3>

      <div>
        <label className='block text-sm font-medium mb-1'>
          Opponent Club <span className='text-accent'>*</span>
        </label>
        <div className='flex gap-2'>
          <select
            value={data.club_id || ""}
            onChange={(e) =>
              onChange(
                "club_id",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            required
            className='flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
          >
            <option value=''>Select opponent club...</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
          <button
            type='button'
            onClick={onAddClub}
            className='px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 transition-colors'
            title='Add new club'
          >
            +
          </button>
        </div>
        <p className='text-xs text-muted mt-1'>
          Select club first to filter opponent teams
        </p>
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>
          Opponent Team <span className='text-accent'>*</span>
        </label>
        <select
          value={data.opponent || ""}
          onChange={(e) =>
            onChange(
              "opponent",
              e.target.value ? parseInt(e.target.value) : null
            )
          }
          required
          disabled={!data.club_id}
          className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted/10 disabled:cursor-not-allowed'
        >
          <option value=''>
            {data.club_id ? "Select opponent team..." : "Select a club first"}
          </option>
          {filteredTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.team_name}
            </option>
          ))}
        </select>
        {data.club_id && filteredTeams.length === 0 && (
          <p className='text-xs text-muted mt-1'>
            No eligible teams from this club
          </p>
        )}
      </div>
    </div>
  );
}
