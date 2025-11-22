"use client";
import { use, useState, useEffect } from "react";
import { apiFetch } from "@/app/api/fetcher";
import { useApiData } from "@/hooks/useApiData";

export default function SchedulePage({ teamSeasonId }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    loading: loadingHome,
    error: errorHome,
    data: homeGames,
  } = useApiData("games_view", {
    filters: { home_team_season_id: teamSeasonId },
    sortBy: "start_date", // Column to sort by
    order: "asc", // Direction (optional)
  });
  const {
    loading: loadingAway,
    error: errorAway,
    data: awayGames,
  } = useApiData("games_view", {
    filters: { away_team_season_id: teamSeasonId },
    sortBy: "start_date", // Column to sort by
    order: "asc", // Direction (optional)
  });
  const {
    loading: loadingLeagueTeams,
    error: errorLeagueTeams,
    data: leagueTeamsGames,
  } = useApiData("View_leagueTeams", {
    filters: { team_id: teamSeasonId },
  });

  useEffect(() => {
    loadingHome || loadingAway ? setLoading(true) : setLoading(false);
    errorHome || errorAway ? setError(errorHome || errorAway) : setError(null);
    const allGames = [...homeGames, ...awayGames];
    const uniqueGames = Array.from(
      new Map(allGames.map((g) => [g.game_id, g])).values()
    );
    uniqueGames.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    setGames(uniqueGames);
  }, [
    teamSeasonId,
    loadingHome,
    loadingAway,
    homeGames,
    awayGames,
    errorHome,
    errorAway,
  ]);

  if (loading) {
    return (
      <div className='p-8 text-center text-muted'>Loading schedule...</div>
    );
  }
  console.log(leagueTeamsGames);
  if (error) {
    return (
      <div className='p-8 text-center text-red-500'>
        Error loading schedule: {error.message}
      </div>
    );
  }

  // Helper to format time (13:00:00 -> 1:00 PM)
  const formatTime = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className='p-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-2xl font-bold mb-6'>Schedule</h1>

        {games.length === 0 ? (
          <div className='bg-white rounded-lg shadow p-8 text-center text-gray-500'>
            No games scheduled yet.
          </div>
        ) : (
          <div className='space-y-4'>
            {games.map((game) => {
              const isHome =
                game.home_team_season_id === parseInt(teamSeasonId);
              const opponent = isHome
                ? game.away_team_name
                : game.home_team_name;
              const opponentClub = isHome
                ? game.away_club_name
                : game.home_club_name;
              const isPast =
                new Date(game.start_date) < new Date().setHours(0, 0, 0, 0);

              // Placeholder for scores (not in your data yet)
              const hasScore =
                game.score_us !== undefined &&
                game.score_them !== undefined &&
                game.score_us !== null &&
                game.score_them !== null;

              return (
                <div
                  key={game.game_id}
                  className='bg-white rounded-lg shadow p-6 hover:shadow-md transition'
                >
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <div className='flex items-center space-x-3 mb-2'>
                        <span
                          className={`px-3 py-1 text-sm rounded font-medium ${
                            isHome
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {isHome ? "HOME" : "AWAY"}
                        </span>
                        <span className='text-gray-600'>
                          {new Date(game.start_date).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                        {game.start_time && (
                          <span className='text-gray-600'>
                            • {formatTime(game.start_time)}{" "}
                            {game.timezone_label}
                          </span>
                        )}
                      </div>

                      <h3 className='text-xl font-semibold mb-1'>
                        vs {opponent}
                      </h3>

                      {opponentClub && opponentClub !== opponent && (
                        <p className='text-gray-500 text-sm mb-1'>
                          {opponentClub}
                        </p>
                      )}

                      {game.location_name && (
                        <p className='text-gray-600 text-sm'>
                          📍 {game.location_name}
                          {game.sulocation_name && ` - ${game.sulocation_name}`}
                        </p>
                      )}
                    </div>

                    {/* Score Display / Status */}
                    <div className='text-right ml-4'>
                      {hasScore ? (
                        <div>
                          <div className='text-3xl font-bold'>
                            <span
                              className={
                                game.score_us > game.score_them
                                  ? "text-green-600"
                                  : game.score_us < game.score_them
                                  ? "text-red-600"
                                  : "text-gray-900"
                              }
                            >
                              {game.score_us}
                            </span>
                            <span className='text-gray-400 mx-2'>-</span>
                            <span className='text-gray-900'>
                              {game.score_them}
                            </span>
                          </div>
                          <div className='text-xs text-gray-500 mt-1'>
                            {game.score_us > game.score_them
                              ? "Win"
                              : game.score_us < game.score_them
                              ? "Loss"
                              : "Draw"}
                          </div>
                        </div>
                      ) : (
                        <span
                          className={`text-sm font-medium px-2 py-1 rounded ${
                            game.status === "scheduled"
                              ? "text-primary bg-blue-50"
                              : game.status === "canceled"
                              ? "text-accent bg-red-50"
                              : "text-muted bg-gray-50"
                          }`}
                        >
                          {game.status?.charAt(0).toUpperCase() +
                            game.status?.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
