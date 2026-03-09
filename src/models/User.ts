// src/models/User.ts
import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6 
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user' 
  }
}, { timestamps: true });

const User = models.User || model('User', UserSchema);

export default User;