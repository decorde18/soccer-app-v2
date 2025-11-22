// app/teams/[teamSeasonId]/manage/schedule/page.jsx
import { getCurrentUser, checkServerTeamAccess } from "@/lib/serverAuth";
import { Permissions } from "@/lib/serverPermissions";
import { redirect } from "next/navigation";
import { getPool } from "@/lib/db";
import Link from "next/link";

export default async function ManageSchedulePage({ params }) {
  const { teamSeasonId } = await params;

  // Get user and verify permissions
  const user = await getCurrentUser();
  const access = await checkServerTeamAccess(teamSeasonId, user);

  // Double-check permissions (layout should already handle this)
  if (!access || !Permissions.canEditTeam(access)) {
    redirect(`/teams/${teamSeasonId}?error=insufficient_permissions`);
  }

  // Fetch games
  const db = getPool();
  const games = [
    {
      id: 201,
      game_date: "2025-03-15",
      game_time: "14:00:00",
      location: "Home Field",
      opponent: "Wolves SC",
      home_away: "Home",
      score_us: 2,
      score_them: 1,
      status: "Completed",
    },
    {
      id: 202,
      game_date: "2025-03-10",
      game_time: "18:00:00",
      location: "Rangers FC Complex",
      opponent: "Rangers FC",
      home_away: "Away",
      score_us: 0,
      score_them: 0,
      status: "Completed",
    },
    {
      id: 203,
      game_date: "2025-03-07",
      game_time: "16:30:00",
      location: "Eagle Stadium",
      opponent: "Eagle United",
      home_away: "Away",
      score_us: 1,
      score_them: 3,
      status: "Completed",
    },
    {
      id: 204,
      game_date: "2025-03-02",
      game_time: "13:00:00",
      location: "Home Field",
      opponent: "Falcons Elite",
      home_away: "Home",
      score_us: 3,
      score_them: 2,
      status: "Completed",
    },
    {
      id: 205,
      game_date: "2025-02-25",
      game_time: "17:00:00",
      location: "Lions Turf Center",
      opponent: "Lions SC",
      home_away: "Away",
      score_us: null,
      score_them: null,
      status: "Scheduled",
    },
    {
      id: 206,
      game_date: "2025-02-20",
      game_time: "18:30:00",
      location: "Home Field",
      opponent: "Storm Academy",
      home_away: "Home",
      score_us: 2,
      score_them: 2,
      status: "Completed",
    },
    {
      id: 207,
      game_date: "2025-02-12",
      game_time: "19:00:00",
      location: "Tigers SC Park",
      opponent: "Tigers SC",
      home_away: "Away",
      score_us: 1,
      score_them: 0,
      status: "Completed",
    },
    {
      id: 208,
      game_date: "2025-02-08",
      game_time: "12:00:00",
      location: "Home Field",
      opponent: "Sharks Academy",
      home_away: "Home",
      score_us: 4,
      score_them: 1,
      status: "Completed",
    },
    {
      id: 209,
      game_date: "2025-02-01",
      game_time: "15:00:00",
      location: "Panthers Training Ground",
      opponent: "Panthers FC",
      home_away: "Away",
      score_us: 0,
      score_them: 2,
      status: "Completed",
    },
    {
      id: 210,
      game_date: "2025-01-25",
      game_time: "14:30:00",
      location: "Home Field",
      opponent: "Rebels SC",
      home_away: "Home",
      score_us: null,
      score_them: null,
      status: "Canceled",
    },
  ];

  // const [games] = await db.query(
  //   `SELECT
  //     g.id,
  //     g.game_date,
  //     g.game_time,
  //     g.location,
  //     g.opponent,
  //     g.home_away,
  //     g.score_us,
  //     g.score_them,
  //     g.status
  //   FROM games g
  //   WHERE g.team_season_id = ?
  //   ORDER BY g.game_date DESC, g.game_time DESC`,
  //   [teamSeasonId]
  // );

  return (
    <div className='p-8'>
      <div className='max-w-6xl mx-auto'>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h1 className='text-2xl font-bold'>Manage Schedule</h1>
            <p className='text-gray-600 mt-1'>
              Add, edit, or remove games from the schedule
            </p>
          </div>
          <Link
            href={`/teams/${teamSeasonId}/manage/schedule/add`}
            className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
          >
            + Add Game
          </Link>
        </div>

        {games.length === 0 ? (
          <div className='bg-white rounded-lg shadow p-8 text-center'>
            <p className='text-gray-500 mb-4'>No games scheduled yet.</p>
            <Link
              href={`/teams/${teamSeasonId}/manage/schedule/add`}
              className='inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
            >
              Add First Game
            </Link>
          </div>
        ) : (
          <div className='bg-white rounded-lg shadow overflow-hidden'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Date
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Time
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Opponent
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Location
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Result
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {games.map((game) => (
                  <tr key={game.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      {new Date(game.game_date).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      {game.game_time || "-"}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>
                        {game.opponent}
                      </div>
                      <div className='text-xs text-gray-500'>
                        {game.home_away === "home" ? "Home" : "Away"}
                      </div>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500'>
                      {game.location || "-"}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      {game.score_us !== null && game.score_them !== null ? (
                        <span
                          className={`font-medium ${
                            game.score_us > game.score_them
                              ? "text-green-600"
                              : game.score_us < game.score_them
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {game.score_us} - {game.score_them}
                        </span>
                      ) : (
                        <span className='text-gray-400'>Not played</span>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      <div className='flex space-x-2'>
                        <Link
                          href={`/teams/${teamSeasonId}/manage/schedule/${game.id}/edit`}
                          className='text-blue-600 hover:text-blue-900'
                        >
                          Edit
                        </Link>
                        <span className='text-gray-300'>|</span>
                        <button className='text-red-600 hover:text-red-900'>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
