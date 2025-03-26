import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { targetUserId, customMessage, locationPreferences, codeWord } = await req.json();
    const wordCount = customMessage.trim().split(/\s+/).length;
    if (wordCount < 30 || wordCount > 40) {
      return NextResponse.json({ error: 'Message must be between 30 and 40 words.' }, { status: 400 });
    }

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
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }
        if (!targetUser.pendingRequests) {
      targetUser.pendingRequests = [];
    }
    const existingRequest = targetUser.pendingRequests.find(
      (req: any) => req.from.toString() === currentUser._id.toString()
    );
    if (!existingRequest) {
      targetUser.pendingRequests.push({
        from: currentUser._id,
        customMessage,
        locationPreferences,
        codeWord
      });
      await targetUser.save();
    }
    return NextResponse.json({ message: 'Chat request sent' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to send chat request' },
      { status: 500 }
    );
  }
}
