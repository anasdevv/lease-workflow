import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates internal API requests from workflow steps
 * Uses a shared secret token for authentication
 */
export function validateInternalRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  // Get the internal API token from environment variables
  const internalToken = process.env.WORKFLOW_INTERNAL_TOKEN;

  // Fallback for development - but warn about it
  if (!internalToken && process.env.NODE_ENV === 'development') {
    console.warn(
      '[Security Warning] WORKFLOW_INTERNAL_TOKEN not set. Set this in production!'
    );
    return true; // Allow in dev without token
  }

  if (!internalToken) {
    return false;
  }

  return token === internalToken;
}

/**
 * Middleware to check internal API authentication
 */
export function withInternalAuth(
  handler: (request: NextRequest, params: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, params: any) => {
    if (!validateInternalRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing authentication token' },
        { status: 401 }
      );
    }

    return handler(request, params);
  };
}
