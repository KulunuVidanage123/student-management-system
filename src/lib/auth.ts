// src/lib/auth.ts
'use server'; 

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-this-to-a-complex-secret-key');

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { id: string; email: string; role: string; name: string };
  } catch (error) {
    return null;
  }
}