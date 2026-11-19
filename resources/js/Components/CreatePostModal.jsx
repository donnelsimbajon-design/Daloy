import React, { useState, useRef, useEffect } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import { Globe2, Users2, Heart, Lock, Flame, Waves, Snail, Sparkles } from 'lucide-react';

export default function CreatePostModal({ isOpen, onClose }) {
    const user = usePage().props?.auth?.user;
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const [mediaPreviews, setMediaPreviews] = useState([]);
    const [showPollBuilder, setShowPollBuilder] = useState(false);
    const [showCwInput, setShowCwInput] = useState(false);
    const [showVisMenu, setShowVisMenu] = useState(false);
    const [showVelMenu, setShowVelMenu] = useState(false);

    const { data, setData, processing, errors, reset } = useForm({
        content: '',
        visibility: 'public',
        location_tag: '',
        flow_velocity: 'steady',
        media: [],
        // New fields
        poll_question: '',
        poll_options: ['Yes', 'No'],
        poll_expires_at: '',
        has_content_warning: false,
        content_warning_label: '',
        comment_permission: 'everyone',
        repost_of_id: null,
    });

    // Focus textarea when modal opens, and reset state when modal closes
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            setTimeout(() => textareaRef.current?.focus(), 200);
        }
        if (!isOpen) {
            reset();
            setMediaPreviews([]);
            setShowPollBuilder(false);
            setShowCwInput(false);
        }
    }, [isOpen]);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (data.media.length + files.length > 4) {
            alert('You can only upload up to 4 media files');
            return;
        }

        setData('media', [...data.media, ...files]);

        const newPreviews = files.map(file => ({
            url: URL.createObjectURL(file),
            type: file.type.startsWith('video/') ? 'video' : 'image'
        }));
        setMediaPreviews(prev => [...prev, ...newPreviews]);

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeMedia = (index) => {
        setData('media', data.media.filter((_, i) => i !== index));
        setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const addPollOption = () => {
        if (data.poll_options.length < 4) {
            setData('poll_options', [...data.poll_options, '']);
        }
    };

    const removePollOption = (index) => {
        if (data.poll_options.length > 2) {
            setData('poll_options', data.poll_options.filter((_, i) => i !== index));
        }
    };

    const updatePollOption = (index, value) => {
        const updated = [...data.poll_options];
        updated[index] = value;
        setData('poll_options', updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('content', data.content || '');
        formData.append('visibility', data.visibility || 'public');
        formData.append('location_tag', data.location_tag || '');
        formData.append('flow_velocity', data.flow_velocity || 'steady');
        formData.append('comment_permission', data.comment_permission || 'everyone');
        
        data.media.forEach((file, i) => {
            formData.append(`media[${i}]`, file);
        });

        if (data.has_content_warning) {
            formData.append('has_content_warning', '1');
            formData.append('content_warning_label', data.content_warning_label || '');
        }

        if (showPollBuilder && (data.poll_question.trim() || data.poll_options.some(opt => opt.trim()))) {
            formData.append('poll_question', data.poll_question.trim() || 'Poll');
            data.poll_options.filter(o => o.trim()).forEach((opt, i) => {
                formData.append(`poll_options[${i}]`, opt);
            });
            if (data.poll_expires_at) {
                formData.append('poll_expires_at', data.poll_expires_at);
            }
        }

        if (data.repost_of_id) {
            formData.append('repost_of_id', data.repost_of_id);
        }

        router.post('/posts', formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setMediaPreviews([]);
                setShowPollBuilder(false);
                setShowCwInput(false);
                onClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        setMediaPreviews([]);
        setShowPollBuilder(false);
        setShowCwInput(false);
        onClose();
    };

    if (!isOpen) return null;

    const visibilityOptions = [
        { value: 'public', label: 'Public' },
        { value: 'followers', label: 'Followers' },
        { value: 'close_friends', label: 'Close' },
        { value: 'private', label: 'Private' },
    ];

    const velocityOptions = [
        { value: 'high', label: 'High' },
        { value: 'steady', label: 'Steady' },
        { value: 'low', label: 'Low' },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 sm:p-6" onClick={() => { setShowVisMenu(false); setShowVelMenu(false); }}>
                <div
                    className="w-full max-w-[600px] h-full max-h-[85vh] bg-ocean-card border border-ocean-border sm:rounded-3xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] dark:shadow-[0_0_40px_rgba(255,255,255,0.06)] flex flex-col animate-in"
                    onClick={(e) => e.stopPropagation()}
                    style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                    {/* Header (Fixed) */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-ocean-border shrink-0">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleClose}
                                aria-label="Close post composer"
                                className="p-2 -ml-2 rounded-full text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <h2 className="text-[17px] font-bold text-ocean-text">Draft</h2>
                        </div>
                        
                        {/* Compact Top-Right Post Button */}
                        <button
                            type="button"
                            onClick={(e) => document.getElementById('actual-submit-btn').click()}
                            disabled={processing || (!data.content.trim() && data.media.length === 0 && !showPollBuilder)}
                            className="px-5 py-1.5 rounded-full text-[13px] font-bold text-white bg-biolum hover:bg-biolum-bright transition-all disabled:opacity-40 disabled:bg-ocean-surface disabled:text-ocean-text-dim border disabled:border-transparent sm:hidden block"
                        >
                            Post
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="p-6 flex-1 overflow-y-auto scrollbar-hide shrink-0">
                            {/* User info row */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-11 h-11 rounded-full bg-ocean-surface overflow-hidden border border-ocean-border/50 shrink-0">
                                    {user?.profile_picture ? (
                                        <img src={user.profile_picture} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-ocean-text font-bold text-sm bg-ocean-deep">
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 pt-1">
                                    <div className="flex items-center gap-1.5 relative group">
                                        <p className="text-[15px] font-bold text-ocean-text leading-none">{user?.name || 'You'}</p>
                                        <div className="relative" onClick={(e) => { e.stopPropagation(); setShowVisMenu(!showVisMenu); setShowVelMenu(false); }}>
                                            <div className="flex items-center gap-1 bg-ocean-surface/50 hover:bg-ocean-surface/80 rounded-full px-2 py-1 cursor-pointer transition-colors relative z-10 w-auto">
                                                {data.visibility === 'public' && <Globe2 className="w-3.5 h-3.5 text-biolum" />}
                                                {data.visibility === 'followers' && <Users2 className="w-3.5 h-3.5 text-biolum" />}
                                                {data.visibility === 'close_friends' && <Heart className="w-3.5 h-3.5 text-rose-400" />}
                                                {data.visibility === 'private' && <Lock className="w-3.5 h-3.5 text-ocean-text-dim" />}
                                                <span className="text-biolum text-xs font-bold pl-0 pr-1 select-none">
                                                    {visibilityOptions.find(o => o.value === data.visibility)?.label}
                                                </span>
                                                <svg className={`w-3 h-3 text-ocean-text-dim transition-transform ${showVisMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>

                                            {showVisMenu && (
                                                <div className="absolute top-full left-0 mt-1 w-36 bg-ocean-deep border border-ocean-border rounded-xl shadow-xl overflow-hidden z-[100] py-1">
                                                    {visibilityOptions.map(opt => (
                                                        <button
                                                            type="button"
                                                            key={opt.value}
                                                            className={`w-full text-left px-3 py-2 hover:bg-ocean-surface transition-colors flex items-center gap-2 ${data.visibility === opt.value ? 'bg-ocean-surface/50 font-bold text-ocean-text' : 'text-ocean-text-dim font-medium'}`}
                                                            onClick={(e) => { e.stopPropagation(); setData('visibility', opt.value); setShowVisMenu(false); }}
                                                        >
                                                            {opt.value === 'public' && <Globe2 className="w-3.5 h-3.5" />}
                                                            {opt.value === 'followers' && <Users2 className="w-3.5 h-3.5" />}
                                                            {opt.value === 'close_friends' && <Heart className="w-3.5 h-3.5" />}
                                                            {opt.value === 'private' && <Lock className="w-3.5 h-3.5" />}
                                                            <span className="text-[13px]">{opt.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Textarea */}
                                    <div className="mt-3">
                                        <textarea
                                            ref={textareaRef}
                                            value={data.content}
                                            onChange={(e) => setData('content', e.target.value)}
                                            placeholder="What's flowing through your mind?"
                                            rows={2}
                                            maxLength={2000}
                                            className="w-full bg-transparent text-ocean-text placeholder-ocean-text-dim text-[16px] xl:text-[18px] leading-relaxed resize-none focus:outline-none border-none p-0 overflow-hidden"
                                            style={{ minHeight: '60px' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Media Previews - Bounded Height */}
                            {mediaPreviews.length > 0 && (
                                <div className={`ml-14 grid gap-1 mt-2 rounded-[20px] overflow-hidden border border-ocean-border bg-ocean-border/30 w-[calc(100%-3.5rem)] ${
                                    mediaPreviews.length === 1 ? 'grid-cols-1 grid-rows-1' :
                                    mediaPreviews.length === 2 ? 'grid-cols-2 grid-rows-1 aspect-[16/9]' :
                                    mediaPreviews.length === 3 ? 'grid-cols-2 grid-rows-2 aspect-[16/9]' :
                                    'grid-cols-2 grid-rows-2 aspect-[4/3]'
                                }`}>
                                    {mediaPreviews.slice(0, 4).map((preview, index) => (
                                        <div key={index} className={`relative w-full h-full bg-ocean-deep/50 group/media ${
                                            mediaPreviews.length === 3 && index === 0 ? 'row-span-2' : ''
                                        } ${mediaPreviews.length === 1 ? 'max-h-[350px]' : 'min-h-[100px]'}`}>
                                            {preview.type === 'video' ? (
                                                <video
                                                    src={preview.url}
                                                    className={`w-full h-full object-cover bg-black/95 ${mediaPreviews.length === 1 ? 'max-h-[350px] block' : 'absolute inset-0'}`}
                                                    muted
                                                />
                                            ) : (
                                                <img
                                                    src={preview.url}
                                                    alt={preview.name}
                                                    className={`w-full h-full object-cover ${mediaPreviews.length === 1 ? 'max-h-[350px] block' : 'absolute inset-0'}`}
                                                />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeMedia(index)}
                                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-rose-500 transition-colors opacity-100 sm:opacity-0 group-hover/media:opacity-100"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Location Tag */}
                            {data.location_tag !== null && (
                                <div className="mt-4">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            value={data.location_tag}
                                            onChange={(e) => setData('location_tag', e.target.value)}
                                            placeholder="Add location..."
                                            className="flex-1 bg-transparent text-sm text-ocean-text placeholder-ocean-text-dim focus:outline-none border-none p-0"
                                        />
                                    </div>
                                </div>
                            )}
                            {/* Poll Builder */}
                            {showPollBuilder && (
                                <div className="mt-4 p-3 bg-ocean-surface/40 border border-ocean-divider rounded-xl space-y-2">
                                    <input
                                        type="text"
                                        value={data.poll_question}
                                        onChange={(e) => setData('poll_question', e.target.value)}
                                        placeholder="Ask a question..."
                                        maxLength={500}
                                        className="w-full bg-transparent text-sm text-ocean-text placeholder-ocean-text-dim focus:outline-none border-none p-0 font-semibold"
                                    />
                                    {data.poll_options.map((opt, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => updatePollOption(i, e.target.value)}
                                                placeholder={`Option ${i + 1}`}
                                                maxLength={200}
                                                className="flex-1 bg-ocean-surface/60 border border-ocean-border rounded-lg px-3 py-1.5 text-xs text-ocean-text placeholder-ocean-text-dim focus:outline-none focus:ring-1 focus:ring-biolum/40"
                                            />
                                            {data.poll_options.length > 2 && (
                                                <button type="button" onClick={() => removePollOption(i)} className="text-ocean-text-dim hover:text-rose-400 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2">
                                        {data.poll_options.length < 4 && (
                                            <button type="button" onClick={addPollOption} className="text-xs text-biolum hover:text-biolum-bright font-medium">+ Add option</button>
                                        )}
                                        <input
                                            type="datetime-local"
                                            value={data.poll_expires_at}
                                            onChange={(e) => setData('poll_expires_at', e.target.value)}
                                            className="ml-auto bg-ocean-surface/60 border border-ocean-border rounded-lg px-2 py-1 text-[10px] text-ocean-text-dim focus:outline-none"
                                            placeholder="Expires"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Content Warning Input */}
                            {showCwInput && (
                                <div className="mt-3 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                                    <input
                                        type="text"
                                        value={data.content_warning_label}
                                        onChange={(e) => { setData('content_warning_label', e.target.value); setData('has_content_warning', true); }}
                                        placeholder="Describe the content warning..."
                                        maxLength={100}
                                        className="flex-1 bg-ocean-surface/60 border border-amber-500/20 rounded-lg px-3 py-1.5 text-xs text-ocean-text placeholder-ocean-text-dim focus:outline-none focus:ring-1 focus:ring-amber-400/40"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Footer / Toolbar (Fixed) */}
                        <div className="px-5 py-4 border-t border-ocean-border shrink-0 flex items-center justify-between">
                            {/* Left: Minimalist action icons */}
                            <div className="flex items-center gap-0 sm:gap-1 text-biolum">
                                {/* Media Tool */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    aria-label="Add photo or video"
                                    disabled={data.media.length >= 4}
                                    className="p-2.5 rounded-full hover:bg-biolum/10 transition-colors disabled:opacity-30 tooltip-trigger relative group"
                                >
                                    <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                                    </svg>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/mov,video/webm"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />

                                {/* Location Tool */}
                                <button
                                    type="button"
                                    onClick={() => setData('location_tag', data.location_tag === null ? '' : data.location_tag)}
                                    className="p-2.5 rounded-full hover:bg-biolum/10 transition-colors"
                                >
                                    <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                    </svg>
                                </button>

                                {/* Poll Tool */}
                                <button
                                    type="button"
                                    onClick={() => setShowPollBuilder(!showPollBuilder)}
                                    aria-label="Add poll"
                                    aria-expanded={showPollBuilder}
                                    className={`p-2.5 rounded-full transition-colors ${showPollBuilder ? 'bg-biolum/10' : 'hover:bg-biolum/10'}`}
                                >
                                    <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                                    </svg>
                                </button>
                                
                                {/* Flow Velocity Tool */}
                                <div className="ml-2 relative" onClick={(e) => { e.stopPropagation(); setShowVelMenu(!showVelMenu); setShowVisMenu(false); }}>
                                    <div className="flex items-center gap-1.5 bg-transparent hover:bg-ocean-surface border border-ocean-border rounded-full pl-2.5 pr-2 py-1 transition-colors cursor-pointer relative z-10">
                                        {data.flow_velocity === 'high' && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                                        {data.flow_velocity === 'steady' && <Waves className="w-3.5 h-3.5 text-biolum" />}
                                        {data.flow_velocity === 'low' && <Snail className="w-3.5 h-3.5 text-ocean-text-dim" />}
                                        <span className="text-ocean-text-dim text-[11px] font-bold pr-1 select-none">
                                            {velocityOptions.find(o => o.value === data.flow_velocity)?.label}
                                        </span>
                                        <svg className={`w-2.5 h-2.5 text-ocean-text-dim transition-transform ${showVelMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>

                                    {showVelMenu && (
                                        <div className="absolute bottom-full left-0 mb-1 w-32 bg-ocean-deep border border-ocean-border rounded-xl shadow-xl overflow-hidden z-[100] py-1">
                                            {velocityOptions.map(opt => (
                                                <button
                                                    type="button"
                                                    key={opt.value}
                                                    className={`w-full text-left px-3 py-2 hover:bg-ocean-surface transition-colors flex items-center gap-2 ${data.flow_velocity === opt.value ? 'bg-ocean-surface/50 font-bold text-ocean-text' : 'text-ocean-text-dim font-medium'}`}
                                                    onClick={(e) => { e.stopPropagation(); setData('flow_velocity', opt.value); setShowVelMenu(false); }}
                                                >
                                                    {opt.value === 'high' && <Flame className="w-3 h-3 text-orange-400" />}
                                                    {opt.value === 'steady' && <Waves className="w-3 h-3 text-biolum" />}
                                                    {opt.value === 'low' && <Snail className="w-3 h-3 text-ocean-text-dim" />}
                                                    <span className="text-[12px]">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Right: Info and Main Submit Button */}
                            <div className="flex items-center gap-3">
                                {data.content.length > 0 && (
                                    <span className={`text-[12px] font-medium ${data.content.length > 1900 ? 'text-rose-500' : 'text-ocean-text-dim'}`}>
                                        {data.content.length}/2000
                                    </span>
                                )}
                                <button
                                    id="actual-submit-btn"
                                    type="submit"
                                    disabled={processing || (!data.content.trim() && data.media.length === 0 && !showPollBuilder)}
                                    className="px-4 sm:px-6 py-2 rounded-full text-[14px] font-bold text-white bg-biolum hover:bg-biolum-bright transition-all duration-200 disabled:opacity-40 disabled:bg-ocean-surface disabled:text-ocean-text-dim border disabled:border-transparent shadow-md hidden sm:flex items-center gap-1.5"
                                >
                                    {processing ? '...' : (
                                        <>
                                            Post
                                            <Sparkles className="w-3.5 h-3.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Animation keyframe */}
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </>
    );
}
