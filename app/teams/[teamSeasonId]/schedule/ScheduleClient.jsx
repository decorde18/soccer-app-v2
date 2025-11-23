"use client";
import { useState, useEffect } from "react";
import { useApiData } from "@/hooks/useApiData";
import ViewWrapper from "@/components/ui/ViewWrapper";
import ScheduleGrid from "./ScheduleGrid";
import ScheduleTable from "./ScheduleTable";

export default function ScheduleClient({ teamSeasonId }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    loading: loadingHome,
    error: errorHome,
    data: homeGames,
  } = useApiData("games_summary_view", {
    filters: { home_team_season_id: teamSeasonId },
    sortBy: "start_date",
    order: "asc",
  });

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

  return (
    <ViewWrapper
      title='Schedule'
      defaultView='grid'
      loading={loading}
      error={error}
      gridView={<ScheduleGrid games={games} teamSeasonId={teamSeasonId} />}
      tableView={<ScheduleTable games={games} teamSeasonId={teamSeasonId} />}
    />
  );
}
