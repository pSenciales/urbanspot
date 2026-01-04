// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";

// //============================MONGODB==============
// import dbConnect from "@/lib/mongo";
// import User from "@/models/User";

// =====================MYSQL=========================
import { prisma } from "@/lib/prisma";

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
          // //=================MONGODB=========================
          // // Conectar a MongoDB
          // await dbConnect();
          // const existingUser = await User.findOne({ email, provider });
          // if (!existingUser) {
          //   await User.create({
          //     name,
          //     email,
          //     image: image?.toString() || "",
          //     provider,
          //     points: { explorer: 0, photographer: 0 },
          //   });
          // }

          //=====================MYSQL====================

          // Para evitar problemas con que email y provider puede ser null
          if ( !email || !provider) throw new Error();

          const existingUser = await prisma.user.findUnique({
            where:{
              email_provider: { email: email, provider: provider}
            }
          });

          // Si no existe el usuario, se crea. Los puntos no lo asigno por ser 0 por defecto.
          if(!existingUser){
            await prisma.user.create({
              data:{
                name: name,
                email: email,
                provider: provider,
                image: image?.toString() || "",
              }
            });
          }

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
        // // =========================================MONGODB==========================================
        // await dbConnect();
        // const dbUser = await User.findOne({ email: session.user?.email, provider: token.provider });

        // =============================MYSQL================================

        // Para evitar problemas de tipos 
        if (typeof token.provider !== "string") throw new Error();

        const dbUser = await prisma.user.findUnique({
          where: {
            email_provider: { email: session.user?.email, provider: token.provider}
          }
        });

        if (dbUser) {
          console.log(dbUser);
          session.user.points = { explorer: dbUser.pointsExplorer,  photographer: dbUser.pointsPhotographer}; // Adaptado a nuestro esquema
          session.user.image = dbUser.image;
          session.user.name = dbUser.name;
          session.user.id = dbUser.id.toString(); // Cambiamos _id por id
        } else {
          throw new Error("User not found");
        }
      } catch (error) {
        console.error("Error fetching user for session", error);
        throw error;
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
