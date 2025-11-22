// lib/navigationUtils.js

import { getTeamAccess, Permissions } from "./clientPermissions";

/**
 * Build navigation items for a specific team based on user's permissions
 * @param {Object} team - Team object from myTeams
 * @param {Object} user - User object from authStore
 * @param {Array} myTeams - All teams user has access to
 * @returns {Array} - Navigation items with paths and permissions
 */
export function buildTeamNavigation(team, user, myTeams) {
  const access = getTeamAccess(user, myTeams, team.team_season_id);

  const nav = [
    {
      id: "overview",
      label: "Overview",
      icon: "🏠",
      path: `/teams/${team.team_season_id}`,
      public: true,
    },
    {
      id: "roster",
      label: "Roster",
      icon: "👥",
      path: `/teams/${team.team_season_id}/roster`,
      public: true,
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: "📅",
      path: `/teams/${team.team_season_id}/schedule`,
      public: true,
    },
    {
      id: "stats",
      label: "Statistics",
      icon: "📊",
      path: `/teams/${team.team_season_id}/stats`,
      public: true,
    },
  ];

  // Add divider before management routes
  if (
    access &&
    (access.can_manage_roster || access.can_enter_stats || access.can_edit)
  ) {
    nav.push({ id: "divider-1", type: "divider" });
  }

  // Add management routes based on permissions
  if (access?.can_manage_roster) {
    nav.push({
      id: "manage-roster",
      label: "Manage Roster",
      icon: "⚙️",
      path: `/teams/${team.team_season_id}/manage/roster`,
      badge: "Admin",
      permission: "can_manage_roster",
    });
  }

  if (access?.can_enter_stats) {
    nav.push({
      id: "enter-stats",
      label: "Enter Stats",
      icon: "✏️",
      path: `/teams/${team.team_season_id}/manage/stats`,
      badge: "Staff",
      permission: "can_enter_stats",
    });
  }

  if (access?.can_edit) {
    nav.push({
      id: "team-settings",
      label: "Team Settings",
      icon: "⚙️",
      path: `/teams/${team.team_season_id}/settings`,
      badge: "Admin",
      permission: "can_edit",
    });
  }

  return nav;
}

/**
 * Group teams by club for hierarchical navigation
 * @param {Array} myTeams - All teams user has access to
 * @returns {Object} - Teams grouped by club_id
 */
export function groupTeamsByClub(myTeams = []) {
  return myTeams.reduce((acc, team) => {
    if (!acc[team.club_id]) {
      acc[team.club_id] = {
        club_id: team.club_id,
        club_name: team.club_name,
        teams: [],
      };
    }
    acc[team.club_id].teams.push(team);
    return acc;
  }, {});
}

/**
 * Get public navigation items (available to all users)
 * @returns {Array} - Public navigation items
 */
export function getPublicNavigation() {
  return [
    {
      id: "home",
      label: "Home",
      icon: "🏠",
      path: "/",
    },
    //TODO Decide if I want these (only reason I see them being effective is if I combine multiple teams etc)
    // {
    //   id: "standings",
    //   label: "Standings",
    //   icon: "📊",
    //   path: "/standings",
    // },
    // {
    //   id: "schedule",
    //   label: "Schedule",
    //   icon: "📅",
    //   path: "/schedule",
    // },
  ];
}

/**
 * Get system admin navigation items
 * @param {Object} user - User object
 * @returns {Array} - Admin navigation items (empty if not system admin)
 */
export function getSystemAdminNavigation(user) {
  if (!Permissions.isSystemAdmin(user)) {
    return [];
  }

  return [
    {
      id: "admin-panel",
      label: "Admin Panel",
      icon: "🛠️",
      path: "/admin",
    },
    {
      id: "manage-clubs",
      label: "Manage Clubs",
      icon: "🏫",
      path: "/admin/clubs",
    },
    {
      id: "manage-users",
      label: "Manage Users",
      icon: "👥",
      path: "/admin/users",
    },
  ];
}

/**
 * Get club admin navigation items
 * @param {Array} myClubs - Clubs where user is admin
 * @returns {Array} - Club admin navigation items
 */
export function getClubAdminNavigation(myClubs = []) {
  if (!myClubs.length) {
    return [];
  }

  return myClubs.map((club) => ({
    id: `club-${club.club_id}`,
    label: `${club.club_name} Admin`,
    icon: "🏫",
    path: `/clubs/${club.club_id}/admin`,
    badge: "Club Admin",
  }));
}

/**
 * Build complete navigation structure for a user
 * @param {Object} user - User object from authStore
 * @param {Array} myTeams - All teams user has access to
 * @param {Array} myClubs - Clubs where user is admin
 * @returns {Object} - Complete navigation structure with sections
 */
export function buildCompleteNavigation(user, myTeams = [], myClubs = []) {
  const sections = [];

  // Public navigation (always visible)
  sections.push({
    id: "explore",
    label: "Explore",
    items: getPublicNavigation(),
  });

  // User's teams (if logged in and has teams)
  if (user && myTeams.length > 0) {
    const teamsByClub = groupTeamsByClub(myTeams);

    sections.push({
      id: "my-teams",
      label: "My Teams",
      type: "hierarchical",
      clubs: Object.values(teamsByClub).map((club) => ({
        ...club,
        teams: club.teams.map((team) => ({
          ...team,
          navigation: buildTeamNavigation(team, user, myTeams),
        })),
      })),
    });
  }

  // Club admin navigation
  //TODO Decide if I want this. It takes up a lot of space
  // const clubAdminNav = getClubAdminNavigation(myClubs);
  // if (clubAdminNav.length > 0) {
  //   sections.push({
  //     id: "club-admin",
  //     label: "Club Administration",
  //     items: clubAdminNav,
  //   });
  // }

  // System admin navigation
  const systemAdminNav = getSystemAdminNavigation(user);
  if (systemAdminNav.length > 0) {
    sections.push({
      id: "system-admin",
      label: "System Administration",
      items: systemAdminNav,
    });
  }

  return sections;
}

/**
 * Get role badge display info
 * @param {string} role - Role name from team access
 * @returns {Object} - Badge text and color
 */
export function getRoleBadgeInfo(role) {
  const badges = {
    system_admin: { text: "System", color: "bg-red-500/20 text-red-200" },
    club_admin: {
      text: "Club Admin",
      color: "bg-purple-500/20 text-purple-200",
    },
    club_owner: { text: "Owner", color: "bg-purple-500/20 text-purple-200" },
    head_coach: { text: "Coach", color: "bg-blue-500/20 text-blue-200" },
    assistant_coach: {
      text: "Asst Coach",
      color: "bg-blue-500/20 text-blue-200",
    },
    team_admin: { text: "Admin", color: "bg-green-500/20 text-green-200" },
    stats_keeper: { text: "Stats", color: "bg-yellow-500/20 text-yellow-200" },
    player: { text: "Player", color: "bg-gray-500/20 text-gray-200" },
    parent: { text: "Parent", color: "bg-pink-500/20 text-pink-200" },
    fan: { text: "Fan", color: "bg-gray-500/20 text-gray-200" },
  };

  return badges[role] || { text: role, color: "bg-gray-500/20 text-gray-200" };
}

/**
 * Format role name for display
 * @param {string} role - Role name
 * @returns {string} - Formatted role name
 */
export function formatRoleName(role) {
  if (!role) return "Fan";
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
