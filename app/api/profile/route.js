import { NextResponse } from "next/server";

export async function GET() {
  const profile = {
    userName: "David Cordero de Jesus",
    initials: "DC",
    email: "davidc3@wcs.edu",
    firstName: "David",
    role: "admin",
    jobTitle: "RBT",
  };
  return NextResponse.json(profile);
}
