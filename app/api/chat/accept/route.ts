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
    const requesterIdString = typeof requesterId === "object" ? requesterId._id : requesterId;
    console.log("Requester ID from payload:", requesterIdString);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    let decodedToken: JwtPayload & { userId: string };
    try {
      decodedToken = jwt.verify(token, JWT_SECRET) as JwtPayload & { userId: string };
      console.log("Decoded token userId:", decodedToken.userId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const currentUser = await User.findById(decodedToken.userId);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const requester = await User.findById(requesterIdString);
    console.log("Requester document:", requester);
    if (!requester) {
      return NextResponse.json({ error: 'Requester not found' }, { status: 404 });
    }
    if (currentUser.activeChats.length >= 113) {
      return NextResponse.json({ error: 'Maximum active chats limit reached' }, { status: 400 });
    }
    currentUser.pendingMessages = currentUser.pendingMessages.filter((msg: any) => {
      const match = msg.from.equals(requesterIdString);
      console.log(`Comparing msg.from ${msg.from.toString()} equals requesterId ${requesterIdString}:`, match);
      return !match;
    }) as any;
    currentUser.markModified("pendingMessages");
    currentUser.activeChats.push({
      userId: requester._id,
      username: requester.username,
    });
    await currentUser.save();

    if (requester.activeChats.length < 113) {
      const alreadyInRequesterChats = requester.activeChats.some(
        (chat: any) => chat.userId.toString() === currentUser._id.toString()
      );
      if (!alreadyInRequesterChats) {
        requester.activeChats.push({
          userId: currentUser._id,
          username: currentUser.username,
        });
        await requester.save();
      }
    }

    const updatedUser = await User.findById(currentUser._id);
    console.log("After acceptance, pendingMessages:", updatedUser?.pendingMessages);

    return NextResponse.json({
      message: 'Chat request accepted',
      pendingMessages: updatedUser?.pendingMessages,
    });
  } catch (error: any) {
    console.error("Error in accept route:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept chat request' },
      { status: 500 }
    );
  }
}
