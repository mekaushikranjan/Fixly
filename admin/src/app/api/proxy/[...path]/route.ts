const allowedMethods = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE']);

function getBackendApiUrl(): URL {
  const configuredUrl = process.env.API_URL?.trim();
  if (!configuredUrl) {
    throw new Error('API_URL is not configured for the admin server.');
  }

  let apiUrl: URL;
  try {
    apiUrl = new URL(configuredUrl);
  } catch {
    throw new Error('API_URL must be a valid HTTP(S) API URL.');
  }

  if (!['http:', 'https:'].includes(apiUrl.protocol)
    || apiUrl.username
    || apiUrl.password
    || apiUrl.search
    || apiUrl.hash) {
    throw new Error('API_URL must be an HTTP(S) URL without credentials, query, or fragment.');
  }

  return apiUrl;
}

async function proxyRequest(request: Request, context: RouteContext<'/api/proxy/[...path]'>): Promise<Response> {
  if (!allowedMethods.has(request.method)) {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: [...allowedMethods].join(', ') } });
  }

  let apiUrl: URL;
  try {
    apiUrl = getBackendApiUrl();
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Backend API is not configured' }, { status: 503 });
  }

  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const isHealthCheck = path[0] === 'health';
  const targetUrl = isHealthCheck
    ? new URL('/health', apiUrl.origin)
    : new URL(path.map((segment) => encodeURIComponent(segment)).join('/'), `${apiUrl.toString().replace(/\/+$/, '')}/`);
  targetUrl.search = incomingUrl.search;

  const headers = new Headers();
  for (const name of ['accept', 'authorization', 'content-type']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      ...(request.method !== 'GET' && request.method !== 'HEAD' ? { body: await request.arrayBuffer() } : {}),
      cache: 'no-store',
      redirect: 'manual',
    });
    const responseHeaders = new Headers();
    const contentType = response.headers.get('content-type');
    if (contentType) responseHeaders.set('content-type', contentType);
    responseHeaders.set('cache-control', 'no-store');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Admin backend proxy request failed:', error);
    return Response.json({ error: 'Unable to reach the backend API' }, { status: 502 });
  }
}

export const GET = proxyRequest;
export const HEAD = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
