import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/db";
import { compare } from "bcryptjs";

const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "メールアドレス", type: "email" },
                password: { label: "パスワード", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials) return null;
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });
                if (!user) return null;
                const isValid = await compare(credentials.password, user.password);
                if (!isValid) return null;
                return { id: String(user.id), email: user.email };
            }
        })
    ],
    session: { strategy: "jwt" }, // 型が合わない場合は "jwt" as const でもOK
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/auth/signin"
    }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };