import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { publicKey } = await req.json();
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
    
    await User.findByIdAndUpdate(decodedToken.userId, { publicKey });
    
    return NextResponse.json({ message: 'Public key updated successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update public key' },
      { status: 500 }
    );
  }
}
