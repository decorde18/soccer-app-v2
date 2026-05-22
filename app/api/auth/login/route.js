// app/api/auth/login/route.js
// Auth route - queries users table for password_hash and system_admin
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
        { status: 400 },
      );
    }

    const pool = getPool();

    // Get user record by email through people table JOIN
    const [users] = await pool.execute(
      "SELECT u.id, u.person_id, u.password_hash, u.system_admin FROM users u JOIN people p ON u.person_id = p.id WHERE p.email = ?",
      [email],
    );

    if (users.length === 0) {
      // Dummy compare for security (prevent timing attacks)
      await bcrypt.compare(password, "$2b$10$invalidsaltinvalidsaltinv");
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const userRecord = users[0];

    console.log("User found:", {
      email,
      id: userRecord?.id,
      has_password_hash: !!userRecord?.password_hash,
      hash_type: typeof userRecord?.password_hash,
      hash_length: userRecord?.password_hash?.length,
    });

    if (
      !userRecord?.password_hash ||
      typeof userRecord.password_hash !== "string"
    ) {
      console.warn("Invalid password hash for user:", email);
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const isValidPassword = await bcrypt.compare(
      String(password),
      userRecord.password_hash,
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Get person data for user object response
    const [people] = await pool.execute("SELECT * FROM people WHERE id = ?", [
      userRecord.person_id,
    ]);

    if (people.length === 0) {
      return NextResponse.json(
        { message: "Person record not found" },
        { status: 401 },
      );
    }

    const person = people[0];
    const isSystemAdmin =
      userRecord.system_admin === 1 || userRecord.system_admin === true;

    // Generate JWT token with user info (userId is from users table)
    const token = jwt.sign(
      {
        userId: userRecord.id,
        email: person.email,
        systemAdmin: isSystemAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

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
