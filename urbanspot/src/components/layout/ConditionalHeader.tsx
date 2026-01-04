'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { HeaderMenu } from './HeaderMenu';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '../ui/button';

export function ConditionalHeader() {
    const pathname = usePathname();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'unauthenticated' && (pathname !== '/login' && pathname !== '/')) {
            redirect('/login');
        }
    }, [status, pathname]);



    if (pathname === '/login') {
        return <></>
    } else {

        return (
            <header className="bg-white shadow-md p-4 z-1000 flex items-center justify-between flex-none sticky top-0 overflow-hidden">
                <Link href="/" className="hover:opacity-75 transition-opacity">
                    <h1 className="text-2xl font-bold text-gray-800 cursor-pointer">
                        🏙️ UrbanSpot
                    </h1>
                </Link>
                {session?.user ? (
                    <HeaderMenu user={session?.user} />
                ) : (
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => redirect('/login')}>
                        Iniciar Sesión
                    </Button>
                )}
            </header>
        );
    }
}
