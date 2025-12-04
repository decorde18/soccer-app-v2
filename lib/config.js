// src/lib/data/nav-links.js

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

// Example table structure - replace with your actual config
export const ADMIN_TABLES = [
  {
    value: "people",
    label: "People",
    icon: "👤",
    description: "Manage people accounts and permissions",
  },
  {
    value: "teams",
    label: "Teams",
    icon: "⚽",
    description: "Configure teams and rosters",
  },
  {
    value: "games",
    label: "Games",
    icon: "🎮",
    description: "Game schedules and results",
  },
  {
    value: "players",
    label: "Players",
    icon: "🏃",
    description: "Player profiles and stats",
  },
  {
    value: "seasons",
    label: "Seasons",
    icon: "📅",
    description: "Season management",
  },
  {
    value: "stats",
    label: "Statistics",
    icon: "📊",
    description: "Performance metrics",
  },
];
