import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { authenticatedUserSchema, loginFormSchema } from "@/lib/validation";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  throw new Error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not defined in environment");
}

const backendBaseUrl = process.env.BACKEND_URL ?? "http://localhost:5000";

type GoogleAuthResponse = {
  id: string;
  role: string;
  accessToken: string;
};

const exchangeGoogleToken = async (idToken: string): Promise<GoogleAuthResponse> => {
  const res = await fetch(`${backendBaseUrl}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    const message =
      typeof payload?.error === "string" && payload.error.trim().length > 0
        ? payload.error
        : "Google sign-in failed";
    throw new Error(message);
  }

  return res.json() as Promise<GoogleAuthResponse>;
};

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
    }),
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.provider === "google") {
        if (!account.id_token) {
          throw new Error("Missing Google ID token");
        }

        const googleAuth = await exchangeGoogleToken(account.id_token);
        token.id = googleAuth.id;
        token.role = googleAuth.role;
        token.accessToken = googleAuth.accessToken;
        return token;
      }

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
