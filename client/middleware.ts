import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/complete-profile', '/api/auth'];

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  learner: '/learner-dashboard',
  helper: '/dashboard',
};

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasSession = request.cookies.has('sessionid');
  const role = request.cookies.get('role')?.value; // set by Django
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));
  const isCompleteProfilePath = path.startsWith('/complete-profile');

  // Not logged in -> block protected routes
  if (!isPublic && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Logged in and hitting login/register -> send to their dashboard
  if (
    isPublic &&
    hasSession &&
    role &&
    ROLE_DASHBOARD_MAP[role] &&
    !isCompleteProfilePath
  ) {
    return NextResponse.redirect(
      new URL(ROLE_DASHBOARD_MAP[role], request.url),
    );
  }

  // Generic dashboard entrypoint -> forward to role-specific dashboard
  if (path === '/dashboard' && role && ROLE_DASHBOARD_MAP[role]) {
    return NextResponse.redirect(
      new URL(ROLE_DASHBOARD_MAP[role], request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
