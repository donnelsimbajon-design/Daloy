import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ShieldAlert, LogOut, Mail, CheckCircle } from 'lucide-react';

export default function Banned({ ban_reason, banned_at, banned_until }) {
    const { flash } = usePage().props;

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <Head title="Account Banned | Daloy" />
            
            {/* Background Aesthetic */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-red-600 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-zinc-800 rounded-full blur-[150px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                {flash?.message && (
                    <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        {flash.message}
                    </div>
                )}
                <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                    
                    {/* Top Strip */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>

                    {/* Header */}
                    <div className="flex flex-col items-center text-center space-y-4 mb-8 mt-2">
                        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center">
                            <ShieldAlert className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Account Suspended</h1>
                            <p className="text-zinc-400 mt-2 text-sm max-w-sm mx-auto">
                                We have restricted access to your Daloy account due to a violation of our community standards.
                            </p>
                        </div>
                    </div>

                    {/* Ban Details Box */}
                    <div className="bg-black border border-zinc-800 rounded-xl p-5 mb-8">
                        <div className="mb-4">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Reason for Suspension</h3>
                            <p className="text-white text-sm font-medium">{ban_reason || 'Violation of community guidelines.'}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 border-t border-zinc-800 pt-4">
                            <div>
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Date Issued</h3>
                                <p className="text-zinc-300 text-sm">{banned_at || 'Recently'}</p>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Access Restored</h3>
                                <p className="text-red-400 text-sm font-semibold">{banned_until || 'Indefinitely'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <a 
                            href="/logout"
                            className="w-full py-3 px-4 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <LogOut className="w-4 h-4" />
                            Log Out Securely
                        </a>
                        
                        <Link 
                            href="/banned/appeal"
                            className="w-full py-3 px-4 bg-transparent hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <Mail className="w-4 h-4" />
                            Appeal Suspension
                        </Link>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <p className="text-zinc-600 text-xs font-mono">
                        Daloy Automated Moderation System
                    </p>
                </div>
            </div>
        </div>
    );
}
