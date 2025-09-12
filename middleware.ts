import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  const isAuthenticated = !!token;
  const pathname = req.nextUrl.pathname;

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isDashboardPage = pathname.startsWith('/dashboard');

  // Si utilisateur NON connecté veut accéder à /dashboard
  if (isDashboardPage && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  //  Si utilisateur DÉJÀ connecté veut accéder à /login ou /register
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/login', '/register'],
};
