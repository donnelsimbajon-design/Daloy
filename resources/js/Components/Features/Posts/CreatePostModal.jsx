import React, { useState, useRef, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';

export default function CreatePostModal({ isOpen, onClose }) {
    const user = usePage().props?.auth?.user;
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const [mediaPreviews, setMediaPreviews] = useState([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        content: '',
        visibility: 'public',
        location_tag: '',
        flow_velocity: 'steady',
        media: [],
    });

    // Focus textarea when modal opens
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            setTimeout(() => textareaRef.current?.focus(), 200);
        }
    }, [isOpen]);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        const currentCount = data.media.length;
        const remaining = 4 - currentCount;
        const newFiles = files.slice(0, remaining);

        if (newFiles.length === 0) return;

        // Add files to form data
        setData('media', [...data.media, ...newFiles]);

        // Generate previews
        newFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setMediaPreviews((prev) => [
                    ...prev,
                    {
                        url: ev.target.result,
                        type: file.type.startsWith('video/') ? 'video' : 'image',
                        name: file.name,
                    },
                ]);
            };
            reader.readAsDataURL(file);
        });

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeMedia = (index) => {
        setData('media', data.media.filter((_, i) => i !== index));
        setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Build FormData for file uploads
        const formData = new FormData();
        formData.append('content', data.content || '');
        formData.append('visibility', data.visibility);
        formData.append('location_tag', data.location_tag || '');
        formData.append('flow_velocity', data.flow_velocity);
        data.media.forEach((file, i) => {
            formData.append(`media[${i}]`, file);
        });

        post('/posts', {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                reset();
                setMediaPreviews([]);
                onClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        setMediaPreviews([]);
        onClose();
    };

    if (!isOpen) return null;

    const visibilityOptions = [
        {
            value: 'public', label: 'Public', icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" />
                </svg>
            )
        },
        {
            value: 'followers', label: 'Followers', icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
            )
        },
        {
            value: 'private', label: 'Private', icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
            )
        },
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
            <div className="fixed inset-0 z-[61] flex items-start justify-center pt-16 sm:pt-24 px-4">
                <div
                    className="w-full max-w-xl bg-ocean-deep border border-ocean-border rounded-2xl overflow-hidden animate-in"
                    onClick={(e) => e.stopPropagation()}
                    style={{ animation: 'slideUp 0.25s ease-out' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-ocean-border">
                        <h2 className="text-lg font-bold text-ocean-text">Create Post</h2>
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-lg text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit}>
                        <div className="p-5">
                            {/* User info row */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-biolum flex items-center justify-center text-white font-bold text-sm ring-2 ring-biolum/30">
                                    {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-ocean-text">{user?.name || 'You'}</p>
                                    <p className="text-xs text-ocean-text-dim">@{user?.username || 'user'}</p>
                                </div>
                            </div>

                            {/* Textarea */}
                            <textarea
                                ref={textareaRef}
                                value={data.content}
                                onChange={(e) => setData('content', e.target.value)}
                                placeholder="What's flowing through your mind?"
                                rows={4}
                                maxLength={2000}
                                className="w-full bg-transparent text-ocean-text placeholder-ocean-text-dim text-sm leading-relaxed resize-none focus:outline-none border-none p-0"
                                style={{ minHeight: '100px' }}
                            />
                            <div className="flex justify-between items-center mt-1">
                                {errors.content && (
                                    <p className="text-xs text-rose-400">{errors.content}</p>
                                )}
                                <span className={`text-xs ml-auto ${data.content.length > 1900 ? 'text-rose-400' : 'text-ocean-text-dim'}`}>
                                    {data.content.length}/2000
                                </span>
                            </div>

                            {/* Media Previews */}
                            {mediaPreviews.length > 0 && (
                                <div className={`grid gap-[2px] mt-4 rounded-xl overflow-hidden border border-ocean-border bg-ocean-border/30 w-full ${
                                    mediaPreviews.length === 1 ? 'grid-cols-1 grid-rows-1' :
                                    mediaPreviews.length === 2 ? 'grid-cols-2 grid-rows-1 aspect-[16/9]' :
                                    mediaPreviews.length === 3 ? 'grid-cols-2 grid-rows-2 aspect-[16/9]' :
                                    'grid-cols-2 grid-rows-2 aspect-[4/3]' // 4 items
                                }`}>
                                    {mediaPreviews.slice(0, 4).map((preview, index) => (
                                        <div key={index} className={`relative w-full h-full bg-ocean-deep/50 group/media ${
                                            mediaPreviews.length === 3 && index === 0 ? 'row-span-2' : ''
                                        } ${mediaPreviews.length === 1 ? 'max-h-[400px]' : 'min-h-[100px]'}`}>
                                            {preview.type === 'video' ? (
                                                <video
                                                    src={preview.url}
                                                    className={`w-full h-full object-contain bg-black/95 ${mediaPreviews.length === 1 ? 'max-h-[400px] block' : 'absolute inset-0'}`}
                                                    muted
                                                />
                                            ) : (
                                                <img
                                                    src={preview.url}
                                                    alt={preview.name}
                                                    className={`w-full h-full object-cover ${mediaPreviews.length === 1 ? 'max-h-[400px] block' : 'absolute inset-0'}`}
                                                />
                                            )}
                                            {/* Remove button */}
                                            <button
                                                type="button"
                                                onClick={() => removeMedia(index)}
                                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-rose-500 transition-colors opacity-0 group-hover/media:opacity-100"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                            {preview.type === 'video' && (
                                                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-medium">
                                                    VIDEO
                                                </div>
                                            )}
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
                        </div>

                        {/* Divider */}
                        <div className="border-t border-ocean-border" />

                        {/* Toolbar */}
                        <div className="px-5 py-3 space-y-3">
                            {/* Action buttons row */}
                            <div className="flex items-center gap-1">
                                {/* Image/Video upload */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={data.media.length >= 4}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-ocean-text-muted hover:text-biolum hover:bg-biolum/10 transition-all text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                                    </svg>
                                    Media
                                    {data.media.length > 0 && (
                                        <span className="text-[10px] text-biolum">({data.media.length}/4)</span>
                                    )}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/mov,video/webm"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />

                                {/* Location */}
                                <button
                                    type="button"
                                    onClick={() => setData('location_tag', data.location_tag === null ? '' : data.location_tag)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-ocean-text-muted hover:text-biolum hover:bg-biolum/10 transition-all text-xs font-medium"
                                >
                                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                    </svg>
                                    Location
                                </button>
                            </div>

                            {/* Visibility + Velocity row */}
                            <div className="flex items-center justify-between gap-3">
                                {/* Visibility selector */}
                                <div className="flex items-center gap-1 bg-ocean-surface/50 rounded-xl p-0.5">
                                    {visibilityOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setData('visibility', opt.value)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${data.visibility === opt.value
                                                ? 'bg-biolum/20 text-biolum'
                                                : 'text-ocean-text-dim hover:text-ocean-text'
                                                }`}
                                        >
                                            {opt.icon}
                                            <span className="hidden sm:inline">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Flow velocity */}
                                <select
                                    value={data.flow_velocity}
                                    onChange={(e) => setData('flow_velocity', e.target.value)}
                                    className="bg-ocean-surface/50 border border-ocean-border rounded-xl px-3 py-1.5 text-xs text-ocean-text-muted focus:outline-none focus:border-biolum/50 cursor-pointer"
                                >
                                    {velocityOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="px-5 pb-5">
                            <button
                                type="submit"
                                disabled={processing || (!data.content.trim() && data.media.length === 0)}
                                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-biolum hover:bg-biolum-bright transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Posting...
                                    </span>
                                ) : (
                                    'Cast into the Flow'
                                )}
                            </button>
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
