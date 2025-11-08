import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Optional: If you're storing sessions in DB, delete them here
    // const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    // For JWT-based auth, logout is handled client-side
    // by removing the token from localStorage and cookies

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ message: "Logout failed" }, { status: 500 });
  }
}
