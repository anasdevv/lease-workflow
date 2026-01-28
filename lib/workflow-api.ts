/**
 * Creates fetch options with internal API authentication
 * Used by workflow steps to authenticate requests to internal API routes
 */
export function getInternalApiHeaders(): Record<string, string> {
  const token = process.env.WORKFLOW_INTERNAL_TOKEN;
  
  if (!token && process.env.NODE_ENV === 'production') {
    throw new Error('WORKFLOW_INTERNAL_TOKEN must be set in production');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || ''}`,
  };
}

/**
 * Makes an authenticated fetch request to internal API
 */
export async function fetchInternal(
  url: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      ...getInternalApiHeaders(),
      ...(options?.headers || {}),
    },
  });
}
