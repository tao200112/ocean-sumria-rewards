import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { User, normalizeRole } from '../../types';
import { useAppStore } from '../../services/store';
import { supabase } from '../../services/supabase';

interface StaffProps {
    user: User;
    onGrantSpins: (customerId: string, billAmount: number) => { success: boolean; message: string };
    onRedeemCoupon: (code: string) => Promise<boolean>;
}

// --- Internal Component: QR Scanner Modal ---
const QRScannerModal = ({ onClose, onScan, type }: { onClose: () => void, onScan: (val: string) => void, type: 'customer' | 'coupon' }) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const scannerId = "reader";
        // Create instance
        const html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        // Use responsive qrbox or full scan
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1
        };

        // Start scanning
        html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                // Success
                // alert("Debug: Scanned Code: " + decodedText); // Uncomment if needed, but let's persist through
                if (scannerRef.current?.isScanning) {
                    scannerRef.current.stop().then(() => {
                        onScan(decodedText);
                    }).catch(err => {
                        console.error("Stop failed", err);
                        onScan(decodedText); // Force callback anyway
                    });
                } else {
                    onScan(decodedText);
                }
            },
            (errorMessage) => {
                // parse error, ignore
            }
        ).catch(err => {
            console.error("Camera error", err);
            alert("Camera Error: " + err);
            setError("Camera access denied or unavailable: " + err);
        });

        // Cleanup
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
                scannerRef.current.clear();
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[60] bg-black text-white flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-black/50 absolute top-0 left-0 right-0 z-10 backdrop-blur-sm">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold-400">qr_code_scanner</span>
                    Scanning {type === 'customer' ? 'Customer' : 'Coupon'}
                </h3>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* Camera View */}
            <div className="flex-1 relative overflow-hidden bg-slate-900 flex items-center justify-center">
                {!error ? (
                    <div id="reader" className="w-full h-full object-cover"></div>
                ) : (
                    <div className="text-center p-6 text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2">videocam_off</span>
                        <p>{error}</p>
                    </div>
                )}

                {/* Overlay / Reticle (Visual Only) */}
                <div className="absolute inset-0 flex items-center justify-center p-10 pointer-events-none">
                    <div className="w-64 h-64 border-2 border-gold-400/50 rounded-xl relative">
                        {/* Corners */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-gold-400 -mt-1 -ml-1 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-gold-400 -mt-1 -mr-1 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-gold-400 -mb-1 -ml-1 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-gold-400 -mb-1 -mr-1 rounded-br-lg"></div>

                        {/* Scanning Line Animation */}
                        <div className="absolute left-2 right-2 h-0.5 bg-gold-400 shadow-[0_0_10px_#f2a60d] animate-[bounce_2s_infinite]"></div>
                    </div>
                </div>

                <p className="absolute bottom-20 left-0 right-0 text-center text-sm font-medium text-white/80 drop-shadow-md z-20">
                    Align QR code within the frame
                </p>
            </div>
        </div>
    );
};

