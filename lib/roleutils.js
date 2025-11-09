// lib/roleUtils.js

/**
 * Role hierarchy - from highest to lowest permission
 * Note: "player" and "parent" are sibling roles at the same level
 */
export const roleOrder = [
  "admin",
  "coach",
  "player", // Sibling with "parent"
  "parent", // Sibling with "player"
  "user",
  "public",
];

/**
 * Define sibling roles that don't have access to each other
 * but share the same permission level
 */
export const siblingRoles = {
  player: ["parent"],
  parent: ["player"],
};

/**
 * Get the highest role from a user's role array
 * @param {string[]} roles - Array of user roles
 * @returns {string} - Highest role or "public" if none found
 */
export function getHighestRole(roles = []) {
  return roleOrder.find((r) => roles.includes(r)) || "public";
}

/**
 * Check if a user has access based on role hierarchy
 * User has access if their role is equal to or higher than required role
 * Handles sibling roles (player/parent) which don't have access to each other
 * @param {string[]} userRoles - User's roles array
 * @param {string} requiredRole - Minimum required role
 * @returns {boolean} - True if user has access
 */
export function hasRoleAccess(userRoles = [], requiredRole = "public") {
  const userHighestRole = getHighestRole(userRoles);
  const userRoleIndex = roleOrder.indexOf(userHighestRole);
  const requiredRoleIndex = roleOrder.indexOf(requiredRole);

  // Check if trying to access a sibling role
  if (siblingRoles[userHighestRole]?.includes(requiredRole)) {
    return false; // Siblings don't have access to each other
  }

  // Lower index = higher permission
  return userRoleIndex <= requiredRoleIndex;
}

/**
 * Check if a user has a specific role
 * @param {string[]} userRoles - User's roles array
 * @param {string} role - Role to check
 * @returns {boolean} - True if user has the role
 */
export function hasRole(userRoles = [], role) {
  return userRoles.includes(role);
}

/**
 * Check if a user has any of the specified roles
 * @param {string[]} userRoles - User's roles array
 * @param {string[]} roles - Roles to check
 * @returns {boolean} - True if user has any of the roles
 */
export function hasAnyRole(userRoles = [], roles = []) {
  return roles.some((role) => userRoles.includes(role));
}

/**
 * Check if a user has all of the specified roles
 * @param {string[]} userRoles - User's roles array
 * @param {string[]} roles - Roles to check
 * @returns {boolean} - True if user has all of the roles
 */
export function hasAllRoles(userRoles = [], roles = []) {
  return roles.every((role) => userRoles.includes(role));
}

/**
 * Get all roles equal to or below a given role (inclusive)
 * Excludes sibling roles (e.g., player cannot access parent content)
 * @param {string} role - The role to start from
 * @returns {string[]} - Array of roles from specified role downward
 */
export function getRolesFromLevel(role) {
  const index = roleOrder.indexOf(role);
  if (index === -1) return ["public"];

  const rolesFromLevel = roleOrder.slice(index);

  // Filter out sibling roles
  const siblings = siblingRoles[role] || [];
  return rolesFromLevel.filter((r) => !siblings.includes(r));
}

/**
 * Get all roles above a given role (exclusive)
 * @param {string} role - The role to start from
 * @returns {string[]} - Array of roles above the specified role
 */
export function getRolesAboveLevel(role) {
  const index = roleOrder.indexOf(role);
  if (index === -1 || index === 0) return [];
  return roleOrder.slice(0, index);
}

/**
 * Get sections for navigation based on user's highest role
 * @param {Object} user - User object with roles array
 * @param {Object} navItems - Navigation items organized by role
 * @param {boolean} reverse - Whether to reverse the order (public first)
 * @returns {Array} - Array of section objects with section name and items
 */
export function getNavSectionsForUser(user, navItems, reverse = true) {
  const roles = user?.roles || [];

  const highestRole = getHighestRole(roles);

  // Get all accessible roles based on hierarchy
  const accessibleRoles = getRolesFromLevel(highestRole);

  // Build sections array
  const sections = accessibleRoles
    .filter((role) => navItems[role]) // Only include roles with nav items
    .map((role) => ({
      section: role === "public" ? "" : role,
      items: navItems[role],
    }));

  // Return reversed if needed (public at top)
  return reverse ? sections.reverse() : sections;
}

