'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { DetailPanel } from '@/components/exam/DetailPanel';
import { useExamStore } from '@/store/exam-store';
import { useEffect, useState } from 'react';

export default function Home() {
    // Prevent hydration mismatch & Init Store
    const [mounted, setMounted] = useState(false);
    const { init, isLoading } = useExamStore();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            init();
        }
    }, [mounted, init]);

    if (!mounted || isLoading) {
        return (
            <div className="flex items-center justify-center h-screen w-screen bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <main className="flex h-screen w-screen overflow-hidden">
            {/* Sidebar (Collapsible) */}
            <Sidebar />

            {/* Right Panel: Detail (Flex 1) */}
            <section className="flex-1 h-full relative z-0">
                <DetailPanel />
            </section>
        </main>
    );
}
