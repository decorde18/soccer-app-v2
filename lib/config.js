// src/lib/data/nav-links.js

/**
 * Defines the navigation links and the roles/statuses required to see them.
 * Status: 'public' (logged out) or 'user' (logged in)
 * Roles: 'Guest', 'User', 'Admin'
 */
export const navItems = [
  {
    label: "Dashboard",
    id: "/dashboard",
    icon: "🏠",
    requiredStatus: ["public", "user"], // Visible to everyone
    requiredRoles: ["Guest", "User", "Admin"],
  },
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
    icon: "⚽",
    requiredStatus: ["user"], // Only visible when logged in
    requiredRoles: ["User", "Admin"],
  },
  {
    label: "Settings",
    id: "/settings",
    icon: "⚙️",
    requiredStatus: ["user"],
    requiredRoles: ["User", "Admin"],
  },
  {
    label: "Config",
    id: "/admin/config",
    icon: "🛠️",
    requiredStatus: ["user"],
    requiredRoles: ["Admin"], // Only visible to Admin role
  },
];
