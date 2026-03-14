// ProjectForge - Auth API (using KV)
import { sha256 } from '@cloudflare/workers-workers/sha256';

interface User {
  id: string;
  email: string;
  password_hash: string;
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

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// GET /api/auth/me - Get current user
export async function onRequestGet(context: any) {
  const authHeader = context.request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const token = authHeader.substring(7);
  const kv = context.env.KV;
  
  try {
    const userData = await kv.get(`token:${token}`);
    
    if (!userData) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const user = JSON.parse(userData);
    delete user.password_hash;
    
    // Get user skills
    const skillsData = await kv.get(`user_skills:${user.id}`);
    const skills = skillsData ? JSON.parse(skillsData) : [];
    
    return new Response(JSON.stringify({ user, skills }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST /api/auth/register
export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json();
    const { email, password, full_name, university, major, year } = body;
    
    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const kv = context.env.KV;
    
    // Check if user exists
    const existingUser = await kv.get(`email:${email}`);
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Email already registered' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create user
    const userId = generateUserId();
    const passwordHash = await hashPassword(password);
    const token = generateToken();
    const tokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const user: User = {
      id: userId,
      email,
      password_hash: passwordHash,
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
    const { password_hash, ...userWithoutPassword } = user;
    
    return new Response(JSON.stringify({
      success: true,
      user: userWithoutPassword,
      token
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Register error:', error);
    return new Response(JSON.stringify({ error: 'Registration failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}