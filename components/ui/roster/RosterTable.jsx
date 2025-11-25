"use client";
import TableContainer from "@/components/ui/TableContainer";
import Button from "@/components/ui/Button";

export default function RosterTable({
  players,
  teamSeasonId,
  // Optional admin props
  onEdit,
  onDelete,
  showActions = false,
}) {
  const columns = [
    {
      name: "jersey_number",
      label: "#",
      key: "jersey_number",
      render: (value) => (
        <span className='font-bold text-lg text-primary'>{value}</span>
      ),
    },
    {
      name: "name",
      label: "Name",
      key: "name",
      render: (_, row) => (
        <span className='font-medium'>
          {row.first_name} {row.last_name}
        </span>
      ),
    },
    {
      name: "position",
      label: "Position",
      key: "position",
      render: (value) => (
        <span className='text-sm text-muted'>{value || "-"}</span>
      ),
    },
    {
      name: "email",
      label: "Email",
      key: "email",
      render: (value) => (
        <span className='text-sm text-muted'>{value || "-"}</span>
      ),
    },
    {
      name: "phone",
      label: "Phone",
      key: "phone",
      render: (value) => (
        <span className='text-sm text-muted'>{value || "-"}</span>
      ),
    },
    {
      name: "grade",
      label: "Grade",
      key: "grade",
      render: (value) => (
        <span className='text-sm text-muted'>{value || "-"}</span>
      ),
    },
    {
      name: "school",
      label: "School",
      key: "school",
      render: (value) => (
        <span className='text-sm text-muted'>{value || "-"}</span>
      ),
    },
  ];

  return (
    <TableContainer
      columns={columns}
      data={players}
      enableSorting={true}
      defaultSortKey='jersey_number'
      defaultSortDirection='asc'
      enableFiltering={true}
      filterPlaceholder='Search players...'
      filterKeys={["first_name", "last_name", "position", "email", "school"]}
      enablePagination={true}
      pageSize={20}
      size='sm'
      hoverable={true}
      emptyMessage='No players on the roster yet.'
      // Conditionally add actions column if showActions is true
      actions={
        showActions && onEdit && onDelete
          ? (row) => (
              <div className='flex gap-2'>
                <Button variant='outline' size='xs' onClick={() => onEdit(row)}>
                  Edit
                </Button>
                <Button
                  variant='outline'
                  size='xs'
                  onClick={() => onDelete(row.id || row.player_id)}
                  className='text-danger hover:bg-danger/10'
                >
                  Remove
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
