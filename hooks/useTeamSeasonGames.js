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
  } = useApiData("v_games_summary", {
    filters: { home_team_season_id: teamSeasonId },
    sortBy: "start_date",
    order: "asc",
  });
  // Fetch away games
  const {
    loading: loadingAway,
    error: errorAway,
    data: awayGames,
  } = useApiData("v_games_summary", {
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

  /*
date time timezone, home/away opponent location, game type, 
*/
  /* on add/edit
   * create end_date, end_time
   * determine home_team_season_id, away_team_season_id based on home_away
   * if score game_id home_score away_score in game_scores
   * add score_only to stats_completeness in games
   * update status to completed
   * if league create league_node_id game_id in game_league_nodes
   * if overtime ...
   */

  const addGame = async (gameData) => {
    console.log("you did it", gameData);
  };
  const updateGame = async (gameData) => {
    console.log("you did it", gameData);
  };
  const deleteGame = async (gameData) => {
    console.log("you did it", gameData);
  };
  return { games, loading, error, setGames, addGame, updateGame, deleteGame };
}
