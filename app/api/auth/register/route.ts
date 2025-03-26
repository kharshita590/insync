import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  console.log("hii")
  try {
    await connectDB();
    const body = await req.json();
    console.log(body)
    const { name, username, email, password, year, branch, bio, interests, gender } = body;
    
    if (!name || !username || !email || !password || !year || !branch || !bio || !interests || !gender) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (!Array.isArray(interests) || interests.length < 3) {
      return NextResponse.json({ error: "At least 3 interests must be selected" }, { status: 400 });
    }
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 });
    }

    try {
      const user = await User.create({
        name,
        username,
        email,
        password,
        gender,
        year: Number(year),
        branch,
        bio,
        interests,
      });

      return NextResponse.json(
        { message: "User registered successfully", userId: user._id },
        { status: 201 }
      );
    } catch (createError: any) {
      console.error("User creation error:", createError);
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}

