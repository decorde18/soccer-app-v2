import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getPool } from "@/lib/db";

export async function POST(request) {
  try {
    const { first_name, last_name, email, password } = await request.json();

    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json(
        { message: "First name, last name, email, and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const pool = getPool();

    // Check if person exists
    const [existingPeople] = await pool.execute(
      "SELECT id FROM people WHERE email = ?",
      [email],
    );

    if (existingPeople.length > 0) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert person record (without auth fields)
    const [personResult] = await pool.execute(
      "INSERT INTO people (first_name, last_name, email, created_at) VALUES (?, ?, ?, NOW())",
      [first_name, last_name, email],
    );

    const personId = personResult.insertId;

    // Create user record with password_hash and system_admin = 0 (false) for new registrations
    const [userResult] = await pool.execute(
      "INSERT INTO users (person_id, password_hash, system_admin) VALUES (?, ?, ?)",
      [personId, hashedPassword, 0],
    );

    const userId = userResult.insertId;

    // Generate JWT token (using user_id from users table)
    const token = jwt.sign(
      {
        userId,
        email,
        systemAdmin: false,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return NextResponse.json({
      success: true,
      user: {
        id: personId,
        userId,
        first_name,
        last_name,
        name: `${first_name} ${last_name}`.trim(),
        email,
        system_admin: false,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Registration failed" },
      { status: 500 },
    );
  }
}
