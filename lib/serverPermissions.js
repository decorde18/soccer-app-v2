// lib/serverPermissions.js
import { getPool } from "./db";

const db = { query: (sql, params) => getPool().query(sql, params) };

const ROLE_PERMISSIONS = {
  system_admin: {
    can_edit: true,
    can_enter_stats: true,
    can_manage_roster: true,
    can_view: true,
  },
  club_admin: {
    can_edit: true,
    can_enter_stats: true,
    can_manage_roster: true,
    can_view: true,
  },
  club_owner: {
    can_edit: true,
    can_enter_stats: true,
    can_manage_roster: true,
    can_view: true,
  },
  head_coach: {
    can_edit: true,
    can_enter_stats: true,
    can_manage_roster: true,
    can_view: true,
  },
  assistant_coach: {
    can_edit: true,
    can_enter_stats: true,
    can_manage_roster: false,
    can_view: true,
  },
  team_admin: {
    can_edit: true,
    can_enter_stats: false,
    can_manage_roster: true,
    can_view: true,
  },
  stats_keeper: {
    can_edit: false,
    can_enter_stats: true,
    can_manage_roster: false,
    can_view: true,
  },
  player: {
    can_edit: false,
    can_enter_stats: false,
    can_manage_roster: false,
    can_view: true,
  },
  parent: {
    can_edit: false,
    can_enter_stats: false,
    can_manage_roster: false,
    can_view: true,
  },
  fan: {
    can_edit: false,
    can_enter_stats: false,
    can_manage_roster: false,
    can_view: true,
  },
};

/**
 * Server-side: Get user's team access from database
 * Checks BOTH team_staff and user_team_seasons
 * Returns highest permission level
 */
export async function getTeamAccessFromDB(userId, teamSeasonId) {
  // 1. Get team's club_id
  const [teamInfo] = await db.query(
    `
    SELECT t.club_id
    FROM team_seasons ts
    JOIN teams t ON ts.team_id = t.id
    WHERE ts.id = ?
    LIMIT 1
  `,
    [teamSeasonId]
  );

  const clubId = teamInfo?.[0]?.club_id;
  if (!clubId) return null;

  // 2. Check club admin (highest team-level access)
  const [clubAdminRows] = await db.query(
    `
    SELECT cs.role 
    FROM club_staff cs
    WHERE cs.person_id = ? 
      AND cs.club_id = ?
      AND cs.is_active = 1
      AND cs.role IN ('club_admin', 'club_owner') 
    LIMIT 1
  `,
    [userId, clubId]
  );

  if (clubAdminRows.length > 0) {
    return {
      role: clubAdminRows[0].role,
      access_type: "club_admin",
      ...ROLE_PERMISSIONS[clubAdminRows[0].role],
    };
  }

  // 3. Check team_staff (coaches, admins - CAN EDIT)
  const [staffRows] = await db.query(
    `
    SELECT staff.role 
    FROM team_staff staff
    WHERE staff.person_id = ? 
      AND staff.team_season_id = ?
      AND staff.is_active = 1
    LIMIT 1
  `,
    [userId, teamSeasonId]
  );

  if (staffRows.length > 0) {
    const role = staffRows[0].role;
    return {
      role,
      access_type: "staff",
      ...(ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.fan),
    };
  }

  // 4. Check user_team_seasons (player, parent, fan - VIEW ONLY)
  const [memberRows] = await db.query(
    `
    SELECT uts.role
    FROM user_team_seasons uts
    WHERE uts.person_id = ?
      AND uts.team_season_id = ?
    LIMIT 1
  `,
    [userId, teamSeasonId]
  );

  if (memberRows.length > 0) {
    const role = memberRows[0].role;
    return {
      role,
      access_type: role, // 'player', 'parent', or 'fan'
      ...(ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.fan),
    };
  }

  return null; // No access
}

export const Permissions = {
  canEditTeam: (access) => access?.can_edit || false,
  canEnterStats: (access) => access?.can_enter_stats || false,
  canManageRoster: (access) => access?.can_manage_roster || false,
  canViewTeam: (access) => access?.can_view || false,
};
