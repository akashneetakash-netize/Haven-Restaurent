import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || 'haven_restaurant_lounge_secret_key_2026',
  });

  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith('/account') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/orders');

  if (isProtected) {
    if (!token) {
      const loginUrl = new URL('/', req.url);
      loginUrl.searchParams.set('auth', 'required');
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith('/admin')) {
      const userRole = (token as any).role;
      if (userRole !== 'admin') {
        const homeUrl = new URL('/', req.url);
        homeUrl.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(homeUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*', '/orders/:path*'],
};
