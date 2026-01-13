import React from 'react';
import { Activity } from '../../types';
import { useRouter } from 'next/navigation';

interface ActivityCardProps {
    activity: Activity;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
    const router = useRouter();

    return (
        <div
            onClick={() => router.push(activity.route)}
            className="group relative bg-ocean-800 rounded-3xl p-6 border border-gold-400/30 shadow-[0_0_25px_rgba(242,166,13,0.15)] mb-6 cursor-pointer hover:bg-ocean-750 transition-all active:scale-95"
        >
            {activity.badge && (
                <div className="absolute top-0 right-0 bg-gold-400 text-ocean-950 text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-3xl z-10 uppercase tracking-wide">
                    {activity.badge}
                </div>
            )}

            <div className="flex items-center gap-4 mb-4">
                <div className="size-16 rounded-2xl bg-ocean-700 flex items-center justify-center border border-ocean-600 group-hover:border-gold-400/50 transition-colors">
                    <span className="material-symbols-outlined text-4xl text-gold-400">
                        {activity.iconKey || 'extension'}
                    </span>
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-gold-200">{activity.title}</h3>
                    <p className="text-sm text-slate-400">{activity.subtitle}</p>
                </div>
            </div>

            <button
                className="w-full py-3 bg-ocean-700 group-hover:bg-gold-400 group-hover:text-ocean-950 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined text-lg">play_circle</span>
                Play Now
            </button>
        </div>
    );
};
