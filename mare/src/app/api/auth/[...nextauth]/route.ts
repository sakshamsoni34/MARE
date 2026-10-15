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
            name: 'Demo Account',
            credentials: {
                email: { label: 'Email', type: 'text' }
            },
            async authorize(credentials) {
                const email = credentials?.email || 'developer@mare.ai';
                return {
                    id: '1',
                    name: 'MARE Developer',
                    email: email,
                    image: null
                };
            }
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: 'jwt',
        maxAge: 60 * 60, // 1 hour token expiration
    },
    callbacks: {
        async signIn({ user }) {
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id || user.email;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
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