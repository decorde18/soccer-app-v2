"use client";

import TableContainer from "@/components/ui/TableContainer";
import { useApiData } from "@/hooks/useApiData";
import { clubsFields } from "@/lib/pageColumns";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

function ClubsTable({ clubs: externalData = null, actions = null }) {
  const router = useRouter();
  const { loading, error, data: fetchedData } = useApiData("clubs");
  const [clubs, setClubs] = useState(externalData);

  useEffect(() => {
    setClubs(externalData || fetchedData || []);
  }, [fetchedData]);

  if (loading) return <div>Loading clubs...</div>;
  if (error) return <div>Error loading clubs</div>;

  return (
    <TableContainer
      columns={clubsFields}
      data={clubs}
      enableFiltering={true}
      filterPlaceholder='Search clubs...'
      filterKeys={clubsFields
        .filter((col) => col?.filterable !== false)
        .map((col) => col.name)}
      enableSorting={true}
      defaultSortKey='name'
      enablePagination={true}
      pageSize={10}
      pageSizeOptions={[5, 10, 25]}
      size='md'
      onRowClick={(row) => router.push(`/clubs/${row.id}`)}
      actionsWidth='100px'
      actions={actions}
    />
  );
}

export default ClubsTable;
