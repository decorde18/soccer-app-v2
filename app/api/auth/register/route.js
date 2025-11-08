import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getPool } from "@/lib/db";

export async function POST(request) {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      roles = ["user"],
    } = await request.json();

    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json(
        { message: "First name, last name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Check if person exists
    const [existingPeople] = await pool.execute(
      "SELECT id FROM people WHERE email = ?",
      [email]
    );

    if (existingPeople.length > 0) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Convert roles array to JSON string for MySQL
    const rolesJson = JSON.stringify(roles);

    // Insert person
    const [result] = await pool.execute(
      "INSERT INTO people (first_name, last_name, email, password_hash, roles, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [first_name, last_name, email, hashedPassword, rolesJson]
    );

    const userId = result.insertId;

    // Generate JWT token
    const token = jwt.sign(
      {
        userId,
        email,
        roles,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        first_name,
        last_name,
        name: `${first_name} ${last_name}`.trim(),
        email,
        roles,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Registration failed" },
      { status: 500 }
    );
  }
}
