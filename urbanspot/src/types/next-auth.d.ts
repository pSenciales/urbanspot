// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    provider: string;
  }

}