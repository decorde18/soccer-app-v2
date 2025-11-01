// src/lib/data/nav-links.js

/**
 * Defines the navigation links and the roles/statuses required to see them.
 * Status: 'public' (logged out) or 'user' (logged in)
 * Roles: 'Guest', 'User', 'Admin'
 */

// 🏫 - School building (works great for high schools)
// 🏛️ - Classical building (more formal/institutional)
// 🏢 - Office building (generic organization)
// ⚽ - Soccer ball (sport-specific)
// 🛡️ - Shield (club badge feel)

// For Games:

// ⚽ - Soccer ball (sport-specific)
// 🏆 - Trophy (competition focus)
// 📅 - Calendar (schedule focus)
// ⚡ - Lightning bolt (action/energy)
// 🎯 - Target (goal-focused)
// 👤 - Single person (simple, clean)
// ⚽👤 - Soccer ball + person (sport-specific player)
// 🏃 - Running person (athletic/active)
// 👥 - Multiple people (roster feel)
// #️⃣ - Number sign (jersey number association)

// For Teams:

// 👥 - Group of people (team unity)
// 🛡️ - Shield (team badge/crest)
// ⚽ - Soccer ball (sport-specific)
// 👕 - Jersey/shirt (uniform/team identity)
// 🏆 - Trophy (competitive team)
export const navItems = [
  /* ----------------ALL---------------------------*/
  {
    label: "Dashboard",
    id: "/dashboard",
    icon: "🏠",
    requiredStatus: ["public", "user"], // Visible to everyone
    requiredRoles: ["Guest", "User", "Admin"],
    showOnUrl: "all",
  },
  /* ----------------MAIN---------------------------*/
  {
    label: "Calendar",
    id: "/calendar",
    icon: "📅",
    requiredStatus: ["public", "user"], // Visible to everyone
    requiredRoles: ["Guest", "User", "Admin"],
  },
  {
    label: "Schedule",
    id: "/schedule",
    icon: "⏱️",
    requiredStatus: ["user"], // Only visible when logged in
    requiredRoles: ["User", "Admin"],
  },
  {
    label: "Players",
    id: "/players",
    icon: "👥",
    requiredStatus: ["user"], // Only visible when logged in
    requiredRoles: ["User", "Admin"],
  },
  {
    label: "Games",
    id: "/games",
    icon: "⚽",
    requiredStatus: ["user"], // Only visible when logged in
    requiredRoles: ["User", "Admin"],
  },
  {
    label: "Clubs",
    id: "/clubs",
    icon: "🛡️",
    requiredStatus: ["user"],
    requiredRoles: ["User", "Admin"],
  },
  // {
  //   label: "Settings",
  //   id: "/settings",
  //   icon: "⚙️",
  //   requiredStatus: ["user"],
  //   requiredRoles: ["User", "Admin"],
  // },
  {
    label: "Config",
    id: "/admin/config",
    icon: "🛠️",
    requiredStatus: ["user"],
    requiredRoles: ["Admin"], // Only visible to Admin role
  },
  /* ----------------LIVE GAME---------------------------*/
  {
    label: "Game Settings",
    id: "/gameStats/setup",
    icon: "⚙️",
    requiredStatus: ["user"],
    requiredRoles: ["User", "Admin"],
    showOnUrl: "/gameStats",
  },
  /* ----------------ADMIN---------------------------*/
  {
    label: "people",
    id: "/admin/people",
    icon: "🛠️",
    requiredStatus: ["user"],
    requiredRoles: ["Admin"], // Only visible to Admin role

    showOnUrl: "/admin",
  },
  {
    label: "clubs",
    id: "/admin/clubs",
    icon: "🛠️",
    requiredStatus: ["user"],
    requiredRoles: ["Admin"], // Only visible to Admin role

    showOnUrl: "/admin",
  },
  {
    label: "teams",
    id: "/admin/teams",
    icon: "🛠️",
    requiredStatus: ["user"],
    requiredRoles: ["Admin"], // Only visible to Admin role

    showOnUrl: "/admin",
  },
  {
    label: "leagues",
    id: "/admin/leagues",
    icon: "🛠️",
    requiredStatus: ["user"],
    requiredRoles: ["Admin"], // Only visible to Admin role

    showOnUrl: "/admin",
  },
  {
    label: "seasons",
    id: "/admin/seasons",
    icon: "🛠️",
    requiredStatus: ["user"],
    requiredRoles: ["Admin"], // Only visible to Admin role

    showOnUrl: "/admin",
  },
  {
    label: "events",
    id: "/admin/events",
    icon: "🛠️",
    requiredStatus: ["user"],
    requiredRoles: ["Admin"], // Only visible to Admin role

    showOnUrl: "/admin",
  },
];
