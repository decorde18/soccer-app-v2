import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getPool } from "@/lib/db";

export async function POST(request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { message: "No token provided" },
        { status: 401 },
      );
    }

    // Verify current token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const pool = getPool();

    // Get fresh user record from users table
    const [users] = await pool.execute(
      "SELECT id, person_id, system_admin FROM users WHERE id = ?",
      [decoded.userId],
    );

    if (users.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Get fresh person data
    const [people] = await pool.execute("SELECT * FROM people WHERE id = ?", [
      users[0].person_id,
    ]);

    if (people.length === 0) {
      return NextResponse.json(
        { message: "Person record not found" },
        { status: 404 },
      );
    }

    const userRecord = users[0];
    const person = people[0];
    const isSystemAdmin =
      userRecord.system_admin === 1 || userRecord.system_admin === true;

    const user = {
      id: person.id,
      userId: userRecord.id,
      first_name: person.first_name,
      last_name: person.last_name,
      nickname: person.nickname,
      email: person.email,
      phone: person.phone,
      gender: person.gender,
      birth_date: person.birth_date,
      title: person.title,
      other_last_name: person.other_last_name,
      entry_year: person.entry_year,
      credits_needed: person.credits_needed,
      is_active: person.is_active,
      created_at: person.created_at,
      modified_at: person.modified_at,
      name: `${person.first_name} ${person.last_name}`.trim(),
      system_admin: isSystemAdmin,
    };

    // Generate new token (using user_id from users table)
    const newToken = jwt.sign(
      {
        userId: userRecord.id,
        email: person.email,
        systemAdmin: isSystemAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return NextResponse.json({
      success: true,
      user,
      token: newToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { message: "Token refresh failed" },
      { status: 401 },
    );
  }
}
