"use client";

import TableContainer from "@/components/ui/TableContainer";
import { useApiData } from "@/hooks/useApiData";
import { teamsFields } from "@/lib/pageColumns";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

function TeamsTable({ teams: externalData = null, actions = null }) {
  const router = useRouter();
  const { loading, error, data: fetchedData } = useApiData("teams_view");
  const [teams, setTeams] = useState(externalData);

  useEffect(() => {
    setTeams(externalData || fetchedData || []);
  }, [fetchedData]);

  if (loading) return <div>Loading teams...</div>;
  if (error) return <div>Error loading teams</div>;

  return (
    <TableContainer
      columns={teamsFields}
      data={teams}
      enableFiltering={true}
      filterPlaceholder='Search teams...'
      filterKeys={teamsFields
        .filter((col) => col?.filterable !== false)
        .map((col) => col.name)}
      enableSorting={true}
      defaultSortKey='name'
      enablePagination={true}
      pageSize={10}
      pageSizeOptions={[5, 10, 25]}
      size='md'
      onRowClick={(row) => router.push(`/teams/${row.id}`)}
      actionsWidth='100px'
      actions={actions}
    />
  );
}

export default TeamsTable;
