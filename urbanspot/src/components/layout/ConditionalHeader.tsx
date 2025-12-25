'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { HeaderMenu } from './HeaderMenu';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export function ConditionalHeader() {
    const pathname = usePathname();
    const { data: session } = useSession();

    if (pathname === '/login') {
        return null;
    }
    if (!session) {
        redirect('/login');
    }

    return (
        <header className="bg-white shadow-md p-4 z-10 flex items-center justify-between flex-none">
            <Link href="/" className="hover:opacity-75 transition-opacity">
                <h1 className="text-2xl font-bold text-gray-800 cursor-pointer">
                    🏙️ UrbanSpot
                </h1>
            </Link>
            <HeaderMenu user={session?.user} />
        </header>
    );
}
