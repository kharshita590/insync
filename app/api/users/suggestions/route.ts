import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    await connectDB();
    const authHeader = req.headers.get('Authorization');
    console.log(authHeader)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("no")
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    console.log(token)

    try {
      const decodedToken = jwt.verify(token, JWT_SECRET) as JwtPayload & { userId: string };
      const currentUser = await User.findById(decodedToken.userId);
      console.log(currentUser)
      if (!currentUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const suggestedUsers = await User.aggregate([
        {
          $match: {
            _id: { $ne: currentUser._id }, 
            interests: { $in: currentUser.interests } 
          }
        },
        {
          $addFields: {
            commonInterests: {
              $size: { $setIntersection: ["$interests", currentUser.interests] } 
            }
          }
        },
        {
          $sort: { commonInterests: -1 } 
        },
        {
          $limit: 10 
        },
        {
          $project: {
            username: 1,
            bio: 1,
            interests: 1,
            year: 1,
            branch: 1 
          }
        }
      ]);

      return NextResponse.json({ users: suggestedUsers });
    } catch (err) {
      console.log("why")
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}