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

    // Get fresh person data
    const [people] = await pool.execute("SELECT * FROM people WHERE id = ?", [
      decoded.userId,
    ]);

    if (people.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const person = people[0];
    const { password_hash: _, ...personWithoutPassword } = person;

    // Parse roles if stored as JSON string
    const roles =
      typeof person.roles === "string"
        ? JSON.parse(person.roles)
        : person.roles;

    // Combine first_name and last_name into name for frontend
    const user = {
      ...personWithoutPassword,
      name: `${person.first_name} ${person.last_name}`.trim(),
      roles,
    };

    // Generate new token
    const newToken = jwt.sign(
      {
        userId: person.id,
        email: person.email,
        roles,
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
