import NextAuth from 'next-auth';

declare module 'next-auth' {
    interface User {
        id: string;
        email: string;
        is_approved: boolean;
        is_admin: boolean;
    }

    interface Session {
        user: User;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        email: string;
        is_approved: boolean;
        is_admin: boolean;
    }
}
