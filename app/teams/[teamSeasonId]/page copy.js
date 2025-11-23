// app/teams/[teamSeasonId]/page.js
"use client";

import { useParams } from "next/navigation";
import { useApiData } from "@/hooks/useApiData";
import useAuthStore from "@/stores/authStore";
import { useUserContextStore } from "@/stores/userContextStore";
import { getTeamAccess, Permissions } from "@/lib/clientPermissions";
import Link from "next/link";

export default function TeamPage() {
  const { teamSeasonId } = useParams();

  // Auth state
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const myTeams = useUserContextStore((state) => state.myTeams);

  // Calculate access (null if not logged in or no access)
  const access = isAuthenticated
    ? getTeamAccess(user, myTeams, teamSeasonId)
    : null;

  // Fetch PUBLIC data (anyone can see)
  const { data: teamData, loading: teamLoading } = useApiData(
    "all_viewable_teams_view",
    { filters: { id: teamSeasonId } }
  );

  const team = teamData;

  if (teamLoading) {
    return <div className='p-8'>Loading...</div>;
  }

  if (!team) {
    return <div className='p-8'>Team not found</div>;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* PUBLIC: Team Header - Everyone sees this */}
        <div className='bg-white rounded-lg shadow p-6 mb-6'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            {team.team_name}
          </h1>
          <p className='text-gray-600'>
            {team.club_name} • {team.season_name}
          </p>

          {/* Show login prompt if not authenticated */}
          {!isAuthenticated && (
            <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded'>
              <p className='text-blue-800'>
                <Link href='/auth/login' className='font-medium underline'>
                  Log in
                </Link>{" "}
                to view more details and manage this team.
              </p>
            </div>
          )}

          {/* Show role if authenticated */}
          {isAuthenticated && access && (
            <div className='mt-4 text-sm text-gray-600'>
              Your role: <span className='font-medium'>{access.role}</span>
            </div>
          )}
        </div>

        {/* PUBLIC: Navigation */}
        <div className='bg-white rounded-lg shadow mb-6'>
          <nav className='flex space-x-8 px-6 py-4 border-b'>
            <Link
              href={`/teams/${teamSeasonId}`}
              className='text-blue-600 font-medium border-b-2 border-blue-600 pb-4'
            >
              Overview
            </Link>
            <Link
              href={`/teams/${teamSeasonId}/schedule`}
              className='text-gray-600 hover:text-gray-900 pb-4'
            >
              Schedule
            </Link>
            <Link
              href={`/teams/${teamSeasonId}/standings`}
              className='text-gray-600 hover:text-gray-900 pb-4'
            >
              Standings
            </Link>

            {/* PROTECTED: Only show if has access */}
            {access && (
              <>
                <Link
                  href={`/teams/${teamSeasonId}/roster`}
                  className='text-gray-600 hover:text-gray-900 pb-4'
                >
                  Roster
                </Link>
                <Link
                  href={`/teams/${teamSeasonId}/stats`}
                  className='text-gray-600 hover:text-gray-900 pb-4'
                >
                  Stats
                </Link>
              </>
            )}

            {/* PROTECTED: Only coaches/admins */}
            {Permissions.canEditTeam(access) && (
              <Link
                href={`/teams/${teamSeasonId}/settings`}
                className='text-gray-600 hover:text-gray-900 pb-4'
              >
                Settings
              </Link>
            )}
          </nav>
        </div>

        {/* Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Content */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-lg shadow p-6'>
              <h2 className='text-xl font-semibold mb-4'>Recent Games</h2>
              <p className='text-gray-600'>Public game results here...</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* PROTECTED: Quick Actions - Only if has access */}
            {access && (
              <div className='bg-white rounded-lg shadow p-6'>
                <h3 className='text-lg font-semibold mb-4'>Quick Actions</h3>
                <div className='space-y-2'>
                  {Permissions.canEnterStats(access) && (
                    <Link
                      href={`/teams/${teamSeasonId}/game-stats/new`}
                      className='block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center'
                    >
                      Enter Game Stats
                    </Link>
                  )}
                  {Permissions.canManageRoster(access) && (
                    <Link
                      href={`/teams/${teamSeasonId}/roster/edit`}
                      className='block px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-center'
                    >
                      Manage Roster
                    </Link>
                  )}
                  {Permissions.canEditTeam(access) && (
                    <Link
                      href={`/teams/${teamSeasonId}/schedule/edit`}
                      className='block px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-center'
                    >
                      Edit Schedule
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* PUBLIC: Team Info */}
            <div className='bg-white rounded-lg shadow p-6'>
              <h3 className='text-lg font-semibold mb-4'>Team Info</h3>
              <dl className='space-y-2 text-sm'>
                <div>
                  <dt className='text-gray-600'>Club</dt>
                  <dd className='font-medium'>{team.club_name}</dd>
                </div>
                <div>
                  <dt className='text-gray-600'>Season</dt>
                  <dd className='font-medium'>{team.season_name}</dd>
                </div>
                <div>
                  <dt className='text-gray-600'>Age Group</dt>
                  <dd className='font-medium'>{team.age_group_name}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
