import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Email & Password",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "fauzan@dompet.app" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                // Temporary logic: since we don't have password field in DB, we'll auto-login or create
                // In a real app, you would verify the password against a hashed password in DB
                
                let user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user) {
                    // Create user if not exists (for demo purposes)
                    user = await prisma.user.create({
                        data: {
                            email: credentials.email,
                            name: credentials.email.split('@')[0]
                        }
                    });
                }

                return user;
            }
        })
    ],
    session: {
        strategy: "jwt"
    },
    secret: process.env.NEXTAUTH_SECRET || "dompet_super_secret_jwt_key_2025",
    pages: {
        // You can uncomment these to build custom login pages
        // signIn: '/login',
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user && token.sub) {
                // Attach the DB user ID to the session object
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        }
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
