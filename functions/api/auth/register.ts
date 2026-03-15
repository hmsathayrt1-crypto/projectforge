// ProjectForge - Auth Register API (using KV)
import { corsResponse, withCors } from '../_cors';

interface User {
  id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  full_name: string;
  university?: string;
  major?: string;
  year: number;
  created_at: string;
  token?: string;
  token_expires?: string;
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateUserId(): string {
  return 'user_' + generateToken().substring(0, 16);
}

function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  try {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      data,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    return Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback to SHA-256 if PBKDF2 fails (should not happen in Cloudflare Workers)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// OPTIONS handler for CORS
export async function onRequestOptions() {
  return corsResponse();
}

// POST /api/auth/register
export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json();
    const { email, password, full_name, university, major, year } = body;
    
    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' })
      });
    }
    
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' })
      });
    }
    
    const kv = context.env.KV;
    
    // Check if user exists
    const existingUser = await kv.get(`email:${email}`);
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Email already registered' }), {
        status: 409,
        headers: withCors({ 'Content-Type': 'application/json' })
      });
    }
    
    // Create user with secure password hashing
    const userId = generateUserId();
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const token = generateToken();
    const tokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const user: User = {
      id: userId,
      email,
      password_hash: passwordHash,
      password_salt: salt,
      full_name,
      university: university || null,
      major: major || null,
      year: year || 4,
      created_at: new Date().toISOString(),
      token,
      token_expires: tokenExpires
    };
    
    // Store user data
    await kv.put(`user:${userId}`, JSON.stringify(user));
    await kv.put(`email:${email}`, userId);
    await kv.put(`token:${token}`, JSON.stringify(user));
    
    // Return user without password
    const { password_hash, password_salt, ...userWithoutPassword } = user;
    
    return new Response(JSON.stringify({
      success: true,
      user: userWithoutPassword,
      token
    }), {
      headers: withCors({ 'Content-Type': 'application/json' })
    });
  } catch (error) {
    console.error('Register error:', error);
    return new Response(JSON.stringify({ error: 'Registration failed' }), {
      status: 500,
      headers: withCors({ 'Content-Type': 'application/json' })
    });
  }
}