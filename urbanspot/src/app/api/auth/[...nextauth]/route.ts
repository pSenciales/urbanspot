// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";
import dbConnect from "@/lib/mongo";
import User from "@/models/User";

const { handlers } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    Google({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
    }),
    Twitter({
      clientId: process.env.TWITTER_ID ?? "",
      clientSecret: process.env.TWITTER_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (user && account) {
        const { name, email, image } = user;
        const { provider } = account;

        try {
          // Conectar a MongoDB
          await dbConnect();

          const existingUser = await User.findOne({ email });

          if (!existingUser) {
            await User.create({
              name,
              email,
              provider,
              points: { explorer: 0, photographer: 0 },
              imagen: image || "",
            });
          } else {
            if (image && existingUser.imagen !== image) {
              existingUser.imagen = image;
              await existingUser.save();
            }
          }

          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email, provider }),
          });
        } catch (error) {
          console.error("Error saving user", error);
        }
      }
      return true;
    },

    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      return token;
    },

    async session({ session, token }) {
      try {
        await dbConnect();
        const dbUser = await User.findOne({ email: session.user?.email });

        if (dbUser) {
          console.log(dbUser);
          session.user.points = dbUser.points;
          session.user.image = dbUser.image;
          session.user.name = dbUser.name;
        }
      } catch (error) {
        console.error("Error fetching user for session", error);
      }

      return {
        ...session,
        accessToken: token.accessToken,
        provider: token.provider,
      };
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
});

export const { GET, POST } = handlers;
