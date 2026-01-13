import React, { useState, useEffect } from 'react';
import { User, PrizeConfig, ActivityLog, Reward } from '../../types';
import { useAppStore } from '../../services/store';

interface AdminProps {
    user: User;
    prizes: PrizeConfig[];
    logs: ActivityLog[];
    rewards: Reward[];
}

export const AdminApp: React.FC<AdminProps> = ({ user, prizes: initialPrizes, logs, rewards }) => {
    const { state, actions } = useAppStore();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'prizes' | 'logs'>('dashboard');
    const [activeLogType, setActiveLogType] = useState<'SPIN' | 'REDEMPTION' | 'EARN_POINTS'>('SPIN');
    const [editingPrize, setEditingPrize] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<{ name: string; weight: number; active: boolean }>({ name: '', weight: 0, active: true });
    const [saving, setSaving] = useState(false);
    const [addingPrize, setAddingPrize] = useState(false);
    const [newPrizeName, setNewPrizeName] = useState('');
    const [newPrizeWeight, setNewPrizeWeight] = useState(10);

    // Use prizes from store (which should be loaded from DB) or fallback to props
    const prizes = state.prizes.length > 0 ? state.prizes : initialPrizes;

    // Load prizes from database on mount
    useEffect(() => {
        actions.loadPrizes();
    }, []);
    // --- KPI Calculations (Simple "All Time" for Mock) ---
    const pointsEarned = logs.filter(l => l.action === 'EARN_POINTS').reduce((acc, l) => {
        const match = l.details.match(/Earned (\d+)/);
        return acc + (match ? parseInt(match[1]) : 0);
    }, 0);

    const pointsConverted = logs.filter(l => l.action === 'CONVERT_POINTS').reduce((acc, l) => {
        const match = l.details.match(/Converted (\d+)/);
        return acc + (match ? parseInt(match[1]) : 0);
    }, 0);

    const spinsUsed = logs.filter(l => l.action === 'SPIN').length;
    const couponsRedeemed = rewards.filter(r => r.isUsed).length;

    // Find top prize (most common title in logs)
    const prizeCounts: Record<string, number> = {};
    logs.filter(l => l.action === 'SPIN').forEach(l => {
        const title = l.details.replace('Result: ', '');
        prizeCounts[title] = (prizeCounts[title] || 0) + 1;
    });
    const topPrize = Object.entries(prizeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    const renderActionBadge = (action: string, details: string) => {
        if (action === 'SPIN') {
            return (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-green-50 border border-green-100">
                    <span className="size-1.5 rounded-full bg-green-500"></span>
                    <span className="text-xs font-medium text-green-700">{details}</span>
                </div>
            );
        }
        if (action === 'REDEMPTION') {
            return (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100">
                    <span className="size-1.5 rounded-full bg-blue-500"></span>
                    <span className="text-xs font-medium text-blue-700">{details}</span>
                </div>
            );
        }
        if (action === 'EARN_POINTS') {
            return (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-100">
                    <span className="size-1.5 rounded-full bg-yellow-500"></span>
                    <span className="text-xs font-medium text-yellow-700">{details}</span>
                </div>
            );
        }
        if (action === 'CONVERT_POINTS') {
            return (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100">
                    <span className="size-1.5 rounded-full bg-indigo-500"></span>
                    <span className="text-xs font-medium text-indigo-700">{details}</span>
                </div>
            );
        }
        return (
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-100">
                <span className="size-1.5 rounded-full bg-purple-500"></span>
                <span className="text-xs font-medium text-purple-700">{details}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col">
                <div className="p-6 flex items-center gap-3">
                    <div className="size-8 bg-gold-400 rounded-lg flex items-center justify-center text-white font-bold">OS</div>
                    <span className="font-bold text-slate-800">Admin Console</span>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-1">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <span className="material-symbols-outlined">dashboard</span>
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('prizes')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'prizes' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <span className="material-symbols-outlined">redeem</span>
                        Prize Config
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'logs' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <span className="material-symbols-outlined">description</span>
                        Activity Logs
                    </button>
                </nav>
                <div className="p-4 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                        <img src={user.avatarUrl} className="size-8 rounded-full" alt="Admin" />
                        <div className="text-xs">
                            <p className="font-bold text-slate-900">{user.name}</p>
                            <p className="text-slate-500">Manager</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <span className="lg:hidden material-symbols-outlined">menu</span>
                        <span className="uppercase">{activeTab}</span>
                    </h1>
                    <div className="flex gap-2">
                        {activeTab === 'prizes' && (
                            <>
                                <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Discard</button>
                                <button className="px-4 py-2 text-sm font-bold bg-gold-400 hover:bg-gold-500 text-white rounded-lg shadow-sm">Publish Live</button>
                            </>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 lg:p-8">

                    {/* --- DASHBOARD VIEW --- */}
                    {activeTab === 'dashboard' && (
                        <div className="max-w-6xl mx-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-slate-500 text-sm font-bold uppercase">Points Earned</p>
                                    <p className="text-3xl font-black text-slate-900 mt-2">{pointsEarned}</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-slate-500 text-sm font-bold uppercase">Points Converted</p>
                                    <p className="text-3xl font-black text-slate-900 mt-2">{pointsConverted}</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-slate-500 text-sm font-bold uppercase">Spins Used</p>
                                    <p className="text-3xl font-black text-slate-900 mt-2">{spinsUsed}</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-slate-500 text-sm font-bold uppercase">Redemptions</p>
                                    <p className="text-3xl font-black text-slate-900 mt-2">{couponsRedeemed}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="font-bold text-slate-900 mb-4">Recent Activity</h3>
                                    <div className="space-y-4">
                                        {logs.slice(0, 5).map(log => (
                                            <div key={log.id} className="flex items-start gap-3 text-sm">
                                                <span className="text-slate-400 font-mono text-xs mt-0.5">{log.timestamp.split(' ')[1]}</span>
                                                <div>
                                                    <p className="font-medium text-slate-900">{log.action}: {log.details}</p>
                                                    <p className="text-slate-500 text-xs">by {log.userName}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="font-bold text-slate-900 mb-4">Risk Monitor</h3>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="size-16 rounded-full border-4 border-green-500 flex items-center justify-center">
                                            <span className="font-bold text-green-700">Low</span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Current Payout Rate</p>
                                            <p className="text-xl font-bold">12.5%</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500">Based on value of redeemed coupons vs bill total.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- PRIZES VIEW --- */}
                    {activeTab === 'prizes' && (
                        <div className="max-w-6xl mx-auto space-y-6">
                            {/* Total Weight Summary */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-4">
                                <div className="p-2 bg-blue-100 rounded-full text-blue-600 h-fit">
                                    <span className="material-symbols-outlined">calculate</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-blue-900 text-sm">Probability Summary</h3>
                                    <p className="text-xs text-blue-800 mt-1">
                                        Total Weight: <span className="font-bold">{prizes.reduce((acc, p) => acc + p.weight, 0)}</span>
                                        {' | '}
                                        Active Prizes: <span className="font-bold">{prizes.filter(p => p.active).length}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                    <h3 className="font-bold text-slate-800">Prize Items</h3>
                                    <button
                                        onClick={() => setAddingPrize(true)}
                                        className="text-sm text-blue-600 font-bold hover:underline flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-lg">add</span>
                                        Add Prize
                                    </button>
                                </div>

                                {/* Add New Prize Form */}
                                {addingPrize && (
                                    <div className="px-6 py-4 bg-green-50 border-b border-green-200 flex items-center gap-4">
                                        <input
                                            type="text"
                                            placeholder="Prize Name"
                                            value={newPrizeName}
                                            onChange={(e) => setNewPrizeName(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Weight"
                                            value={newPrizeWeight}
                                            onChange={(e) => setNewPrizeWeight(parseInt(e.target.value) || 10)}
                                            className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm text-center"
                                        />
                                        <button
                                            onClick={async () => {
                                                if (!newPrizeName.trim()) return;
                                                setSaving(true);
                                                await actions.createPrize({ name: newPrizeName, weight: newPrizeWeight });
                                                setNewPrizeName('');
                                                setNewPrizeWeight(10);
                                                setAddingPrize(false);
                                                setSaving(false);
                                            }}
                                            disabled={saving}
                                            className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {saving ? 'Saving...' : 'Add'}
                                        </button>
                                        <button
                                            onClick={() => setAddingPrize(false)}
                                            className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg text-sm hover:bg-slate-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-3">Prize Name</th>
                                                <th className="px-6 py-3 text-center">Weight</th>
                                                <th className="px-6 py-3 text-center">Probability</th>
                                                <th className="px-6 py-3 text-center">Status</th>
                                                <th className="px-6 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {prizes.map((prize) => {
                                                const totalWeight = prizes.reduce((acc, p) => acc + p.weight, 0);
                                                const probability = totalWeight > 0 ? ((prize.weight / totalWeight) * 100).toFixed(1) : '0';
                                                const isEditing = editingPrize === prize.id;

                                                return (
                                                    <tr key={prize.id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="px-6 py-4 font-medium text-slate-900">
                                                            <div className="flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-slate-400" style={{ color: prize.color }}>{prize.icon}</span>
                                                                {isEditing ? (
                                                                    <input
                                                                        type="text"
                                                                        value={editValues.name}
                                                                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                                                                        className="px-2 py-1 border border-blue-300 rounded text-sm"
                                                                    />
                                                                ) : (
                                                                    prize.name
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {isEditing ? (
                                                                    <input
                                                                        type="number"
                                                                        value={editValues.weight}
                                                                        onChange={(e) => setEditValues({ ...editValues, weight: parseInt(e.target.value) || 0 })}
                                                                        className="w-16 px-2 py-1 border border-blue-300 rounded text-center"
                                                                    />
                                                                ) : (
                                                                    <span className="font-mono">{prize.weight}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold" style={{ color: prize.color }}>
                                                                {probability}%
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {isEditing ? (
                                                                <button
                                                                    onClick={() => setEditValues({ ...editValues, active: !editValues.active })}
                                                                    className={`px-2 py-1 rounded text-xs font-bold ${editValues.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                                                                >
                                                                    {editValues.active ? 'Active' : 'Inactive'}
                                                                </button>
                                                            ) : (
                                                                <div className={`inline-block w-3 h-3 rounded-full ${prize.active ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {isEditing ? (
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={async () => {
                                                                            setSaving(true);
                                                                            await actions.updatePrize({
                                                                                id: prize.id,
                                                                                name: editValues.name,
                                                                                weight: editValues.weight,
                                                                                active: editValues.active
                                                                            });
                                                                            setEditingPrize(null);
                                                                            setSaving(false);
                                                                        }}
                                                                        disabled={saving}
                                                                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                                                                    >
                                                                        {saving ? '...' : 'Save'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setEditingPrize(null)}
                                                                        className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-xs font-bold hover:bg-slate-300"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingPrize(prize.id);
                                                                            setEditValues({ name: prize.name, weight: prize.weight, active: prize.active });
                                                                        }}
                                                                        className="text-slate-400 hover:text-blue-600"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (confirm(`Delete "${prize.name}"?`)) {
                                                                                await actions.deletePrize(prize.id);
                                                                            }
                                                                        }}
                                                                        className="text-slate-400 hover:text-red-600"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- LOGS VIEW --- */}
                    {activeTab === 'logs' && (
                        <div className="max-w-[1200px] mx-auto space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Activity Logs</h2>
                                    <p className="text-slate-500 text-base max-w-2xl">Audit trail for spins, redemptions, and administrative grants.</p>
                                </div>
                                <button className="flex items-center gap-2 h-10 px-4 bg-white border border-slate-200 text-slate-900 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                                    <span className="material-symbols-outlined text-lg">download</span>
                                    <span>Export CSV</span>
                                </button>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                {/* Summary Tabs */}
                                <div className="border-b border-slate-200 px-6">
                                    <div className="flex gap-8 overflow-x-auto">
                                        <button
                                            onClick={() => setActiveLogType('SPIN')}
                                            className={`relative py-4 text-sm font-bold border-b-[2px] flex items-center gap-2 transition-colors whitespace-nowrap ${activeLogType === 'SPIN' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-200'}`}
                                        >
                                            <span>Spin Log</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveLogType('REDEMPTION')}
                                            className={`relative py-4 text-sm font-bold border-b-[2px] flex items-center gap-2 transition-colors whitespace-nowrap ${activeLogType === 'REDEMPTION' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-200'}`}
                                        >
                                            <span>Redeems</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveLogType('EARN_POINTS')}
                                            className={`relative py-4 text-sm font-bold border-b-[2px] flex items-center gap-2 transition-colors whitespace-nowrap ${activeLogType === 'EARN_POINTS' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-200'}`}
                                        >
                                            <span>Points Earned</span>
                                        </button>
                                    </div>
                                </div>

                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                        <tr>
                                            <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider">Timestamp</th>
                                            <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider">User</th>
                                            <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider">Details</th>
                                            <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {logs.filter(l => l.action === activeLogType || (activeLogType === 'EARN_POINTS' && (l.action === 'EARN_POINTS' || l.action === 'CONVERT_POINTS'))).map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                                                <td className="py-4 px-6 text-slate-500">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-900">{log.timestamp.split(',')[0]}</span>
                                                        <span className="text-xs text-slate-400">{log.timestamp.split(',')[1] || ''}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <img src={log.userAvatar} className="size-8 rounded-full" alt="" />
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{log.userName}</span>
                                                            <span className="text-xs text-slate-400">user_{log.userId}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {renderActionBadge(log.action, log.details)}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors inline-block">
                                                        <span className="material-symbols-outlined text-lg align-middle">visibility</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};