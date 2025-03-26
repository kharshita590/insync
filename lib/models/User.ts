import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const pendingMessageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  customMessage: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300,
  },
  locationPreferences: {
    type: [String],
    default: [],
  },
  codeWord: {
    type: String,
    default: '',
    maxlength: 50,
  },
});
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
      validator: function (v: string) {
        return v.endsWith('@kiet.edu');
      },
      message: 'Email must be a valid KIET email address (@kiet.edu)',
    },
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
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
      validator: function (this: any, v: string[]) {
        if (this.isNew) return true;
        return Array.isArray(v) && v.length >= 3;
      },
      message: 'At least 3 interests must be selected',
    },
  },
  activeChats: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  }],
  pendingMessages: [pendingMessageSchema],
});
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Force recompile: Delete cached model if exists
if (mongoose.models.User) {
  delete mongoose.models.User;
}
const User = mongoose.model('User', userSchema);
export default User;
