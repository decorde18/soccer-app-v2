// GameSummaryPlayerStats.jsx
import Table from "@/components/ui/Table";

function GameSummaryPlayerStats({ players }) {
  const playerColumns = [
    { name: "number", label: "#", width: "50px" },
    { name: "name", label: "Name", width: "25%" },
    { name: "position", label: "Pos", width: "80px" },
    { name: "minutes", label: "Min", cellClassName: "text-end" },
    { name: "goals", label: "G", cellClassName: "text-end" },
    { name: "assists", label: "A", cellClassName: "text-end" },
    { name: "shots", label: "Sh", cellClassName: "text-end" },
    { name: "saves", label: "Sv", cellClassName: "text-end" },
    { name: "ga", label: "GA", cellClassName: "text-end" },
    { name: "yc", label: "YC", cellClassName: "text-end" },
    { name: "rc", label: "RC", cellClassName: "text-end" },
  ];

  const playerData = players.map((p) => ({
    number: p.jerseyNumber ?? "—",
    name: p.fullName,
    position: p.position || "—",
    minutes: p.minutesPlayed || 0,
    goals: p.goals || 0,
    assists: p.assists || 0,
    shots: p.shots || 0,
    saves: p.saves || 0,
    ga: p.goalsAgainst || 0,
    yc: p.yellowCards || 0,
    rc: p.redCards || 0,
  }));

  return (
    <div className='bg-[hsl(var(--color-surface))] rounded-lg shadow-md p-4'>
      <h2 className='text-xl font-heading font-bold text-[hsl(var(--color-text))] mb-3'>
        Player Statistics
      </h2>
      <Table
        columns={playerColumns}
        data={playerData}
        size='sm'
        hoverable={false}
      />
    </div>
  );
}

export default GameSummaryPlayerStats;
