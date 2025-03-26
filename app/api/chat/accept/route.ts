import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { requesterId } = await req.json();
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
    const currentUser = await User.findById(decodedToken.userId);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const requester = await User.findById(requesterId);
    if (!requester) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (currentUser.activeChats.length >= 3) {
      return NextResponse.json({ error: 'Maximum active chats limit reached' }, { status: 400 });
    }
    currentUser.pendingMessages = currentUser.pendingMessages.filter(
      (id: any) => id.toString() !== requesterId
    );
    currentUser.activeChats.push(requesterId);
    await currentUser.save();
    if (requester.activeChats.length < 3) {
      requester.activeChats.push(currentUser._id);
      await requester.save();
    }

    return NextResponse.json({ message: 'Chat request accepted' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to accept chat request' },
      { status: 500 }
    );
  }
}
