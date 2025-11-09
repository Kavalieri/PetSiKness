import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { query } from '@/lib/db';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      try {
        // Buscar o crear perfil
        const existingProfile = await query(
          `SELECT id FROM profiles WHERE email = $1`,
          [user.email],
        );

        if (existingProfile.rows.length === 0) {
          // Crear nuevo perfil
          await query(
            `INSERT INTO profiles (auth_id, email, display_name, avatar_url)
             VALUES ($1, $2, $3, $4)`,
            [account?.providerAccountId, user.email, user.name, user.image],
          );
        }

        return true;
      } catch (error) {
        console.error('Error en signIn:', error);
        return false;
      }
    },

    async session({ session }) {
      if (session.user?.email) {
        const result = await query(
          `SELECT id, display_name, avatar_url FROM profiles WHERE email = $1`,
          [session.user.email],
        );

        if (result.rows[0]) {
          session.user.profile_id = result.rows[0].id;
          session.user.display_name = result.rows[0].display_name;
          session.user.avatar_url = result.rows[0].avatar_url;
        }
      }

      return session;
    },
  },

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
