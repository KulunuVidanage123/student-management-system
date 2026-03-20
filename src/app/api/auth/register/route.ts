// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole = role === 'admin' && process.env.ALLOW_ADMIN_REGISTRATION === 'true' ? 'admin' : 'user';

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole,
    });

    return NextResponse.json({ 
      message: 'User registered successfully', 
      user: { 
        id: newUser._id.toString(),  //Convert ObjectId to string
        email: newUser.email, 
        name: newUser.name, 
        role: newUser.role 
      } 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}