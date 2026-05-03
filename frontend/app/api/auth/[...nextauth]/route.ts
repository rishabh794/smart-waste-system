import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticatedUserSchema, loginFormSchema } from "@/lib/validation";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "driver@waste.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsedCredentials = loginFormSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
        });

        if (!parsedCredentials.success) {
          return null;
        }

        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedCredentials.data),
        });

        if (!res.ok) {
          return null;
        }

        const user = await res.json();
        const parsedUser = authenticatedUserSchema.safeParse(user);

        if (!parsedUser.success) {
          return null;
        }

        return parsedUser.data;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      session.accessToken = token.accessToken;
      return session;
    }
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
