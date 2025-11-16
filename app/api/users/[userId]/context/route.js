// app/api/users/[userId]/context/route.js
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET(request, { params }) {
  const { userId } = await params;

  try {
    const pool = getPool();

    // ✅ Check if user is system_admin (boolean column)
    const [userRows] = await pool.query(
      `SELECT system_admin FROM people WHERE id = ?`,
      [userId]
    );

    const user = userRows[0];
    const isSystemAdmin =
      user?.system_admin === 1 || user?.system_admin === true;

    // ✅ If system admin, return ALL teams and clubs
    if (isSystemAdmin) {
      // Get ALL teams
      const [allTeams] = await pool.query(`
        SELECT 
          ts.id as team_season_id,
          ts.team_id,
          ts.season_id,
          t.team_name,
          t.club_id,
          c.name AS club_name,
          s.season_name,
          'system_admin' as role,
          'system_admin' as access_type
        FROM team_seasons ts
        JOIN teams t ON ts.team_id = t.id
        JOIN clubs c ON t.club_id = c.id
        JOIN seasons s ON ts.season_id = s.id
        ORDER BY  club_name, t.team_name, s.season_name
      `);

      // Get ALL clubs
      const [allClubs] = await pool.query(`
        SELECT 
          c.id as club_id,
          c.name as club_name,
          'system_admin' as role
        FROM clubs c
        ORDER BY c.name
      `);

      // Get favorites (if any)
      const [favorites] = await pool.query(
        `
        SELECT 
          t.id as team_id,
          t.team_name,
          t.club_id,
          c.name AS club_name
        FROM user_favorites uf
        JOIN teams t ON uf.team_season_id = t.id
        JOIN clubs c ON t.club_id = c.id
        WHERE uf.person_id = ?
      `,
        [userId]
      );

      return NextResponse.json({
        teams: allTeams,
        clubs: allClubs,
        favorites: favorites || [],
        isSystemAdmin: true,
      });
    }

    // ✅ Regular user - get their specific access

    // Get teams from team_staff (coaches, admins)
    const [staffTeams] = await pool.query(
      `
      SELECT 
        ts.id as team_season_id,
        ts.team_id,
        ts.season_id,
        t.team_name,
        t.club_id,
        c.name AS club_name,
        s.season_name,
        staff.role,
        'staff' as access_type
      FROM team_staff staff
      JOIN team_seasons ts ON staff.team_season_id = ts.id
      JOIN teams t ON ts.team_id = t.id
      JOIN clubs c ON t.club_id = c.id
      JOIN seasons s ON ts.season_id = s.id
      WHERE staff.person_id = ? AND staff.is_active = 1
    `,
      [userId]
    );

    // Get teams from user_team_seasons (players, parents, fans)
    const [memberTeams] = await pool.query(
      `
      SELECT 
        ts.id as team_season_id,
        ts.team_id,
        ts.season_id,
        t.team_name,
        t.club_id,
        c.name AS club_name,
        s.season_name,
        uts.role,
        uts.role as access_type
      FROM user_team_seasons uts
      JOIN team_seasons ts ON uts.team_season_id = ts.id
      JOIN teams t ON ts.team_id = t.id
      JOIN clubs c ON t.club_id = c.id
      JOIN seasons s ON ts.season_id = s.id
      WHERE uts.person_id = ?
    `,
      [userId]
    );

    // Get clubs where user is admin
    const [clubs] = await pool.query(
      `
      SELECT 
        c.id as club_id,
        c.name as club_name,
        cs.role
      FROM club_staff cs
      JOIN clubs c ON cs.club_id = c.id
      WHERE cs.person_id = ? AND cs.is_active = 1
    `,
      [userId]
    );

    // Get favorites
    const [favorites] = await pool.query(
      `
      SELECT 
        t.id as team_id,
        t.team_name,
        t.club_id,
        c.name AS club_name
      FROM user_favorites uf
      JOIN teams t ON uf.team_season_id = t.id
      JOIN clubs c ON t.club_id = c.id
      WHERE uf.person_id = ?
    `,
      [userId]
    );

    return NextResponse.json({
      teams: [...staffTeams, ...memberTeams],
      clubs,
      favorites: favorites || [],
      isSystemAdmin: false,
    });
  } catch (error) {
    console.error("Error loading user context:", error);
    console.error("Error details:", error.message);
    console.error("Stack:", error.stack);

    return NextResponse.json(
      {
        error: "Failed to load context",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
