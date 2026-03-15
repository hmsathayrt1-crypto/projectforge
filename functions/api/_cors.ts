// ProjectForge - CORS Helper for all API routes

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export function corsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}

export function withCors(headers: Record<string, string> = {}): Record<string, string> {
  return { ...CORS_HEADERS, ...headers };
}