/**
 * Filter items based on user's role access
 * @param {Array} items - Array of items with optional requiredRole property
 * @param {string[]} userRoles - User's roles array
 * @returns {Array} - Filtered array of accessible items
 */
export function filterByRoleAccess(items = [], userRoles = []) {
  return items.filter((item) => {
    if (!item.requiredRole) return true; // No requirement = accessible to all
    return hasRoleAccess(userRoles, item.requiredRole);
  });
}

/**
 * Get role display name (capitalize first letter)
 * @param {string} role - Role name
 * @returns {string} - Formatted role name
 */
export function getRoleDisplayName(role) {
  if (!role) return "Guest";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Compare two roles to determine which is higher
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {number} - Negative if role1 > role2, Positive if role2 > role1, 0 if equal
 */
export function compareRoles(role1, role2) {
  const index1 = roleOrder.indexOf(role1);
  const index2 = roleOrder.indexOf(role2);
  return index1 - index2;
}

/**
 * Get permission level (0 = highest, 5 = lowest)
 * @param {string} role - Role name
 * @returns {number} - Permission level
 */
export function getPermissionLevel(role) {
  const index = roleOrder.indexOf(role);
  return index === -1 ? roleOrder.length : index;
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Example 1: Check if user can access admin area
const userRoles = ["player", "user"];
const canAccessAdmin = hasRoleAccess(userRoles, "admin");
console.log(canAccessAdmin); // false

// Example 2: Check if user can access player area
const canAccessPlayer = hasRoleAccess(userRoles, "player");
console.log(canAccessPlayer); // true

// Example 2b: Check if player can access parent area (SIBLING TEST)
const canPlayerAccessParent = hasRoleAccess(["player"], "parent");
console.log(canPlayerAccessParent); // false - siblings don't have access to each other

// Example 2c: Check if parent can access player area (SIBLING TEST)
const canParentAccessPlayer = hasRoleAccess(["parent"], "player");
console.log(canParentAccessPlayer); // false - siblings don't have access to each other

// Example 3: Get highest role
const highest = getHighestRole(["user", "player", "parent"]);
console.log(highest); // "player" (first in roleOrder)

// Example 4: Get all accessible roles for player
const accessiblePlayer = getRolesFromLevel("player");
console.log(accessiblePlayer); // ["player", "user", "public"] - NO "parent"

// Example 4b: Get all accessible roles for parent
const accessibleParent = getRolesFromLevel("parent");
console.log(accessibleParent); // ["parent", "user", "public"] - NO "player"

// Example 4c: Get all accessible roles for coach (higher than siblings)
const accessibleCoach = getRolesFromLevel("coach");
console.log(accessibleCoach); // ["coach", "player", "parent", "user", "public"] - ALL roles below

// Example 5: Filter menu items by role
const menuItems = [
  { id: "dashboard", label: "Dashboard", requiredRole: "user" },
  { id: "admin", label: "Admin Panel", requiredRole: "admin" },
  { id: "home", label: "Home" }, // No requirement
];
const filtered = filterByRoleAccess(menuItems, ["player", "user"]);
console.log(filtered); // Returns dashboard and home, but not admin

// Example 6: Get nav sections
const navItems = {
  admin: [{ id: "/admin", label: "Admin" }],
  player: [{ id: "/stats", label: "Stats" }],
  user: [{ id: "/profile", label: "Profile" }],
  public: [{ id: "/home", label: "Home" }],
};
const user = { roles: ["player", "user"] };
const sections = getNavSectionsForUser(user, navItems, true);
// Returns sections in reverse order: public, user, player

// Example 7: Compare roles
const isCoachHigher = compareRoles("coach", "player") < 0;
console.log(isCoachHigher); // true

// Example 8: Check multiple roles
const hasPlayerOrCoach = hasAnyRole(["player", "user"], ["coach", "player"]);
console.log(hasPlayerOrCoach); // true
*/
