import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      profile_id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      display_name?: string | null;
      avatar_url?: string | null;
    };
  }

  interface User {
    profile_id?: string;
    display_name?: string | null;
    avatar_url?: string | null;
  }
}
