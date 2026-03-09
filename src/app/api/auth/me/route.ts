// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-this-to-a-complex-secret-key');

export async function GET(request: Request) {
  const token = (await cookies()).get('auth-token')?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    return NextResponse.json({ user: payload }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}