import React from 'react';

export default function StatusBar() {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-ocean-deep/92 backdrop-blur-sm border-t border-ocean-divider shadow-[0_-1px_2px_rgba(0,0,0,0.03),0_-2px_6px_rgba(0,0,0,0.015)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-8">
                <div className="hidden sm:flex items-center gap-2">
                    <span className="text-[10px] font-mono text-ocean-text-dim tracking-wider uppercase">
                        Node: DX244-Daloy
                    </span>
                    <span className="text-ocean-text-dim text-[10px]">·</span>
                    <span className="text-[10px] font-mono text-ocean-text-dim tracking-wider uppercase">
                        Status: Synchronized
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    <span className="text-[10px] font-mono text-ocean-text-dim tracking-wider uppercase">
                        42,198 Active Voyagers
                    </span>
                </div>
            </div>
        </div>
    );
}
