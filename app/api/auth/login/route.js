// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getPool } from "@/lib/db";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const pool = getPool();

    const [people] = await pool.execute(
      "SELECT * FROM people WHERE email = ?",
      [email]
    );

    if (people.length === 0) {
      await bcrypt.compare(password, "$2b$10$invalidsaltinvalidsaltinv"); // dummy
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const person = people[0];

    const isValidPassword = await bcrypt.compare(
      password,
      person.password_hash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // ✅ Get system_admin as boolean
    const isSystemAdmin =
      person.system_admin === 1 || person.system_admin === true;

    // Generate JWT token with user info
    const token = jwt.sign(
      {
        userId: person.id,
        email: person.email,
        systemAdmin: isSystemAdmin, // ✅ Use consistent naming
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password_hash: _, ...personWithoutPassword } = person;

    const user = {
      ...personWithoutPassword,
      id: person.id, // ✅ Make sure id is included
      name: `${person.first_name} ${person.last_name}`.trim(),
      systemAdmin: isSystemAdmin, // ✅ Add to user object
    };

    console.log("Login successful for:", email, "System Admin:", isSystemAdmin);

    return NextResponse.json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}
