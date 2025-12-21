"use client";
import { useMemo } from "react";
import TableContainer from "@/components/ui/TableContainer";
import Button from "@/components/ui/Button";
import { formatMySqlTime } from "@/lib/dateTimeUtils";

export default function ScheduleTable({
  games,
  teamSeasonId,
  onEdit,
  onDelete,
  showActions = false,
}) {
  const pageSize = 10;

  // Sort games and calculate initial page
  const { sortedGames, initialPage } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    // Helper function to get date-only comparison (ignoring time/timezone)
    const getDateOnly = (dateString) => {
      const date = new Date(dateString);
      // Create date in local timezone using just the date parts
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    // Always sort chronologically (oldest to newest)
    const sorted = [...games].sort((a, b) => {
      const dateA = getDateOnly(a.date);
      const dateB = getDateOnly(b.date);
      return dateA - dateB; // Ascending order
    });

    // Find the index of the first upcoming game (>= today)
    const firstUpcomingIndex = sorted.findIndex((game) => {
      const gameDate = getDateOnly(game.date);
      return gameDate.getTime() >= todayTime;
    });

    // Calculate which page that game is on (0-indexed)
    const page =
      firstUpcomingIndex >= 0 ? Math.floor(firstUpcomingIndex / pageSize) : 0;

    return { sortedGames: sorted, initialPage: page };
  }, [games, pageSize]);

  // Helper function for date comparison (reused in render)
  const getDateOnly = (dateString) => {
    const date = new Date(dateString);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const columns = [
    {
      name: "date",
      label: "Date",
      key: "date",
      render: (value, row) => {
        const gameDate = getDateOnly(value);
        const isPast = gameDate.getTime() < todayTime;

        return (
          <span className={`text-sm ${isPast ? "text-muted" : "font-medium"}`}>
            {gameDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        );
      },
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
      render: (value, row) => {
        const leagueDisplay = row.leagues_array
          ? JSON.parse(row.leagues_array)
              .map((l) => l.league_abbreviation || l.league_name)
              .join(", ")
          : value;

        return <span className='text-sm text-muted'>{leagueDisplay}</span>;
      },
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
                row.scoreUs > row.scoreThem
                  ? "text-success"
                  : row.scoreUs < row.scoreThem
                  ? "text-danger"
                  : "text-muted"
              }`}
            >
              {row.scoreUs}
            </span>
            <span className='text-muted'>-</span>
            <span className='font-bold text-text'>{row.scoreThem}</span>
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
      data={sortedGames}
      enableSorting={true}
      defaultSortKey='date'
      defaultSortDirection='asc'
      enableFiltering={true}
      filterPlaceholder='Search games...'
      filterKeys={["opponent", "location", "league"]}
      enablePagination={true}
      pageSize={pageSize}
      initialPage={initialPage}
      size='sm'
      hoverable={true}
      emptyMessage='No games scheduled yet.'
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
