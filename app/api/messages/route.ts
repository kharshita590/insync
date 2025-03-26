import { connectDB } from '@/lib/db';
import Message from '@/lib/models/Message';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sender = searchParams.get('sender');
  console.log(sender);
  const receiver = searchParams.get('receiver');
  console.log(receiver);
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  await connectDB();

  try {
    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort({ timestamp: 1 });
    console.log(messages);
    return new Response(JSON.stringify({ messages }), { status: 200, headers });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', 
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