export const StaffApp: React.FC<StaffProps> = ({ user, onGrantSpins, onRedeemCoupon }) => {
    const { state, actions } = useAppStore(); // Access store directly for lookup logic
    const [activeTab, setActiveTab] = useState<'loyalty' | 'redeem'>('loyalty');

    // Loyalty Tab State
    const [lookupId, setLookupId] = useState('');
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const [loadedUser, setLoadedUser] = useState<User | null>(null);
    const [billAmount, setBillAmount] = useState<string>('');

    // Redeem Tab State
    const [couponCode, setCouponCode] = useState('');

    const [lastAction, setLastAction] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    // Scanner State
    const [showScanner, setShowScanner] = useState(false);
    const [scanType, setScanType] = useState<'customer' | 'coupon'>('customer');

    const handleLookup = async (idOrEvent?: string | React.SyntheticEvent) => {
        const searchTerm = (typeof idOrEvent === 'string' ? idOrEvent : lookupId).trim().toUpperCase();

        if (!searchTerm) return;

        actions.setLoading(true);
        setIsUnauthorized(false);
        try {
            console.log('[Debug] Calling findUser with:', searchTerm);
            const result = await actions.findUser(searchTerm);
            console.log('[Debug] findUser result:', result);

            if (result.success && result.user) {
                // UI Verification
                // alert(`Verify: User Found - ${result.user.name} (${result.user.publicId})`);
                setLoadedUser(result.user);
                setLastAction({ msg: `Found: ${result.user.name} (${result.user.publicId})`, type: 'success' });
                setLookupId(searchTerm);
            } else {
                setLoadedUser(null);
                const detail = result.message || 'unknown error';
                setLastAction({ msg: `Customer not found (${searchTerm})`, type: 'error' });

                if (detail.includes('UNAUTHORIZED') || detail.includes('Staff role')) {
                    setIsUnauthorized(true);
                }
            }
        } catch (e) {
            alert(`[Debug] Exception: ${(e as Error).message}`);
            console.error('Lookup failed', e);
            setLoadedUser(null);
            setLastAction({ msg: 'Lookup failed', type: 'error' });
        } finally {
            actions.setLoading(false);
        }
    };

    const handleBecomeStaff = async () => {
        const res = await actions.becomeStaff();
        if (res.success) {
            setIsUnauthorized(false);
            setLastAction({ msg: "Promoted to Staff! Try searching now.", type: 'success' });
        } else {
            setLastAction({ msg: "Promotion failed: " + res.message, type: 'error' });
        }
    };

    const handleAddPoints = async () => {
        if (!loadedUser) return;
        const amount = parseFloat(billAmount);
        if (isNaN(amount) || amount <= 0) {
            setLastAction({ msg: 'Invalid bill amount', type: 'error' });
            return;
        }

        actions.setLoading(true);
        // RPC Call using public_id via store action adapter
        const result = await actions.grantSpinsByPublicId(user.id, loadedUser.publicId, amount);
        if (result.success) {
            setLastAction({ msg: result.message, type: 'success' });
            setBillAmount('');
            // Re-fetch to show update
            const { data } = await supabase.from('profiles').select('points, spins').eq('id', loadedUser.id).single();
            if (data) {
                setLoadedUser(prev => prev ? ({ ...prev, points: data.points, spins: data.spins }) : null);
            }
        } else {
            setLastAction({ msg: result.message, type: 'error' });
        }
        actions.setLoading(false);
    };

    const handleRedeem = async () => {
        if (!couponCode) return;
        const confirm = window.confirm(`Irreversibly redeem coupon ${couponCode}?`);
        if (confirm) {
            const success = await onRedeemCoupon(couponCode);
            if (success) {
                setLastAction({ msg: `Redeemed coupon ${couponCode}`, type: 'success' });
                setCouponCode('');
            } else {
                setLastAction({ msg: "Coupon invalid or already used", type: 'error' });
            }
        }
    };

    const startScan = (type: 'customer' | 'coupon') => {
        setScanType(type);
        setShowScanner(true);
    };

    const handleScanResult = (result: string) => {
        setShowScanner(false);
        if (scanType === 'customer') {
            handleLookup(result);
        } else {
            setCouponCode(result);
            setLastAction({ msg: "Coupon scanned. Ready to redeem.", type: 'success' });
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-white flex flex-col">

            {showScanner && (
                <QRScannerModal
                    type={scanType}
                    onClose={() => setShowScanner(false)}
                    onScan={handleScanResult}
                />
            )}

            <div className="flex-grow flex justify-center items-start p-4 md:p-10">
                <div className="w-full max-w-[420px] bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">

                    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center size-8 bg-blue-100 text-blue-600 rounded-lg">
                                <span className="material-symbols-outlined">admin_panel_settings</span>
                            </div>
                            <h2 className="text-lg font-bold">Staff Portal</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${user.avatarUrl})` }}></div>
                            <button
                                onClick={async () => {
                                    actions.setLoading(true);
                                    await supabase.auth.signOut();
                                    actions.setUser(null);
                                    window.location.href = '/';
                                }}
                                className="text-xs font-bold text-red-500 hover:text-red-700 underline"
                            >
                                Log Out
                            </button>
                        </div>
                    </header>

                    <div className="px-6 pt-6 pb-2">
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
                            <button
                                onClick={() => { setActiveTab('loyalty'); setLastAction(null); }}
                                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'loyalty' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                Add Points
                            </button>
                            <button
                                onClick={() => { setActiveTab('redeem'); setLastAction(null); }}
                                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'redeem' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                Redeem
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-6 flex flex-col gap-6">

                        {activeTab === 'loyalty' && (
                            <>
                                <div className="text-center">
                                    <h1 className="text-2xl font-bold">Customer Loyalty</h1>
                                    <p className="text-sm text-slate-500 mt-1">Look up customer to add points.</p>
                                </div>

                                {/* Lookup Section */}
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <span className="material-symbols-outlined text-[20px]">id_card</span>
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Customer ID or Email"
                                            value={lookupId}
                                            onChange={(e) => setLookupId(e.target.value.toUpperCase())}
                                            className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-600 outline-none uppercase text-slate-900"
                                        />
                                    </div>
                                    <button
                                        onClick={() => startScan('customer')}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 rounded-xl border border-slate-200"
                                    >
                                        <span className="material-symbols-outlined">qr_code_scanner</span>
                                    </button>
                                    <button onClick={handleLookup} className="bg-slate-900 text-white px-4 rounded-xl font-bold text-sm">Find</button>
                                </div>

                                {loadedUser && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="size-10 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${loadedUser.avatarUrl})` }}></div>
                                            <div>
                                                <p className="font-bold text-slate-900">{loadedUser.name}</p>
                                                <p className="text-xs text-slate-500 font-mono">{loadedUser.publicId}</p>
                                            </div>
                                            <div className="ml-auto text-right">
                                                <p className="text-lg font-bold text-gold-500">{loadedUser.points} pts</p>
                                                <p className="text-xs text-slate-400">{loadedUser.spins} spins</p>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-200 pt-4">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bill Amount</label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        value={billAmount}
                                                        onChange={(e) => setBillAmount(e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-lg focus:ring-2 focus:ring-blue-600 outline-none text-slate-900"
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleAddPoints}
                                                    disabled={!billAmount}
                                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-sm">add</span>
                                                    {Math.floor(parseFloat(billAmount) || 0)} Pts
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-2">$1.00 = 1 Point</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'redeem' && (
                            <>
                                <div className="text-center">
                                    <h1 className="text-2xl font-bold">Redeem Coupon</h1>
                                    <p className="text-sm text-slate-500 mt-1">Scan customer QR or enter code.</p>
                                </div>

                                <button
                                    onClick={() => startScan('coupon')}
                                    className="w-full aspect-[4/2] bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                                >
                                    <div className="size-16 bg-white rounded-full shadow-sm flex items-center justify-center">
                                        <span className="material-symbols-outlined text-3xl text-blue-600">qr_code_scanner</span>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-600">Tap to Scan Camera</span>
                                </button>

                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="ENTER COUPON CODE"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-base font-medium focus:ring-2 focus:ring-blue-600 outline-none uppercase"
                                    />
                                </div>

                                <button
                                    onClick={handleRedeem}
                                    disabled={!couponCode}
                                    className="w-full bg-slate-900 text-white font-bold text-lg py-3.5 rounded-xl shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                                >
                                    Verify & Redeem
                                </button>
                            </>
                        )}

                        {/* Toast/Notification area */}
                        {lastAction && (
                            <div className={`border p-3 rounded-lg text-sm flex flex-col gap-2 animate-bounce ${lastAction.type === 'success' ? 'bg-green-100 border-green-200 text-green-800' : 'bg-red-100 border-red-200 text-red-800'}`}>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined">{lastAction.type === 'success' ? 'check_circle' : 'error'}</span>
                                    <span>{lastAction.msg}</span>
                                </div>
                                {isUnauthorized && (
                                    <button
                                        onClick={handleBecomeStaff}
                                        className="ml-8 self-start text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg font-bold"
                                    >
                                        [DEV] Promote Self to Staff
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};