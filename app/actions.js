// app/actions.js
"use server";

import { cookies } from "next/headers";

// 📚 NOTE: Replace 'yourAuthTokenName' with your actual token name (e.g., 'session_id')

/**
 * Function to add (set) an authentication token.
 * @param {string} token - The JWT or session ID to store.
 */
export async function setAuthToken(token) {
  // Set an HTTP-only, secure cookie with the token
  cookies().set({
    name: "yourAuthTokenName",
    value: token,
    httpOnly: true, // 🔒 ESSENTIAL: Prevents client-side JavaScript access
    secure: process.env.NODE_ENV === "production", // Use 'secure' in production (HTTPS)
    maxAge: 60 * 60 * 24 * 7, // 1 week duration (or use 'expires' for a specific date)
    path: "/", // The path for which the cookie is valid
    sameSite: "lax", // Good security practice
  });

  // Optional: Return a success message or redirect the user
  return { success: true };
}

/**
 * Function to delete (remove) the authentication token.
 */
export async function deleteAuthToken() {
  // Deleting an HTTP-only cookie by setting its value to null/empty
  // and immediately expiring it is the standard practice.
  cookies().set({
    name: "yourAuthTokenName",
    value: "", // Clear the value
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0, // 🗑️ Immediately expire the cookie
    path: "/",
  });

  // Optional: Return a success message or redirect the user
  return { success: true };
}
