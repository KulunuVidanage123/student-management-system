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
    
    // 🔧 ROBUST ID EXTRACTION: Handle any format
    let id: string;
    
    if (typeof payload.id === 'string') {
      // Already a string
      id = payload.id;
    } else if (payload.id && typeof payload.id === 'object') {
      // Could be ObjectId or nested object
      try {
        // Try JSON stringify to extract hex string
        const json = JSON.stringify(payload.id);
        const match = json.match(/[0-9a-f]{24}/i);
        if (match) {
          id = match[0];
        } else {
          // Fallback to toString
          id = String(payload.id);
        }
      } catch {
        id = String(payload.id);
      }
    } else {
      // Fallback
      id = String(payload.id);
    }
    
    // Return clean session object
    return {
      id,
      email: String(payload.email || ''),
      role: String(payload.role || 'user'),
      name: String(payload.name || ''),
    } as { 
      id: string; 
      email: string; 
      role: 'admin' | 'user'; 
      name: string 
    };
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}