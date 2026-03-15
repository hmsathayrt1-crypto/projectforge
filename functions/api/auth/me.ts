// ProjectForge - Get Current User API
import { corsResponse, withCors } from '../_cors';

// OPTIONS for CORS
export async function onRequestOptions() {
  return corsResponse();
}

// GET /api/auth/me - Get current user
export async function onRequestGet(context: any) {
  const authHeader = context.request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: withCors({ 'Content-Type': 'application/json' })
    });
  }
  
  const token = authHeader.substring(7);
  const kv = context.env.KV;
  
  try {
    const userData = await kv.get(`token:${token}`);
    
    if (!userData) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: withCors({ 'Content-Type': 'application/json' })
      });
    }
    
    const user = JSON.parse(userData);
    delete user.password_hash;
    delete user.password_salt;
    
    // Get user skills
    const skillsData = await kv.get(`user_skills:${user.id}`);
    const skills = skillsData ? JSON.parse(skillsData) : [];
    
    return new Response(JSON.stringify({ user, skills }), {
      headers: withCors({ 'Content-Type': 'application/json' })
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return new Response(JSON.stringify({ error: 'Failed to get user' }), {
      status: 500,
      headers: withCors({ 'Content-Type': 'application/json' })
    });
  }
}