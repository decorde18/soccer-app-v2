// ============================================
// lib/queries/teams.js - Raw database queries
// ============================================
import "server-only"; // Ensures this only runs on server
import { cache } from "react";
import { getPool } from "@/lib/db";

const pool = getPool();

/**
 * Get team standings for a team season
 * Cached per request - multiple calls with same ID return cached result
 */
export const getTeamStandings = cache(async (teamSeasonId) => {
  const [rows] = await pool.query(
    `SELECT * FROM v_standings WHERE team_season_id = ?`,
    [teamSeasonId]
  );
  return rows;
});
export const getTeamSchedule = cache(
  async (teamSeasonId, { type = "all", limit = null } = {}) => {
    let dateClause = "";
    let orderBy = "start_date ASC";

    if (type === "upcoming") {
      dateClause = "AND start_date >= CURDATE()";
      orderBy = "start_date ASC";
    } else if (type === "recent") {
      dateClause = "AND start_date < CURDATE()";
      orderBy = "start_date DESC";
    }

    // Build LIMIT dynamically
    const limitClause = limit ? "LIMIT ?" : "";

    const params = [teamSeasonId, teamSeasonId];
    if (limit) params.push(limit);

    const [rows] = await pool.query(
      `
    SELECT *
    FROM v_games_summary
    WHERE (home_team_season_id = ? OR away_team_season_id = ?)
    ${dateClause}
    ORDER BY ${orderBy}
    ${limitClause}
    `,
      params
    );

    return rows;
  }
);

/**
 * Get recent games for a team
 */

export const getRecentGames = cache((teamSeasonId, limit = 5) => {
  return getTeamSchedule(teamSeasonId, { type: "recent", limit });
});

/**
 * Get upcoming games for a team
 */
export const getUpcomingGames = cache(async (teamSeasonId, limit = 3) => {
  return getTeamSchedule(teamSeasonId, { type: "upcoming", limit });
});

/**
 * Get all games for a team (for schedule page)
 */
export const getAllGames = cache(async (teamSeasonId) => {
  const [rows] = await pool.query(
    `SELECT * FROM v_games_summary 
     WHERE home_team_season_id = ? OR away_team_season_id = ?
     ORDER BY start_date ASC`,
    [teamSeasonId, teamSeasonId]
  );
  return rows;
});

/**
 * Get stat leaders for a team
 */
export const getStatLeaders = cache(async (teamSeasonId) => {
  const [rows] = await pool.query(
    `SELECT * FROM v_stat_leaders WHERE team_season_id = ?`,
    [teamSeasonId]
  );
  return rows[0] || null;
});

export const getTeam = cache(async (teamSeasonId) => {
  const [rows] = await pool.query(`SELECT * FROM v_teams_all WHERE id = ?`, [
    teamSeasonId,
  ]);
  return rows[0] || null;
});
export const getRelatedTeams = cache(async (clubId, seasonId, teamSeasonId) => {
  const [rows] = await pool.query(
    `SELECT 
      ts.id AS team_season_id,
      t.team_name
    FROM team_seasons ts
    JOIN teams t ON ts.team_id = t.id
    WHERE t.club_id = ? 
      AND ts.season_id = ?
      AND ts.id != ?
    ORDER BY t.team_name`,
    [clubId, seasonId, teamSeasonId]
  );
  return rows;
});
/**
 * Get user's teams based on their role and permissions
 * - System Admin: ALL teams
 * - Everyone else: Uses v_user_teams (handles club admin, staff, players, etc.)
 */
export const getUserTeams = cache(async (userId, userRole = null) => {
  // System Admin gets ALL teams
  if (userRole?.systemAdmin === true || userRole?.systemAdmin === 1) {
    const [rows] = await pool.query(
      `SELECT DISTINCT
        ts.id as team_season_id,
        t.id as team_id,
        t.team_name,
        t.gender,
        c.id as club_id,
        c.name as club_name,
        c.abbreviation as club_abbreviation,
        c.location as club_location,
        c.logo_url as club_logo_url,
        c.type as club_type,
        s.id as season_id,
        s.season_name,
        s.start_date as season_start,
        s.end_date as season_end,
        s.is_current as is_current_season,
        ts.age_group,
        ag.name as age_group_name,
        ts.is_active as team_season_is_active,
        'System Admin' as user_role
      FROM team_seasons ts
      JOIN teams t ON ts.team_id = t.id
      JOIN clubs c ON t.club_id = c.id
      JOIN seasons s ON ts.season_id = s.id
      LEFT JOIN age_groups ag ON ts.age_group = ag.id
      WHERE ts.is_active = 1 AND t.is_active = 1 AND c.is_active = 1
      ORDER BY s.is_current DESC, s.start_date DESC, c.name, t.team_name`
    );
    return rows;
  }

  // Everyone else - use the comprehensive view
  const [rows] = await pool.query(
    `SELECT * FROM v_user_teams WHERE person_id = ?`,
    [userId]
  );
  return rows;
});

export const getAllPlayers = cache(async (teamSeasonId) => {
  const [rows] = await pool.query(
    `SELECT * FROM v_players WHERE team_season_id = ? ORDER BY last_name, first_name`,
    [teamSeasonId]
  );
  return rows;
});
