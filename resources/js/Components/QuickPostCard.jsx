import React, { useRef, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import CreatePostModal from '@/Components/CreatePostModal';

export default function QuickPostCard() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [isFocused, setIsFocused] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const textareaRef = useRef(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        content: '',
        visibility: 'public',
        location_tag: '',
        flow_velocity: 'steady',
        media: [],
        poll_question: '',
        poll_options: ['', ''],
        poll_expires_at: '',
        has_content_warning: false,
        content_warning_label: '',
        comment_permission: 'everyone',
        repost_of_id: null,
    });

    const handleQuickSubmit = (e) => {
        e.preventDefault();
        if (!data.content.trim()) return;

        post('/posts', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setIsFocused(false);
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                }
            },
        });
    };

    const handleInput = (e) => {
        setData('content', e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    return (
        <div className="bg-ocean-card border border-ocean-border rounded-2xl p-4 md:p-5 mb-6 shadow-sm relative transition-all duration-300">
            {processing && (
                <div className="absolute inset-0 bg-ocean-card/60 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                    <div className="w-8 h-8 border-2 border-biolum border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            <form onSubmit={handleQuickSubmit}>
                <div className="flex gap-3 md:gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden shrink-0 border border-ocean-border/50 bg-ocean-deep">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-biolum/10 text-biolum font-bold font-heading text-lg">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="flex-1 right-0 pt-1">
                        <textarea
                            ref={textareaRef}
                            value={data.content}
                            onChange={handleInput}
                            onClick={() => setIsFocused(true)}
                            placeholder="What's floating in your thoughts?"
                            className="w-full bg-transparent border-none text-ocean-text placeholder-ocean-text-dim text-lg md:text-xl resize-none focus:ring-0 p-0 m-0 leading-relaxed overflow-hidden"
                            style={{ minHeight: '32px' }}
                            rows={1}
                        />

                        {errors.content && (
                            <p className="text-rose-500 text-sm mt-2">{errors.content}</p>
                        )}

                        {/* Collapsible Actions Area */}
                        <div className={`transition-all duration-300 ease-in-out origin-top overflow-hidden flex items-center justify-between mt-3 ${isFocused || data.content ? 'opacity-100 max-h-20 scale-y-100' : 'opacity-0 max-h-0 scale-y-0'}`}>
                            
                            {/* Rich Media Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(true)}
                                    className="p-2 text-ocean-text-dim hover:text-biolum hover:bg-biolum/10 rounded-full transition-colors group relative"
                                    title="Add Photo or Video"
                                >
                                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(true)}
                                    className="p-2 text-ocean-text-dim hover:text-teal-400 hover:bg-teal-400/10 rounded-full transition-colors hidden sm:block"
                                    title="Create a Poll"
                                >
                                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
                                    </svg>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(true)}
                                    className="hidden sm:flex items-center justify-center p-2 text-ocean-text-dim hover:text-biolum text-xs font-semibold rounded-full hover:bg-biolum/10 transition-colors"
                                >
                                    Options...
                                </button>
                            </div>

                            {/* Submit */}
                            <div className="flex items-center gap-3">
                                {data.content.length > 0 && (
                                    <span className={`text-xs font-semibold ${data.content.length > 500 ? 'text-rose-500' : 'text-ocean-text-dim'}`}>
                                        {data.content.length}/500
                                    </span>
                                )}
                                <button
                                    type="submit"
                                    disabled={!data.content.trim() || processing}
                                    className={`px-5 py-2 md:px-6 md:py-2 rounded-full font-bold text-sm tracking-wide transition-all ${
                                        data.content.trim() 
                                            ? 'bg-biolum text-ocean-deep hover:bg-biolum-bright active:scale-95 shadow-[0_4px_12px_rgba(var(--color-biolum-rgb),0.3)]' 
                                            : 'bg-ocean-deep border border-ocean-border text-ocean-text-dim cursor-not-allowed hidden sm:block'
                                    }`}
                                >
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
