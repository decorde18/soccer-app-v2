import { NextResponse } from "next/server";

export async function POST(req) {
  const { email } = await req.json();
  const fakeUser = { id: "1", email, role: "user" };
  const fakeToken = "mock-jwt-token";

  const res = NextResponse.json({ user: fakeUser, token: fakeToken });
  res.cookies.set("token", fakeToken, { httpOnly: true });
  return res;
}
