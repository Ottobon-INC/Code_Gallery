import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(req: NextRequestWithAuth) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // If the user is authenticated but NOT approved by an Admin
        if (token && !token.is_approved) {
            // Only let them access the pending approval page
            if (path !== '/pending-approval') {
                return NextResponse.redirect(new URL('/pending-approval', req.url));
            }
        }

        // If an approved user tries to go to pending page, send them away
        if (token && token.is_approved && path === '/pending-approval') {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // Guard the /admin route (only for users with is_admin = true)
        if (path.startsWith('/admin') && (!token || !token.is_admin)) {
            return NextResponse.redirect(new URL('/', req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            // This ensures the middleware ONLY runs if there's a valid token,
            // EXCEPT for public routes which we define in the matcher below.
            // Returning true here forces the middleware function above to execute
            // even if there is no token (so we can handle redirects manually if needed).
            authorized: ({ token }: { token: any }) => !!token,
        },
        pages: {
            signIn: '/login', // Redirect unauthenticated users here
        }
    }
);

// Apply middleware to everything EXCEPT login, register, public assets, and Next.js internals
export const config = {
    matcher: ['/((?!login|register|api|_next/static|_next/image|favicon.ico).*)'],
};
