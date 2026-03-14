// ProjectForge - Login API
import { sha256 } from '@cloudflare/workers-workers/sha256';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// POST /api/auth/login
export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Missing email or password' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const kv = context.env.KV;
    
    // Get user ID from email
    const userId = await kv.get(`email:${email}`);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get user data
    const userData = await kv.get(`user:${userId}`);
    if (!userData) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const user = JSON.parse(userData);
    const passwordHash = await hashPassword(password);
    
    if (user.password_hash !== passwordHash) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate new token
    const token = generateToken();
    const tokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    user.token = token;
    user.token_expires = tokenExpires;
    
    // Update stored user
    await kv.put(`user:${userId}`, JSON.stringify(user));
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
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}