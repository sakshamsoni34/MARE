import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
        CredentialsProvider({
            id: 'credentials',
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
                isRegister: { label: 'Register', type: 'text' }
            },
            async authorize(credentials) {
                const email = credentials?.email?.trim().toLowerCase();
                const password = credentials?.password?.trim();
                const isRegister = credentials?.isRegister === 'true';

                // Demo account fallback if no credentials supplied
                if (!email) {
                    return {
                        id: '1',
                        name: 'MARE Developer',
                        email: 'developer@mare.ai',
                        role: 'developer',
                        accessToken: ''
                    };
                }

                const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8555';

                try {
                    const endpoint = isRegister ? `${backendUrl}/api/auth/register` : `${backendUrl}/api/auth/login`;
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email,
                            password: password || 'demo12345',
                            first_name: email.split('@')[0]
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        return {
                            id: String(data.user.id),
                            name: data.user.name || email,
                            email: data.user.email,
                            role: data.user.role,
                            accessToken: data.access_token
                        };
                    } else if (!password) {
                        // Demo developer fallback
                        return {
                            id: '1',
                            name: 'MARE Developer',
                            email,
                            role: 'developer',
                            accessToken: ''
                        };
                    }
                    return null;
                } catch (err) {
                    console.error('Auth verification error:', err);
                    return {
                        id: '1',
                        name: 'MARE Developer',
                        email,
                        role: 'developer',
                        accessToken: ''
                    };
                }
            }
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: 'jwt',
        maxAge: 60 * 60 * 24, // 24 hours token expiration
    },
    callbacks: {
        async signIn() {
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id || user.email;
                token.role = (user as any).role || 'developer';
                token.accessToken = (user as any).accessToken || '';
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).accessToken = token.accessToken;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            if (url.startsWith('/')) return `${baseUrl}${url}`;
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        },
    }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
