import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  sender: string;
  receiver: string;
  content: string;
  timestamp: Date;
}

const MessageSchema = new Schema<IMessage>({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
