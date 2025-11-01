import { NextResponse } from "next/server";

export async function GET() {
  const profile = {
    userName: "David Cordero de Jesus",
    initials: "DC",
    email: "decordecoach@gmail.com",
    firstName: "David",
    role: "admin",
    jobTitle: "Head Coach",
  };
  return NextResponse.json(profile);
}
