'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavigationPanel() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
            <div className="container mx-auto px-4">
                <div className="flex items-center gap-6 h-16">
                    <Link
                        href="/"
                        className={`
              px-4 py-2 rounded-lg transition-all
              ${isActive('/')
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800'
                            }
            `}
                    >
                        📚 Técnicas
                    </Link>

                    <Link
                        href="/requisitos"
                        className={`
              px-4 py-2 rounded-lg transition-all
              ${isActive('/requisitos')
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800'
                            }
            `}
                    >
                        📋 Requisitos
                    </Link>
                </div>
            </div>
        </nav>
    );
}
