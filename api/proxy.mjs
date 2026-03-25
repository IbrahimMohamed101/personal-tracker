function jsonResponse(body, status = 500) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function readBackendUrl() {
  const rawValue = String(process.env.BACKEND_URL || '').trim().replace(/\/+$/, '');
  if (!rawValue) return null;
  return rawValue;
}

function sanitizeProxyResponseHeaders(upstreamHeaders) {
  const headers = new Headers(upstreamHeaders);
  headers.set('cache-control', 'no-store');

  // The platform fetch may decode compressed upstream bodies before we stream
  // them back to the browser. If we keep the original encoding/length headers,
  // browsers can fail with ERR_CONTENT_DECODING_FAILED.
  headers.delete('content-encoding');
  headers.delete('content-length');
  headers.delete('transfer-encoding');

  return headers;
}

export default {
  async fetch(request) {
    const backendUrl = readBackendUrl();
    if (!backendUrl) {
      return jsonResponse({ message: 'BACKEND_URL is not configured on Vercel.' }, 500);
    }

    const incomingUrl = new URL(request.url);
    const rawPath = incomingUrl.searchParams.get('path') || '';
    const normalizedPath = String(rawPath).replace(/^\/+/, '');
    if (!normalizedPath) {
      return jsonResponse({ message: 'API path is missing.' }, 400);
    }

    const targetUrl = new URL(`${backendUrl}/api/${normalizedPath}`);
    incomingUrl.searchParams.forEach((value, key) => {
      if (key !== 'path') targetUrl.searchParams.append(key, value);
    });

    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('accept-encoding');

    let body;
    if (!['GET', 'HEAD'].includes(request.method.toUpperCase())) {
      body = await request.arrayBuffer();
    }

    let upstream;
    try {
      upstream = await fetch(targetUrl, {
        method: request.method,
        headers,
        body,
        redirect: 'manual',
      });
    } catch (_error) {
      return jsonResponse({ message: 'Failed to reach backend service.' }, 502);
    }

    const responseHeaders = sanitizeProxyResponseHeaders(upstream.headers);

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  },
};
