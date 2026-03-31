import React, { useState } from 'react';
import CreatePostModal from '@/Components/Features/Posts/CreatePostModal';

export default function FloatingActionButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-14 h-14 rounded-full bg-biolum text-white hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center group"
            >
                <svg className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>


            </button>

            <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}
