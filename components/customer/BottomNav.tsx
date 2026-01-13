import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface BottomNavProps {
    currentTab?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab = 'home' }) => {
    const router = useRouter();

    const navItems = [
        { id: 'home', icon: 'home', label: 'Home', path: '/' },
        { id: 'rewards', icon: 'local_activity', label: 'Rewards', path: '/?tab=rewards' },
        { id: 'profile', icon: 'person', label: 'Profile', path: '/?tab=profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-ocean-900 border-t border-gray-200 dark:border-ocean-800 pb-safe z-50">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => router.push(item.path)}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${currentTab === item.id ? 'text-gold-400' : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};
