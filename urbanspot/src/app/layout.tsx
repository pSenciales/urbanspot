import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { HeaderMenu } from '@/components/layout/HeaderMenu';
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UrbanSpot",
  description: "UrbanSpot",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-screen overflow-hidden`}
      >
        <header className="bg-white shadow-md p-4 z-10 flex items-center justify-between flex-none">
                <h1 className="text-2xl font-bold text-gray-800">🏙️ UrbanSpot</h1>
                <HeaderMenu />
        </header>
        <div className="flex-1 relative overflow-hidden">
          <SessionProvider>{children}</SessionProvider>
        </div>
      </body>
    </html>
  );
}
