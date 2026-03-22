import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await res.json();

          if (res.ok && data.token) {
            return {
              id: data.user?.id || data.user?.sub || '1',
              email: String(credentials.email),
              name: data.user?.name || String(credentials.email),
            };
          }
          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production',
});

export { signIn, signOut, auth };
export const { GET, POST } = handlers;
