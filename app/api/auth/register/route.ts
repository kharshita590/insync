// import { NextRequest, NextResponse } from 'next/server';
// import { connectDB } from '@/lib/db';
// import User from '@/lib/models/User';

// export const dynamic = 'force-dynamic'; 

// export async function POST(req: NextRequest) {
//   try {
//     await connectDB(); 
//     const body = await req.json();
    
//     const { name, username, email, password, year, branch, bio } = body; 
//     if (!name || !username || !email || !password || !year || !branch || !bio) {
//       return NextResponse.json(
//         { error: 'All fields are required' },
//         { status: 400 }
//       );
//     }

//     const existingUser = await User.findOne({
//       $or: [{ username }, { email }]
//     });

//     if (existingUser) {
//       return NextResponse.json(
//         { error: 'Username or email already exists' },
//         { status: 400 }
//       );
//     }

//     try {
//       const user = await User.create({
//         name,
//         username,
//         email,
//         password,
//         year: Number(year), 
//         branch,
//         bio,
//       });

//       return NextResponse.json(
//         { message: 'User registered successfully', userId: user._id },
//         { status: 201 }
//       );
//     } catch (createError: any) {
//       console.error("User creation error:", createError);
      
//       // Handle specific mongoose validation errors
//       if (createError.name === 'ValidationError') {
//         const errors = Object.values(createError.errors)
//           .map((err: any) => err.message)
//           .join(', ');
        
//         return NextResponse.json(
//           { error: `Validation failed: ${errors}` },
//           { status: 400 }
//         );
//       }

//       return NextResponse.json(
//         { error: createError.message || 'Failed to create user' },
//         { status: 500 }
//       );
//     }
//   } catch (error: any) {
//     console.error("Registration error:", error);
//     return NextResponse.json(
//       { error: error.message || 'Registration failed' },
//       { status: 500 }
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    const { name, username, email, password, year, branch, bio, interests } = body;
    
    if (!name || !username || !email || !password || !year || !branch || !bio || !interests) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (!Array.isArray(interests) || interests.length < 3) {
      return NextResponse.json({ error: "At least 3 interests must be selected" }, { status: 400 });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      console.log("hi")
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 });
    }

    try {
      const user = await User.create({
        name,
        username,
        email,
        password,
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
