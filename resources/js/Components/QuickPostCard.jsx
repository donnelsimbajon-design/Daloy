import React, { useRef, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import CreatePostModal from '@/Components/CreatePostModal';
import { Button } from '@/Components/shadcn/button';

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
        <>
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
                        {user?.profile_picture ? (
                            <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <svg className="w-6 h-6 mt-2 ml-[8px] md:ml-[12px] text-ocean-text-dim/50" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
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
                                <Button
                                    type="submit"
                                    disabled={!data.content.trim() || processing}
                                    className="rounded-full font-bold tracking-wide shadow-md px-6 flex"
                                >
                                    Post
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>

        {processing && (
            <div className="bg-ocean-card/50 border border-ocean-border rounded-[18px] p-4 mb-5 shadow-sm animate-pulse flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-ocean-surface shrink-0 ring-1 ring-ocean-divider"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-ocean-surface rounded w-24"></div>
                        <div className="h-2 bg-ocean-surface/60 rounded w-16"></div>
                    </div>
                </div>
                <div className="space-y-2.5 mt-1">
                    <div className="h-3 bg-ocean-surface/80 rounded w-full"></div>
                    <div className="h-3 bg-ocean-surface/80 rounded w-[90%]"></div>
                    <div className="h-3 bg-ocean-surface/80 rounded w-[60%]"></div>
                </div>
                <div className="h-8 bg-ocean-surface/30 rounded-lg w-full mt-2 border border-ocean-divider/50"></div>
            </div>
        )}
        </>
    );
}
