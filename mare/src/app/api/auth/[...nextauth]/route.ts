import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getDb } from '@/lib/db';

const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google' && user.email) {
                try {
                    const db = await getDb();
                    const dbUser = await db.get('SELECT id FROM users WHERE email = ?', [user.email]);
                    
                    if (!dbUser) {
                        const result = await db.run(
                            'INSERT INTO users (email, password_hash, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?)',
                            [user.email, 'oauth', user.name?.split(' ')[0] || '', user.name?.split(' ')[1] || '', 1]
                        );
                        user.id = result.lastID.toString();
                    } else {
                        user.id = dbUser.id.toString();
                    }
                    return true;
                } catch (error) {
                    console.error("Error during sign in database operation:", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
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
            return baseUrl + '/dashboard';
        },
    }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };