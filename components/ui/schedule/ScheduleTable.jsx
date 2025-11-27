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
      render: (value, row) => {
        // Format leagues to show abbreviations if available
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
      data={games}
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
