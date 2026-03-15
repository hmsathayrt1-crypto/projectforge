// ProjectForge - Login API
import { corsResponse, withCors } from '../_cors';

async function hashPassword(password: string, salt?: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // New format: PBKDF2 with salt
  if (salt) {
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
      // Fallback
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  }
  
  // Legacy format: SHA-256 for backward compatibility
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// OPTIONS handler for CORS
export async function onRequestOptions() {
  return corsResponse();
}

// POST /api/auth/login
export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Missing email or password' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' })
      });
    }
    
    const kv = context.env.KV;
    
    // Get user ID from email
    const userId = await kv.get(`email:${email}`);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: withCors({ 'Content-Type': 'application/json' })
      });
    }
    
    // Get user data
    const userData = await kv.get(`user:${userId}`);
    if (!userData) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: withCors({ 'Content-Type': 'application/json' })
      });
    }
    
    const user = JSON.parse(userData);
    
    // Verify password (support both old and new formats)
    const salt = user.password_salt || '';
    const passwordHash = await hashPassword(password, salt);
    
    // For users with old format (no salt), try legacy hash
    let passwordValid = user.password_hash === passwordHash;
    if (!passwordValid && !user.password_salt) {
      // Try legacy SHA-256 for backward compatibility
      const legacyHash = await hashPassword(password);
      passwordValid = user.password_hash === legacyHash;
    }
    
    if (!passwordValid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: withCors({ 'Content-Type': 'application/json' })
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
    const { password_hash, password_salt, ...userWithoutPassword } = user;
    
    return new Response(JSON.stringify({
      success: true,
      user: userWithoutPassword,
      token
    }), {
      headers: withCors({ 'Content-Type': 'application/json' })
    });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: withCors({ 'Content-Type': 'application/json' })
    });
  }
}