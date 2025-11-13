// src/auth.ts
import NextAuth from "next-auth";
import { User } from "next-auth";
import { Collection, ObjectId } from "mongodb";
import bcrypt from "bcrypt";

// Proveedores
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
//import Twitter from "next-auth/providers/twitter";

// Adaptador de Base de Datos
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb"; 

export const { 
  handlers,
  auth,
  signIn, 
  signOut 
} = NextAuth({
  
  adapter: MongoDBAdapter(clientPromise),

  providers: [
  
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    GitHub({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    /*Twitter({
      clientId: process.env.TWITTER_ID ?? "",
      clientSecret: process.env.TWITTER_SECRET ?? "",
    }),*/
    
    
    // Proveedor de Credentials (Email/Contraseña)
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials.email || !credentials.password) return null;
        
        const client = await clientPromise;
        const db = client.db("UrbanSpotDB");
        const usersCollection = db.collection("users");
        
        const user: any = await usersCollection.findOne({ 
          email: credentials.email as string 
        });
        
        if (!user) return null;
        if (!user.password) return null; 

        const isPasswordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (isPasswordMatch) return user;
        
        return null;
      }
    })
  ],
  
  pages: {
    signIn: "/login", 
  },

  events: {
    async createUser(message) {
      const db = (await clientPromise).db("UrbanSpotDB");
      const usersCollection = db.collection("users");
      
      await usersCollection.updateOne(
        { _id: new ObjectId(message.user.id) },
        { 
          $set: { 
            rol: "user",
            puntos_explorador: 0,
            puntos_fotografo: 0,
          } 
        }
      );
    }
  },

  callbacks: {
    // Esto funcionará porque tu archivo src/types/next-auth.d.ts
    // define estos campos.
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.rol = user.rol;
      session.user.puntos_explorador = user.puntos_explorador;
      session.user.puntos_fotografo = user.puntos_fotografo;
      return session;
    }
  }
});