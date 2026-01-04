/*
// src/auth.ts
import NextAuth from "next-auth";
// import Google from "next-auth/providers/google";

export const {
  handlers,
  auth,
  signIn,
  signOut
} = NextAuth({
  providers: [
    // ¡COMENTA ESTA LÍNEA!
    /
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    /
  ],
  pages: {
    signIn: "/login",
  },
});
*/

// src/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
// import Twitter from "next-auth/providers/twitter";

export const {
  handlers,
  auth,
  signIn,
  signOut
} = NextAuth({
  // Add this line - use NEXTAUTH_SECRET from your .env.local
  secret: process.env.NEXTAUTH_SECRET,
  
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    // Twitter provider configuration might need adjustment
    // Twitter({
    //   clientId: process.env.TWITTER_CLIENT_ID!,
    //   clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    // }),
  ],
  pages: {
    signIn: "/login",
  },
});