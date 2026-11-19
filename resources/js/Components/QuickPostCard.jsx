import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import CreatePostModal from '@/Components/CreatePostModal';

export default function QuickPostCard() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="daloy-composer bg-ocean-card border border-ocean-border rounded-2xl p-4 mb-6 relative transition-all duration-200">
                <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-ocean-border/50 bg-ocean-deep">
                        {user?.profile_picture ? (
                            <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-ocean-text font-bold bg-ocean-deep">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Fake Input Trigger */}
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 bg-ocean-surface/50 hover:bg-ocean-surface hover:brightness-95 transition-all rounded-full px-4 flex items-center text-ocean-text-dim text-left focus:outline-none"
                    >
                        <span className="text-[15px]">What's floating in your thoughts, {user?.name?.split(' ')[0]}?</span>
                    </button>
                </div>

                {/* Divider */}
                <div className="h-[1px] w-full bg-ocean-divider-subtle my-3" />

                {/* Actions Toolbar */}
                <div className="flex items-center justify-evenly">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface transition-colors font-semibold text-sm"
                    >
                        <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                        </svg>
                        Photo/Video
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface transition-colors font-semibold text-sm"
                    >
                        <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.866 8.21 8.21 0 0 0 3 2.48Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                        </svg>
                        Flow State
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface transition-colors font-semibold text-sm"
                    >
                        <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6Z" />
                        </svg>
                        Create Poll
                    </button>
                </div>
            </div>

            <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}
