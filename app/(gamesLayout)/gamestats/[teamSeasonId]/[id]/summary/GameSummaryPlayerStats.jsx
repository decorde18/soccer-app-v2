import TableContainer from "@/components/ui/TableContainer";

function GameSummaryPlayerStats({ players }) {
  // 1. Column Definitions (Using "name" to match Table.jsx logic)
  const getNameColumn = (type) => ({
    name: "name",
    label: "Name",
    width: "200px",
    render: (value, row) => {
      // Logic: In GK table, only show badge if gameStatus was 'goalkeeper'
      // In Outfield table, show badge if 'starter'
      const showBadge =
        type === "gk"
          ? row.originalStatus === "goalkeeper"
          : row.originalStatus === "starter";

      return (
        <div className='flex items-center gap-2'>
          <span>{value}</span>
          {showBadge && (
            <span className='px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 rounded'>
              S
            </span>
          )}
        </div>
      );
    },
  });
  const commonPrefix = (type) => [
    { name: "number", label: "#", width: "50px" },
    getNameColumn(type),
  ];
  const outfieldColumns = [
    ...commonPrefix("outfield"),
    { name: "minutes", label: "Min" },
    { name: "goals", label: "G" },
    { name: "assists", label: "A" },
    { name: "plusMinus", label: "+/-" },
    { name: "shots", label: "Sh" },
    { name: "yc", label: "YC" },
    { name: "rc", label: "RC" },
  ];

  const gkColumns = [
    ...commonPrefix("gk"),
    { name: "goalkeeperTime", label: "Min" }, // Use GK specific minutes label
    { name: "saves", label: "Sv" },
    { name: "ga", label: "GA" },
    { name: "yc", label: "YC" },
  ];

  const activePlayers = players
    .filter((p) => (p.minutesPlayed || 0) > 0)
    .map((p) => ({
      id: p.id,
      number: p.jerseyNumber ?? "—",
      name: p.fullName,
      originalStatus: p.gameStatus, // Store for the conditional badge logic
      minutes: p.minutesPlayed || 0,
      goalkeeperTime: Math.floor(p.goalkeeperTime / 60) || 0,
      goals: p.goals || 0,
      assists: p.assists || 0,
      shots: p.shots || 0,
      saves: p.saves || 0,
      ga: p.goalsAgainst || 0,
      yc: p.yellowCards || 0,
      rc: p.redCards || 0,
      plusMinus: p.plusMinus || 0,
    }));

  // Separation based on goalkeeperTime
  const gkData = activePlayers.filter((p) => p?.goalkeeperTime > 0);

  const playersNotAvailable = players
    .filter((p) => (p.minutesPlayed || 0) === 0)
    .sort((a, b) => (a.gameStatus || "").localeCompare(b.gameStatus || ""));

  return (
    <div className='flex flex-col gap-8 bg-surface rounded-lg shadow-sm p-6'>
      {/* Outfield Table */}
      <div>
        <h2 className='text-lg font-bold mb-4 border-b pb-2 text-text'>
          Field Players
        </h2>
        <TableContainer
          columns={outfieldColumns}
          data={activePlayers}
          enableSorting={true}
          defaultSortKey='minutes'
          defaultSortDirection='desc'
          size='sm'
        />
      </div>

      {/* Goalkeeper Table */}
      {gkData.length > 0 && (
        <div>
          <h2 className='text-lg font-bold mb-4 border-b pb-2 text-text'>
            Goalkeepers
          </h2>
          <TableContainer
            columns={gkColumns}
            data={gkData}
            enableSorting={true}
            defaultSortKey='goalkeeperTime'
            defaultSortDirection='desc'
            size='sm'
          />
        </div>
      )}

      {/* DNP Section */}
      <div className='bg-background/40 rounded-md p-4'>
        <h3 className='text-xs font-bold uppercase tracking-wider text-muted mb-3'>
          Did Not Play
        </h3>
        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3'>
          {playersNotAvailable.map((p) => (
            <div key={p.id} className='text-sm text-text flex flex-col'>
              <span className='font-medium'>{p.fullName}</span>
              <span className='text-[11px] text-muted uppercase'>
                {p.gameStatus === "dressed" ? "DNP" : p.gameStatus}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GameSummaryPlayerStats;
