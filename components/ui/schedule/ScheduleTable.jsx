"use client";
import TableContainer from "@/components/ui/TableContainer";
import Button from "@/components/ui/Button";
import { formatMySqlTime } from "@/lib/dateTimeUtils";

export default function ScheduleTable({
  games,
  teamSeasonId,
  // Optional admin props
  onEdit,
  onDelete,
  showActions = false,
}) {
  // Transform games data for table
  const tableData = games.map((game) => {
    // Handle both data structures (API view vs direct DB)
    const isHome = game.home_team_season_id
      ? game.home_team_season_id === parseInt(teamSeasonId)
      : game.home_away === "home";

    const opponent =
      game.away_team_name || game.home_team_name || game.opponent;
    const opponentClub =
      game.away_club_name || game.home_club_name || game.opponent;
    const gameDate = game.start_date || game.game_date;
    const gameTime = game.start_time || game.game_time;
    const location = game.location_name || game.location;
    const sublocation = game.sublocation_name;

    const hasScore =
      game.score_us !== undefined &&
      game.score_them !== undefined &&
      game.score_us !== null &&
      game.score_them !== null;

    const result = hasScore
      ? game.score_us > game.score_them
        ? "W"
        : game.score_us < game.score_them
        ? "L"
        : "D"
      : "-";

    return {
      id: game.id || game.game_id,
      date: gameDate,
      time: gameTime,
      timezone: game.timezone_label,
      homeAway: isHome ? "HOME" : "AWAY",
      opponent:
        opponentClub !== opponent
          ? `${opponentClub} (${opponent})`
          : opponentClub,
      location: location || "-",
      sublocation: sublocation || "",
      league: game.league_names || "-",
      score_us: game.score_us ?? "-",
      score_them: game.score_them ?? "-",
      result,
      status: game.status,
      isHome,
      hasScore,
      rawGame: game, // Keep original for edit
    };
  });

  const columns = [
    {
      name: "date",
      label: "Date",
      key: "date",
      render: (value) => (
        <span className='text-sm'>
          {new Date(value).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      name: "time",
      label: "Time",
      key: "time",
      render: (value, row) => (
        <span className='text-sm text-muted'>
          {value ? `${formatMySqlTime(value)} ${row.timezone || ""}` : "-"}
        </span>
      ),
    },
    {
      name: "homeAway",
      label: "H/A",
      key: "homeAway",
      render: (value, row) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-md ${
            row.isHome ? "bg-primary/10 text-primary" : "bg-muted/20 text-muted"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      name: "opponent",
      label: "Opponent",
      key: "opponent",
      render: (value) => <span className='font-medium'>{value}</span>,
    },
    {
      name: "location",
      label: "Location",
      key: "location",
      render: (value, row) => (
        <span className='text-sm text-muted'>
          {value}
          {row.sublocation && ` - ${row.sublocation}`}
        </span>
      ),
    },
    {
      name: "league",
      label: "League",
      key: "league",
      render: (value) => <span className='text-sm text-muted'>{value}</span>,
    },
    {
      name: "score",
      label: "Score",
      key: "score",
      render: (_, row) =>
        row.hasScore ? (
          <div className='flex items-center gap-2'>
            <span
              className={`font-bold ${
                row.score_us > row.score_them
                  ? "text-success"
                  : row.score_us < row.score_them
                  ? "text-danger"
                  : "text-muted"
              }`}
            >
              {row.score_us}
            </span>
            <span className='text-muted'>-</span>
            <span className='font-bold text-text'>{row.score_them}</span>
          </div>
        ) : (
          <span
            className={`text-xs px-2 py-1 rounded-md ${
              row.status === "scheduled"
                ? "text-primary bg-primary/10"
                : row.status === "canceled"
                ? "text-accent bg-accent/10"
                : "text-muted bg-muted/10"
            }`}
          >
            {row.status?.charAt(0).toUpperCase() + row.status?.slice(1)}
          </span>
        ),
    },
    {
      name: "result",
      label: "Result",
      key: "result",
      render: (value) =>
        value !== "-" ? (
          <span
            className={`font-bold text-sm ${
              value === "W"
                ? "text-success"
                : value === "L"
                ? "text-danger"
                : "text-muted"
            }`}
          >
            {value}
          </span>
        ) : (
          <span className='text-muted text-sm'>-</span>
        ),
    },
  ];

  return (
    <TableContainer
      columns={columns}
      data={tableData}
      enableSorting={true}
      defaultSortKey='date'
      defaultSortDirection='asc'
      enableFiltering={true}
      filterPlaceholder='Search games...'
      filterKeys={["opponent", "location", "league"]}
      enablePagination={true}
      pageSize={10}
      size='sm'
      hoverable={true}
      emptyMessage='No games scheduled yet.'
      // Conditionally add actions column if showActions is true
      actions={
        showActions && onEdit && onDelete
          ? (row) => (
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='xs'
                  onClick={() => onEdit(row.rawGame)}
                >
                  Edit
                </Button>
                <Button
                  variant='outline'
                  size='xs'
                  onClick={() => onDelete(row.id)}
                  className='text-danger hover:bg-danger/10'
                >
                  Delete
                </Button>
              </div>
            )
          : undefined
      }
      actionsLabel='Actions'
      actionsWidth='140px'
    />
  );
}
