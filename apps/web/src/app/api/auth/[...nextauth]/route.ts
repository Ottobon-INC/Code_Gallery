import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    const res = await fetch(`${API_URL}/api/auth/login`, {
                        method: 'POST',
                        body: JSON.stringify(credentials),
                        headers: { "Content-Type": "application/json" }
                    });

                    const json = await res.json();

                    if (res.ok && json.success && json.data) {
                        return {
                            id: json.data.id,
                            email: json.data.email,
                            name: json.data.name ?? json.data.email.split('@')[0],
                            is_approved: json.data.is_approved,
                            is_admin: json.data.is_admin
                        };
                    }
                    return null;
                } catch (e) {
                    console.error("NextAuth authorize error:", e);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }: { token: any, user?: any }) {
            if (user) {
                // Initial sign in
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.is_approved = user.is_approved;
                token.is_admin = user.is_admin;
            }
            return token;
        },
        async session({ session, token }: { session: any, token: any }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
                session.user.is_approved = token.is_approved as boolean;
                session.user.is_admin = token.is_admin as boolean;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 8 * 60 * 60, // 8 hours — forces re-login after a workday
    },
    secret: process.env.NEXTAUTH_SECRET || 'fallback_secret_for_local_dev',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
