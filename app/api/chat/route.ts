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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    let decodedToken: JwtPayload & { userId: string };
    try {
      decodedToken = jwt.verify(token, JWT_SECRET) as JwtPayload & { userId: string };
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    // Populate the "from" field in pendingMessages to get sender's details:
    const user = await User.findById(decodedToken.userId)
      .populate({
        path: 'pendingMessages.from',
        select: 'username _id'
      });
      
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return activeChats and pendingMessages
    return NextResponse.json({
      activeChats: user.activeChats,
      pendingRequests: user.pendingMessages
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch chats' }, { status: 500 });
  }
}
