import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { targetUserId, customMessage, locationPreferences, codeWord } = await req.json();

    // 1. Word count check
    const wordCount = customMessage.trim().split(/\s+/).length;
    if (wordCount > 30) {
      return NextResponse.json({ error: 'Message cannot exceed 30 words.' }, { status: 400 });
    }

    // 2. Authorization check
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
    if (!mongoose.Types.ObjectId.isValid(decodedToken.userId)) {
      return NextResponse.json({ error: 'Invalid sender ID format' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: 'Invalid target user ID format' }, { status: 400 });
    }
    const currentUserId = new mongoose.Types.ObjectId(decodedToken.userId);
    const targetUserObjectId = new mongoose.Types.ObjectId(targetUserId);
    console.log('Sender ID:', currentUserId);
    console.log('Target ID:', targetUserId);
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const targetUser = await User.findById(targetUserObjectId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }
    const existingRequest = targetUser.pendingMessages.find(
      (req: any) => req.from.toString() === currentUserId.toString()
    );
    if (existingRequest) {
      return NextResponse.json({ error: 'Chat request already exists' }, { status: 400 });
    }
    const pendingMessage = targetUser.pendingMessages.create({
      from: currentUserId,
      username:currentUser.username,
      customMessage,
      locationPreferences: locationPreferences || [],
      codeWord: codeWord || '',
    });
    targetUser.pendingMessages.push(pendingMessage);
    console.log('Pending message to push:', pendingMessage);
    await targetUser.save({ validateModifiedOnly: true });
    return NextResponse.json({ message: 'Chat request sent' });
  } catch (error: any) {
    console.log(error.message);
    return NextResponse.json({
      error: error.message || 'Failed to send chat request',
      detailedError: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    }, { status: 500 });
  }
}
