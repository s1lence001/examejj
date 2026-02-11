'use client';

import { usePathname } from 'next/navigation';

export function Header() {
    const pathname = usePathname();

    const getTitle = () => {
        if (pathname === '/') return 'Acompanhamento de Técnicas';
        if (pathname === '/requisitos') return 'Requisitos de Graduação';
        return 'Dashboard';
    };

    return (
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-6 flex items-center justify-between sticky top-0 z-20">
            <h1 className="text-lg font-semibold text-slate-800">
                {getTitle()}
            </h1>
            {/* Future: Breadcrumbs or Actions */}
        </header>
    );
}
