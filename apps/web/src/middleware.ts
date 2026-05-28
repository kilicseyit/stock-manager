import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// IP-based in-memory rate limit registry
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Rate Limiting for API routes
  if (pathname.startsWith('/api')) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || (req as any).ip || '127.0.0.1';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const limit = 100; // max 100 requests per minute

    let rateData = rateLimitMap.get(ip);

    if (!rateData || now > rateData.resetTime) {
      rateData = { count: 1, resetTime: now + windowMs };
      rateLimitMap.set(ip, rateData);
    } else {
      rateData.count++;
    }

    if (rateData.count > limit) {
      const retryAfter = Math.ceil((rateData.resetTime - now) / 1000);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too Many Requests', 
          message: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.' 
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }
  }

  // Check for both NextAuth v4 and v5 session cookies (for HTTP and HTTPS)
  const sessionToken = 
    req.cookies.get('authjs.session-token')?.value ||
    req.cookies.get('__Secure-authjs.session-token')?.value ||
    req.cookies.get('next-auth.session-token')?.value ||
    req.cookies.get('__Secure-next-auth.session-token')?.value;

  const isLoggedIn = !!sessionToken;
  const isOnDashboard = pathname.startsWith('/dashboard');
  const isOnLogin = pathname === '/login';

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (isOnLogin && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/api/:path*'],
};

