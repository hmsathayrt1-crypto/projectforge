// ProjectForge - User Projects API (Save/Get user's saved projects)
import { corsResponse, withCors } from '../_cors';

// OPTIONS for CORS
export async function onRequestOptions() {
  return corsResponse();
}

// GET /api/user/projects - Get user's saved projects
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
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: withCors({ 'Content-Type': 'application/json' })
      });
    }
    
    const user = JSON.parse(userData);
    const projectsData = await kv.get(`user_projects:${user.id}`);
    const projects = projectsData ? JSON.parse(projectsData) : [];
    
    return new Response(JSON.stringify({ projects }), {
      headers: withCors({ 'Content-Type': 'application/json' })
    });
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return new Response(JSON.stringify({ error: 'Failed to get projects' }), {
      status: 500,
      headers: withCors({ 'Content-Type': 'application/json' })
    });
  }
}

// POST /api/user/projects - Save a project for user
export async function onRequestPost(context: any) {
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
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: withCors({ 'Content-Type': 'application/json' })
      });
    }
    
    const user = JSON.parse(userData);
    const body = await context.request.json();
    const { projectId, status } = body;
    
    if (!projectId) {
      return new Response(JSON.stringify({ error: 'Project ID required' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' })
      });
    }
    
    // Get existing projects
    const projectsData = await kv.get(`user_projects:${user.id}`);
    const projects = projectsData ? JSON.parse(projectsData) : [];
    
    // Update or add project
    const existingIndex = projects.findIndex((p: any) => p.projectId === projectId);
    const projectEntry = {
      projectId,
      status: status || 'interested',
      savedAt: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      projects[existingIndex] = projectEntry;
    } else {
      projects.push(projectEntry);
    }
    
    await kv.put(`user_projects:${user.id}`, JSON.stringify(projects));
    
    return new Response(JSON.stringify({ success: true, project: projectEntry }), {
      headers: withCors({ 'Content-Type': 'application/json' })
    });
  } catch (error) {
    console.error('Error saving project:', error);
    return new Response(JSON.stringify({ error: 'Failed to save project' }), {
      status: 500,
      headers: withCors({ 'Content-Type': 'application/json' })
    });
  }
}