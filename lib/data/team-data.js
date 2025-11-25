// ============================================
// lib/data/team-data.js - Higher-level data aggregation
// ============================================
import "server-only";
import {
  getTeamStandings,
  getRecentGames,
  getUpcomingGames,
  getStatLeaders,
} from "@/lib/queries/teams";

/**
 * Get all dashboard data for a team in one call
 * This runs queries in parallel for better performance
 */
export async function getTeamDashboardData(teamSeasonId) {
  const [standings, recentGames, upcomingGames, statLeaders] =
    await Promise.all([
      getTeamStandings(teamSeasonId),
      getRecentGames(teamSeasonId, 5),
      getUpcomingGames(teamSeasonId, 3),
      getStatLeaders(teamSeasonId),
    ]);

  return {
    standings: Array.isArray(standings) ? standings : [standings],
    recentGames,
    upcomingGames,
    statLeaders,
  };
}

/**
 * Preload function for parallel fetching
 * Call this early to start fetching while doing other work
 */
export function preloadTeamDashboardData(teamSeasonId) {
  void getTeamDashboardData(teamSeasonId);
}
