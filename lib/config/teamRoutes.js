export const TEAM_ROUTES = [
  {
    name: "Overview",
    path: "",
    exact: true,
  },
  {
    name: "Schedule",
    path: "schedule",
  },
  {
    name: "Roster",
    path: "roster",
  },
  {
    name: "Stats",
    path: "stats",
  },
  {
    name: "Events",
    path: "events",
  },
  {
    name: "Settings",
    path: "settings",
  },
];

export function isValidTeamRoute(route) {
  if (!route || route === "") return true; // Overview is always valid
  return TEAM_ROUTES.some((r) => r.path === route);
}

export function getTeamRoutePath(teamSeasonId, subRoute = "") {
  return `/teams/${teamSeasonId}${subRoute ? `/${subRoute}` : ""}`;
}
