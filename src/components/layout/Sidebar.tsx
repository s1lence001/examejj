'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
    ChevronLeft,
    ChevronRight,
    LogOut,
    User as UserIcon,
    Search,
    BookOpen
} from 'lucide-react';
import { RequirementsList } from '@/components/exam/RequirementsList';
import { FloatingActionBar } from '@/components/exam/FloatingActionBar';

export function Sidebar() {
    const { user, signOut } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Auto-collapse on small screens? Maybe later.

    return (
        <aside
            className={`
                relative h-full bg-white border-r border-slate-200 shadow-sm z-20 flex flex-col transition-all duration-300 ease-in-out
                ${isCollapsed ? 'w-20' : 'w-[35%] min-w-[320px] max-w-[500px]'}
            `}
        >
            {/* Collapse Toggle Button - Posicionado conforme solicitado */}
            <div className={`absolute z-50 transition-all duration-300 ${isCollapsed ? 'left-1/2 -translate-x-1/2 top-4' : 'right-4 top-6'}`}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? "Expandir" : "Recolher"}
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </Button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
                <div className={`flex-1 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <RequirementsList />
                    {/* Floating Action Bar needs to be aware of sidebar width or be inside */}
                    <FloatingActionBar />
                </div>

                {/* Collapsed View Indicators */}
                {isCollapsed && (
                    <div className="absolute inset-0 flex flex-col items-center pt-16 gap-4 text-slate-400">
                        {/* Fake "Logo" or App Icon */}
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg mb-4">
                            <span className="font-bold text-lg">JJ</span>
                        </div>

                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                            <Search size={20} />
                        </div>

                        {/* Divider */}
                        <div className="w-8 h-[1px] bg-slate-100 my-2"></div>

                        {/* Just some visual indicators that there is content */}
                        <div className="flex flex-col gap-3 opacity-50">
                            <div className="w-10 h-2 bg-slate-100 rounded-full"></div>
                            <div className="w-8 h-2 bg-slate-100 rounded-full"></div>
                            <div className="w-10 h-2 bg-slate-100 rounded-full"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer: User Profile */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                {isCollapsed ? (
                    <div className="flex flex-col gap-4 items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500" title={user?.email || 'Usuário'}>
                            <UserIcon size={20} />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-red-500"
                            onClick={() => signOut()}
                            title="Sair"
                        >
                            <LogOut size={20} />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 shadow-inner shrink-0">
                            <span className="font-bold text-sm">
                                {user?.email?.substring(0, 2).toUpperCase() || <UserIcon size={20} />}
                            </span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                                {user?.user_metadata?.full_name || 'Usuário'}
                            </p>
                            <p className="text-xs text-slate-500 truncate" title={user?.email || ''}>
                                {user?.email}
                            </p>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                            onClick={() => signOut()}
                            title="Sair"
                        >
                            <LogOut size={18} />
                        </Button>
                    </div>
                )}
            </div>
        </aside>
    );
}
