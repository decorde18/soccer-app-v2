"use client";

import { useParams, useRouter } from "next/navigation";
import { useApiData } from "@/hooks/useApiData";
import useAuthStore from "@/stores/authStore";
import { useUserContextStore } from "@/stores/userContextStore";
// FIX: Using the client-only permissions helper to prevent Node.js module import error
import { getTeamAccess, Permissions } from "@/lib/clientPermissions";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const teamSeasonId = parseInt(params.teamId);

  // Get auth data from stores
  const { user, isAuthenticated } = useAuthStore();
  const { myTeams, loadUserContext } = useUserContextStore();
  const [isAccessChecked, setIsAccessChecked] = useState(false);

  // Load user context if authenticated
  useEffect(() => {
    if (user && !myTeams.length) {
      loadUserContext(user.userId); // Use userId from the user object
    }
  }, [user, loadUserContext, myTeams.length]);

  // Calculate user's access to this team using client-side data
  const access = getTeamAccess(user, myTeams, teamSeasonId);

  // Set access check flag once we have data to ensure we don't flash content
  useEffect(() => {
    if (user && myTeams.length) {
      setIsAccessChecked(true);
    }
    // Handle unauthenticated state immediately if not logged in
    if (!isAuthenticated) {
      setIsAccessChecked(true);
    }
  }, [user, myTeams.length, isAuthenticated]);

  // Fetch team data - always public for viewing the page content
  const {
    loading: teamLoading,
    error: teamError,
    data: teamData,
  } = useApiData("all_viewable_teams_view", {
    filters: { id: teamSeasonId },
    skipInitialFetch: false, // Always fetch the team data
  });

  // Handle errors or missing team
  if (teamError) {
    return (
      <div className='p-4 text-red-600'>
        Error loading team: {teamError.message}
      </div>
    );
  }

  // Wait for context to load AND team data to load before checking access/rendering
  if (teamLoading || (isAuthenticated && !isAccessChecked)) {
    return (
      <div className='p-4 text-center'>Loading team and user context...</div>
    );
  }

  // After all loading is done, check if we have team data
  const team = teamData;

  if (!team) {
    return (
      <div className='p-4 text-center text-lg text-gray-500'>
        Team not found or is inactive.
      </div>
    );
  }

  // Simplified logic for a team homepage - everyone can view the public info.
  // The actual check for restricted pages (like Roster Management) should happen
  // in those components using the `access` object.
  const canView = Permissions.canViewTeam(access) || !isAuthenticated; // Assume public view if not authenticated

  if (isAuthenticated && !canView && isAccessChecked) {
    return (
      <div className='p-8 max-w-lg mx-auto bg-white rounded-xl shadow-lg mt-10 text-center'>
        <h1 className='text-2xl font-bold text-red-600 mb-4'>Access Denied</h1>
        <p className='text-gray-700 mb-6'>
          You do not have permission to view this team&apos;s details.
        </p>
        <Link href='/dashboard' className='text-blue-500 hover:text-blue-700'>
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // --- Render Team Page Content ---
  const standings = team.standings?.[0] || null;

  return (
    <div className='p-4 sm:p-6 lg:p-8'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='flex justify-between items-center mb-6 border-b pb-4'>
          <h1 className='text-3xl font-extrabold text-gray-900 flex items-center'>
            {team.team_name}
            <span className='ml-3 inline-flex items-center rounded-full bg-indigo-100 px-3 py-0.5 text-sm font-medium text-indigo-800'>
              {team.season_name}
            </span>
          </h1>
          {Permissions.canEditTeam(access) && (
            <Link
              href={`/teams/${teamSeasonId}/manage`}
              className='px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-150'
            >
              Manage Team
            </Link>
          )}
        </div>

        {/* Team Details */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Info */}
          <div className='lg:col-span-2 bg-white p-6 rounded-xl shadow-md'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4 border-b pb-2'>
              Team Overview
            </h2>
            <div className='space-y-3 text-gray-700'>
              <p>
                <strong>Club:</strong> {team.club_name}
              </p>
              <p>
                <strong>Age Group:</strong> {team.age_group_name} ({team.gender}
                )
              </p>
              <p>
                <strong>Current Access Role:</strong>{" "}
                {access?.role || "Public Fan"}
              </p>
            </div>
          </div>

          {/* Standings Card (Conditional) */}
          <div className='lg:col-span-1'>
            {standings && (
              <div className='bg-white p-6 rounded-xl shadow-md border-t-4 border-indigo-500'>
                <h3 className='text-lg font-bold text-gray-800 mb-4'>
                  League Standings
                </h3>
                <div className='divide-y divide-gray-200'>
                  {standings.league_name && (
                    <div className='pb-3'>
                      <span className='text-sm text-gray-500'>League</span>
                      <p className='text-base font-medium text-gray-900'>
                        {standings.league_name}
                      </p>
                    </div>
                  )}
                  <div className='flex justify-between items-center py-3'>
                    <span className='text-muted'>Position</span>
                    <span className='text-2xl font-bold text-indigo-600'>
                      {standings.position}
                    </span>
                  </div>
                  <div className='grid grid-cols-3 gap-2 text-center pt-3 border-t border-border'>
                    <div>
                      <div className='text-xs text-muted mb-1'>W</div>
                      <div className='text-lg font-semibold text-gray-900'>
                        {standings.wins || 0}
                      </div>
                    </div>
                    <div>
                      <div className='text-xs text-muted mb-1'>D</div>
                      <div className='text-lg font-semibold text-gray-900'>
                        {standings.draws || 0}
                      </div>
                    </div>
                    <div>
                      <div className='text-xs text-muted mb-1'>L</div>
                      <div className='text-lg font-semibold text-gray-900'>
                        {standings.losses || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Roster & Schedule - Placeholders */}
        <div className='mt-8 grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-white p-6 rounded-xl shadow-md'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>
              Team Roster
            </h2>
            <p className='text-gray-600'>
              View and manage the current player roster.
            </p>
            <Link
              href={`/teams/${teamSeasonId}/roster`}
              className='mt-4 inline-block text-indigo-600 hover:text-indigo-800 font-medium'
            >
              Go to Roster &rarr;
            </Link>
          </div>
          <div className='bg-white p-6 rounded-xl shadow-md'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>
              Schedule & Results
            </h2>
            <p className='text-gray-600'>
              Check upcoming games and past results.
            </p>
            <Link
              href={`/teams/${teamSeasonId}/schedule`}
              className='mt-4 inline-block text-indigo-600 hover:text-indigo-800 font-medium'
            >
              View Schedule &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
