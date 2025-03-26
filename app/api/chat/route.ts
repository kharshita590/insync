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

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, JWT_SECRET) as JwtPayload & { userId: string };
    const user = await User.findById(decodedToken.userId)
      .populate({
        path: 'pendingMessages',
        model: 'User',
        select: 'username _id'
      });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const activeChats = await Promise.all(
      user.activeChats.map(async (chat: any) => {
        const partnerId = chat.userId ? chat.userId : chat._id;
        if (!partnerId) return null;
        const partner = await User.findById(partnerId, 'username publicKey _id').exec();
        return partner;
      })
    );
    const filteredActiveChats = activeChats.filter((partner) => partner !== null);

    const pendingRequests = user.pendingMessages.map((msg: any) => ({
      _id: msg._id,
      username: msg.username
    }));

    return NextResponse.json({ activeChats: filteredActiveChats, pendingRequests });
  } catch (error: any) {
    console.error('Chat fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}
