import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Role-based route protection
    const adminOnlyRoutes = ['/admin']
    const physicianRoutes = ['/patients/*/discharge']
    
    if (adminOnlyRoutes.some(route => path.startsWith(route))) {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        const publicRoutes = ['/login', '/api/auth']
        const path = req.nextUrl.pathname
        
        if (publicRoutes.some(route => path.startsWith(route))) {
          return true
        }
        
        // Require authentication for all other routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't need auth
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
