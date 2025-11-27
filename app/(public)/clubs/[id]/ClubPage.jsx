"use client";
import TableContainer from "@/components/ui/TableContainer";
import { useApiData } from "@/hooks/useApiData";
import { teamsFields } from "@/lib/pageColumns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function ClubPage({
  id,
  searchParams,
  clubs: externalData = null,
  actions = null,
}) {
  const router = useRouter();

  // Fetch club data
  const {
    loading: clubLoading,
    error: clubError,
    data: clubData,
  } = useApiData("clubs", { filters: { id } });

  // Fetch teams data
  const {
    loading: teamsLoading,
    error: teamsError,
    data: fetchedTeamsData,
  } = useApiData("v_teams_all", { filters: { club_id: id } });

  const [teams, setTeams] = useState(externalData);
  const [club, setClub] = useState(null);

  useEffect(() => {
    setTeams(externalData || fetchedTeamsData || []);
  }, [fetchedTeamsData, externalData]);

  useEffect(() => {
    if (clubData) {
      setClub(clubData);
    }
  }, [clubData]);

  // Combined loading state
  const loading = clubLoading || teamsLoading;

  // Combined error state
  const error = clubError || teamsError;

  if (loading) return <div className='p-p-md'>Loading club and teams...</div>;
  if (error)
    return (
      <div className='p-p-md'>
        Error loading data: {clubError || teamsError}
      </div>
    );

  return (
    <div className='p-p-md'>
      {club ? (
        <h1>
          {club.name} ({club.location})
        </h1>
      ) : (
        <h1>"Club"</h1>
      )}
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
    </div>
  );
}

export default ClubPage;
