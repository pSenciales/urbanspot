// types/next-auth.d.ts
import type { Session as NextAuthSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    provider?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      points: {
        explorer: number;
        photographer: number;
      };
      imagen?: string;
    };
    accessToken?: string;
  }

  interface User {
    points?: {
      explorer: number;
      photographer: number;
    };
    imagen?: string;
    provider?: string;
  }
}
