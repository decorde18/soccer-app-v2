"use client";
import { useEffect, useState } from "react";
import { useApiData } from "@/hooks/useApiData";

export function useTeamSeasonGames(teamSeasonId) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch home games
  const {
    loading: loadingHome,
    error: errorHome,
    data: homeGames,
  } = useApiData("games_summary_view", {
    filters: { home_team_season_id: teamSeasonId },
    sortBy: "start_date",
    order: "asc",
  });

  // Fetch away games
  const {
    loading: loadingAway,
    error: errorAway,
    data: awayGames,
  } = useApiData("games_summary_view", {
    filters: { away_team_season_id: teamSeasonId },
    sortBy: "start_date",
    order: "asc",
  });

  useEffect(() => {
    // loading / error
    const isLoading = loadingHome || loadingAway;
    const hasError = errorHome || errorAway;

    setLoading(isLoading);
    setError(hasError || null);

    if (isLoading || hasError) return;

    // merge home + away
    const allGames = [...homeGames, ...awayGames];

    // dedupe by game_id
    const merged = Array.from(
      new Map(allGames.map((g) => [g.game_id, g])).values()
    );

    // sort chronologically
    merged.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    setGames(merged);
  }, [
    teamSeasonId,
    loadingHome,
    loadingAway,
    homeGames,
    awayGames,
    errorHome,
    errorAway,
  ]);

  return { games, loading, error, setGames };
}
