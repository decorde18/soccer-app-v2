"use client";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { formatMySqlDate } from "@/lib/dateUtils";
import { gamesFields } from "@/lib/pageColumns";
import { mockGame } from "@/mockData";
import { useRouter } from "next/navigation";

function Games() {
  const router = useRouter();
  const data = [
    {
      ...mockGame,
      date: formatMySqlDate("2024-10-15T14:00:00Z").date,
      time: formatMySqlDate("2024-10-15T14:00:00Z").time,
    },
  ];
  return (
    <Table
      columns={gamesFields}
      data={data}
      size='xs'
      hoverable
      // Use caption prop for header
      caption={<span className='text-2xl font-bold'>Games</span>}
      onRowClick={(row) => router.push(`/gameStats/${row.id}`)}
      // rowClassName={getRowClassName}
      actions={(row) => (
        <Button
          onClick={(e) => {
            // FIX 2: Add e.stopPropagation()
            e.stopPropagation();
            console.log("View Details For ", e.target.value);
          }}
          className='px-3 py-0 text-white rounded hover:bg-secondary'
        >
          View Details
        </Button>
      )}
      actionsLabel='Status'
      actionsWidth='100px'
    />
  );
}

export default Games;
