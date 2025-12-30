"use client"

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
