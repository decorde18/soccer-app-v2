import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getPool } from "@/lib/db";

export async function POST(request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { message: "No token provided" },
        { status: 401 }
      );
    }

    // Verify current token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const pool = getPool();

    // Get fresh person data (SELECT * will now include system_admin)
    const [people] = await pool.execute("SELECT * FROM people WHERE id = ?", [
      decoded.userId,
    ]);

    if (people.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const person = people[0];
    const { password_hash: _, ...personWithoutPassword } = person;

    // Get system-level role based on the new system_admin boolean (0 or 1)
    const systemRole = person.system_admin === 1 ? "system_admin" : "user";

    const user = {
      ...personWithoutPassword,
      name: `${person.first_name} ${person.last_name}`.trim(),
      systemRole,
      // personWithoutPassword now correctly includes system_admin
    };

    // Generate new token
    const newToken = jwt.sign(
      {
        userId: person.id,
        email: person.email,
        systemRole,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
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
      { status: 401 }
    );
  }
}
