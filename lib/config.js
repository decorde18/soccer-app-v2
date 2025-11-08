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

export const navItems = {
  admin: [{ label: "Admin Panel", id: "/admin", icon: "🛠️" }],
  coach: [
    { label: "Coach Corner", id: "/coach", icon: "🎓" },
    { label: "Roster Admin", id: "/players", icon: "👥" },
    { label: "Game Admin", id: "/games", icon: "⚽" },
    {
      label: "Game Stats Entry",
      id: "/gameStats/setup",
      icon: "⚙️",
    },
  ],
  player: [
    { label: "Player Area", id: "/player", icon: "⚽" },
    {
      label: "Calendar",
      id: "/calendar",
      icon: "📅",
    },
  ],
  parent: [
    { label: "Parent Resources", id: "/parent", icon: "🧑‍🍼" },
    {
      label: "Calendar",
      id: "/calendar",
      icon: "📅",
    },
  ],
  user: [{ label: "Profile", id: "/profile", icon: "👤" }],
  public: [
    { label: "Dashboard", id: "/dashboard", icon: "🏠" },
    { label: "Standings", id: "/standings", icon: "📊" },
    { label: "Schedule", id: "/schedule", icon: "⏱️" },
    { label: "Roster", id: "/roster", icon: "👥" },
    { label: "Records", id: "/records", icon: "🏆" },
  ],
};

//   {
//     label: "Config",
//     id: "/admin/config",
//     icon: "🛠️",
//     requiredStatus: ["user"],
//     requiredRoles: ["Admin"], // Only visible to Admin role
//   },
//   /* ----------------LIVE GAME---------------------------*/

//   /* ----------------ADMIN---------------------------*/
//   {
//     label: "people",
//     id: "/admin/people",
//     icon: "🛠️",
//     requiredStatus: ["user"],
//     requiredRoles: ["Admin"], // Only visible to Admin role

//     showOnUrl: "/admin",
//   },
//   {
//     label: "clubs",
//     id: "/admin/clubs",
//     icon: "🛠️",
//     requiredStatus: ["user"],
//     requiredRoles: ["Admin"], // Only visible to Admin role

//     showOnUrl: "/admin",
//   },
//   {
//     label: "teams",
//     id: "/admin/teams",
//     icon: "🛠️",
//     requiredStatus: ["user"],
//     requiredRoles: ["Admin"], // Only visible to Admin role

//     showOnUrl: "/admin",
//   },
//   {
//     label: "leagues",
//     id: "/admin/leagues",
//     icon: "🛠️",
//     requiredStatus: ["user"],
//     requiredRoles: ["Admin"], // Only visible to Admin role

//     showOnUrl: "/admin",
//   },
//   {
//     label: "seasons",
//     id: "/admin/seasons",
//     icon: "🛠️",
//     requiredStatus: ["user"],
//     requiredRoles: ["Admin"], // Only visible to Admin role

//     showOnUrl: "/admin",
//   },
//   {
//     label: "events",
//     id: "/admin/events",
//     icon: "🛠️",
//     requiredStatus: ["user"],
//     requiredRoles: ["Admin"], // Only visible to Admin role

//     showOnUrl: "/admin",
//   },
// ];
export const roleOrder = [
  "admin",
  "coach",
  "player",
  "parent",
  "user",
  "public",
];
export function getNavSectionsForUser(user) {
  const roles = user?.roles || [];
  const highestRole = roleOrder.find((r) => roles.includes(r)) || "public";

  let sections = [];

  if (highestRole === "admin" || highestRole === "coach") {
    const start = roleOrder.indexOf(highestRole);
    sections = roleOrder.slice(start).map((section) => ({
      section,
      items: navItems[section],
    }));
  } else if (highestRole === "player") {
    sections = [
      { section: "player", items: navItems.player },
      { section: "user", items: navItems.user },
      { section: "public", items: navItems.public },
    ];
  } else if (highestRole === "parent") {
    sections = [
      { section: "parent", items: navItems.parent },
      { section: "user", items: navItems.user },
      { section: "public", items: navItems.public },
    ];
  } else if (highestRole === "user") {
    sections = [
      { section: "user", items: navItems.user },
      { section: "public", items: navItems.public },
    ];
  } else {
    sections = [{ section: "", items: navItems.public }];
  }

  // ✅ Flip order so "public" appears at the top
  return sections.reverse();
}
