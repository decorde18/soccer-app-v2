// lib/serverAuth.js
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getTeamAccessFromDB } from "./serverPermissions";

/**
 * Get current user WITHOUT redirecting (returns null if not logged in)
 * Use this for pages that support both public and authenticated views
 */
export async function getOptionalUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null; // Invalid token = treat as not logged in
  }
}

/**
 * Get current user from cookies (server-side only)
 * @returns {Promise<Object|null>} - User object or null
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded; // { userId, email, systemAdmin }
  } catch (error) {
    return null;
  }
}

/**
 * Require authentication - throw/redirect if not authenticated
 * @param {Object} options
 * @param {string} options.redirectTo - Where to redirect if not authenticated
 * @param {string} options.authLevel - Auth level ('public', 'authenticated', etc.)
 * @returns {Promise<Object|string>} - User object or 'public'
 */
export async function requireAuth({
  redirectTo = "/auth/login",
  authLevel,
} = {}) {
  if (authLevel === "public") return "public";

  const user = await getCurrentUser();

  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect(redirectTo);
  }

  return user;
}

/**
 * Check if user has access to a team (server-side)
 * @param {number} teamSeasonId - Team season ID
 * @param {Object} user - User object (optional, will fetch if not passed)
 * @returns {Promise<Object|null>} - Access object or null
 */
export async function checkServerTeamAccess(teamSeasonId, user = null) {
  const currentUser = user || (await getCurrentUser());

  if (!currentUser || currentUser === "public") return null;

  // ✅ System admin check (boolean field)
  if (currentUser.systemAdmin === true || currentUser.systemAdmin === 1) {
    return {
      role: "system_admin",
      access_type: "system_admin",
      can_edit: true,
      can_enter_stats: true,
      can_manage_roster: true,
      can_view: true,
    };
  }

  // Check database for team access
  const access = await getTeamAccessFromDB(currentUser.userId, teamSeasonId);
  return access;
}

/**
 * Require specific permission for a team
 * @param {number} teamSeasonId
 * @param {string} permission - 'can_edit', 'can_enter_stats', 'can_manage_roster'
 * @param {Object} user
 */
export async function requireTeamPermission(
  teamSeasonId,
  permission,
  user = null
) {
  const access = await checkServerTeamAccess(teamSeasonId, user);

  if (!access || !access[permission]) {
    const { redirect } = await import("next/navigation");
    redirect(`/teams/${teamSeasonId}?error=insufficient_permissions`);
  }

  return access;
}

// --- API Route Helpers ---

/**
 * API Route helper - verify token and return user
 * @param {Request} request - Next.js request object
 * @returns {Object|null} - User object or null
 */
export function getUserFromRequest(request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * API Route helper - require auth in API routes
 * @param {Request} request
 * @returns {Object} - User object or throws
 */
export function requireApiAuth(request) {
  const user = getUserFromRequest(request);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

/**
 * API Route helper - check team access in API routes
 * @param {Request} request
 * @param {number} teamSeasonId
 * @returns {Promise<Object>} - Access object or throws
 */
export async function requireApiTeamAccess(request, teamSeasonId) {
  const user = requireApiAuth(request);

  // ✅ System admin check
  if (user.systemAdmin === true || user.systemAdmin === 1) {
    return {
      role: "system_admin",
      access_type: "system_admin",
      can_edit: true,
      can_enter_stats: true,
      can_manage_roster: true,
      can_view: true,
    };
  }

  const access = await getTeamAccessFromDB(user.userId, teamSeasonId);

  if (!access) {
    throw new Error("Access Denied for this Team");
  }

  return access;
}
