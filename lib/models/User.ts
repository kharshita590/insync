import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    validate: {
      validator: function(v: string) {
        return v.endsWith('@kiet.edu');
      },
      message: 'Email must be a valid KIET email address (@kiet.edu)'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 1,
    max: 4,
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
  },
  bio: {
    type: String,
    required: [true, 'Bio is required'],
    maxLength: 500,
  },
  interests: {
    type: [String],
    default: [],
    validate: {
      validator: function(this: any, v: any) {
        if (this.isNew) return true;
        return Array.isArray(v) && v.length >= 3;
      },
      message: 'At least 3 interests must be selected'
    }
  },
  activeChats: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    publicKey: {
      type: String,
      required: true
    }
  }],
  pendingMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  publicKey: {
    type: String,
    required: true,
    default: ''
  }
});
userSchema.methods.addChatPartner = async function(
  partnerId: string,
  partnerUsername: string,
  partnerPublicKey: string
) {
  const partnerObjectId = mongoose.Types.ObjectId.isValid(partnerId)
    ? new mongoose.Types.ObjectId(partnerId)
    : partnerId;
  const existingIndex = this.activeChats.findIndex(
    (chat: { userId: mongoose.Types.ObjectId }) => chat.userId.toString() === partnerObjectId.toString()
  );

  if (existingIndex === -1) {
    this.activeChats.push({
      userId: partnerObjectId,
      username: partnerUsername,
      publicKey: partnerPublicKey
    });
  } else {
    this.activeChats[existingIndex].username = partnerUsername;
    this.activeChats[existingIndex].publicKey = partnerPublicKey;
  }

  await this.save();
  return this;
};

userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);
