import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePage } from '@inertiajs/react';
import axios from 'axios';


export default function StoryRail({ horizontal = false, hidden = false, forcedStoryUserId = null, onCloseForced = null }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const [stories, setStories] = useState([]);
    const [groupedStories, setGroupedStories] = useState([]);
    const [selectedStory, setSelectedStory] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [likedStories, setLikedStories] = useState({});
    // Story Creation States
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creationType, setCreationType] = useState('photo'); // 'photo' or 'text'
    const [creationFile, setCreationFile] = useState(null);
    const [creationPreview, setCreationPreview] = useState(null);
    const [creationVisibility, setCreationVisibility] = useState('friends');
    const [creationCaption, setCreationCaption] = useState('');
    // Draggable text state
    const [textPos, setTextPos] = useState({ x: 50, y: 50 }); // percentage-based position
    const [textFontSize, setTextFontSize] = useState(24);
    const [isDraggingText, setIsDraggingText] = useState(false);
    const [textBg, setTextBg] = useState('none'); // 'none', 'dark', 'light'
    const previewRef = useRef(null);
    const dragStartRef = useRef(null);
    
    // Facebook-style interactions
    const [replyText, setReplyText] = useState('');
    const [replySent, setReplySent] = useState(false);
    const [replyError, setReplyError] = useState(false);
    const [storyViewers, setStoryViewers] = useState([]);
    const [showViewers, setShowViewers] = useState(false);
    // Live state — view count + likers (owner only)
    const [liveViewCount, setLiveViewCount] = useState(null);
    const [liveLikers, setLiveLikers] = useState([]);
    const livePollingRef = useRef(null);

    const fileInputRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const fetchStories = async () => {
        try {
            const res = await axios.get('/stories');
            setStories(res.data);
            
            // Group stories by user
            const groupsMap = res.data.reduce((acc, story) => {
                if (!acc[story.user.id]) {
                    acc[story.user.id] = { user: story.user, items: [] };
                }
                acc[story.user.id].items.push(story);
                return acc;
            }, {});
            setGroupedStories(Object.values(groupsMap));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchStories().then(() => {
            const urlParams = new URL(window.location.href).searchParams;
            const openStory = urlParams.get('open_story');
            if (openStory) {
                // we need to wait for groupedStories to be set by fetchStories
                // It's handled in the next effect
            }
        });
    }, []);

    // Initialize local likes state from fetched stories and handle URL parameter
    useEffect(() => {
        if (stories.length > 0) {
            const likes = {};
            stories.forEach(s => likes[s.id] = s.is_liked);
            setLikedStories(likes);
        }
        
        // Auto-open story from URL parameter or forced prop
        if (groupedStories.length > 0) {
            const urlParams = new URL(window.location.href).searchParams;
            const openStoryId = forcedStoryUserId || urlParams.get('open_story');
            if (openStoryId && !selectedStory) {
                const group = groupedStories.find(g => g.user.id == openStoryId);
                if (group) {
                    setSelectedStory(group.items[0]);
                    // remove param if it was from URL
                    if (!forcedStoryUserId) {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                } else if (forcedStoryUserId && onCloseForced) {
                    // if forced user has no stories anymore, immediately close
                    onCloseForced();
                }
            }
        }
    }, [stories, groupedStories]);

    // Live polling for owner & View recording for non-owners
    useEffect(() => {
        // Clear any existing poll
        if (livePollingRef.current) clearInterval(livePollingRef.current);

        if (selectedStory) {
            // Record view for non-owners
            if (!selectedStory.is_owner) {
                axios.post(`/stories/${selectedStory.id}/view`).catch(err => console.error("Failed to record view", err));
            }

            if (selectedStory.is_owner) {
                const poll = async () => {
                    try {
                        const res = await axios.get(`/stories/${selectedStory.id}/live-state`);
                        setLiveViewCount(res.data.view_count);
                        setLiveLikers(res.data.likers);
                    } catch (err) {
                        // silently fail
                    }
                };
                poll(); // immediate first fetch
                livePollingRef.current = setInterval(poll, 5000);
            } else {
                setLiveViewCount(null);
                setLiveLikers([]);
            }
        }

        return () => {
            if (livePollingRef.current) clearInterval(livePollingRef.current);
        };
    }, [selectedStory]);

    // Fetch detailed viewers list (with liked status) when panel is opened
    const fetchViewers = async () => {
        if (!selectedStory?.is_owner) return;
        try {
            const res = await axios.get(`/stories/${selectedStory.id}/viewers`);
            setStoryViewers(res.data);
        } catch (err) { console.error(err); }
    };

    const handleToggleViewers = (e) => {
        e.stopPropagation();
        const next = !showViewers;
        setShowViewers(next);
        if (next) fetchViewers();
    };

    const handleLike = async (e, story) => {
        e.stopPropagation();
        const originalLiked = likedStories[story.id];
        // Optimistic UI update
        setLikedStories(prev => ({...prev, [story.id]: !originalLiked}));

        try {
            await axios.post(`/stories/${story.id}/react`);
        } catch (err) {
            // Revert on error
            setLikedStories(prev => ({...prev, [story.id]: originalLiked}));
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!replyText.trim()) return;

        try {
            await axios.post(`/stories/${selectedStory.id}/reply`, { content: replyText });
            setReplyText('');
            setReplySent(true);
            setTimeout(() => setReplySent(false), 2500);
        } catch (err) {
            console.error(err);
            setReplyError(true);
            setTimeout(() => setReplyError(false), 2500);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setCreationFile(file);
        setCreationPreview(URL.createObjectURL(file));
        setCreationType('photo');
        setShowCreateMenu(false);
        setShowCreateModal(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleTextStorySelect = () => {
        setCreationType('text');
        setCreationFile(null);
        setCreationPreview(null);
        setShowCreateMenu(false);
        setShowCreateModal(true);
        setTextPos({ x: 50, y: 50 });
        setTextFontSize(24);
        setTextBg('none');
    };

    // Draggable text handlers
    const handleTextMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingText(true);
        const rect = previewRef.current?.getBoundingClientRect();
        if (rect) {
            dragStartRef.current = {
                startX: (e.clientX || e.touches?.[0]?.clientX) - rect.left,
                startY: (e.clientY || e.touches?.[0]?.clientY) - rect.top,
                origX: textPos.x,
                origY: textPos.y,
                rectW: rect.width,
                rectH: rect.height,
            };
        }
    }, [textPos]);

    const handleTextMouseMove = useCallback((e) => {
        if (!isDraggingText || !dragStartRef.current || !previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;
        const newX = ((clientX - rect.left) / rect.width) * 100;
        const newY = ((clientY - rect.top) / rect.height) * 100;
        setTextPos({
            x: Math.max(5, Math.min(95, newX)),
            y: Math.max(5, Math.min(95, newY)),
        });
    }, [isDraggingText]);

    const handleTextMouseUp = useCallback(() => {
        setIsDraggingText(false);
        dragStartRef.current = null;
    }, []);

    useEffect(() => {
        if (isDraggingText) {
            window.addEventListener('mousemove', handleTextMouseMove);
            window.addEventListener('mouseup', handleTextMouseUp);
            window.addEventListener('touchmove', handleTextMouseMove, { passive: false });
            window.addEventListener('touchend', handleTextMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleTextMouseMove);
                window.removeEventListener('mouseup', handleTextMouseUp);
                window.removeEventListener('touchmove', handleTextMouseMove);
                window.removeEventListener('touchend', handleTextMouseUp);
            };
        }
    }, [isDraggingText, handleTextMouseMove, handleTextMouseUp]);

    const confirmUpload = async () => {
        if (creationType === 'photo' && !creationFile) return;
        if (creationType === 'text' && !creationCaption) {
            alert("Please enter some text for your story.");
            return;
        }

        const formData = new FormData();
        formData.append('visibility', creationVisibility);
        formData.append('type', creationType);
        
        if (creationType === 'photo') {
            formData.append('media', creationFile);
        }
        if (creationCaption) {
            formData.append('content', creationCaption);
        }
        // Send text position data
        formData.append('text_x', textPos.x);
        formData.append('text_y', textPos.y);
        formData.append('text_font_size', textFontSize);
        formData.append('text_bg', textBg);

        setUploading(true);
        setShowCreateModal(false);
        try {
            await axios.post('/stories', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchStories();
        } catch (err) {
            console.error(err);
            alert('Failed to upload story');
        } finally {
            setUploading(false);
            setCreationFile(null);
            setCreationPreview(null);
            setCreationCaption('');
            setCreationVisibility('friends');
            setTextPos({ x: 50, y: 50 });
            setTextFontSize(24);
            setTextBg('none');
        }
    };

    const cancelUpload = () => {
        setShowCreateModal(false);
        setShowCreateMenu(false);
        setCreationFile(null);
        setCreationPreview(null);
        setCreationCaption('');
        setCreationVisibility('friends');
        setTextPos({ x: 50, y: 50 });
        setTextFontSize(24);
        setTextBg('none');
    };

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'up' ? -200 : 200;
            scrollContainerRef.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        }
    };

    const currentGroup = selectedStory ? groupedStories.find(g => g.user.id === selectedStory.user.id) : null;
    const currentGroupItems = currentGroup ? currentGroup.items : [];

    const handleNextStory = React.useCallback(() => {
        if (!selectedStory) return;
        const currentIndex = stories.findIndex(s => s.id === selectedStory.id);
        if (currentIndex < stories.length - 1) {
            setSelectedStory(stories[currentIndex + 1]);
        } else {
            setSelectedStory(null); // End of stories
            if (onCloseForced) onCloseForced();
        }
    }, [selectedStory, stories, onCloseForced]);

    const handlePrevStory = React.useCallback(() => {
        if (!selectedStory) return;
        const currentIndex = stories.findIndex(s => s.id === selectedStory.id);
        if (currentIndex > 0) {
            setSelectedStory(stories[currentIndex - 1]);
        }
    }, [selectedStory, stories]);

    // Auto-advance for photo and text stories
    useEffect(() => {
        if (!selectedStory) return;
        
        let timer;
        // Videos handle their own auto-advance via onEnded callback
        if (selectedStory.type !== 'video') {
            timer = setTimeout(() => {
                handleNextStory();
            }, 5000); // 5 seconds per story
        }
        
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [selectedStory, handleNextStory]);

    return (
        <>
            {!hidden && (
                <div className={`flex ${horizontal ? 'flex-row h-auto w-full px-2' : 'flex-col items-center h-full pt-3'} relative`}>
                    {/* Continuous vertical guide line — only for vertical mode */}
                    {!horizontal && (
                        <div
                            className="absolute top-[72px] bottom-[40px] pointer-events-none z-0"
                            style={{
                                left: 'calc(50% - 0.5px)',
                                width: '1px',
                                backgroundColor: 'var(--color-ocean-divider-subtle)',
                                boxShadow: '0 0 3px rgba(0, 0, 0, 0.03)',
                                maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                            }}
                        />
                    )}

                    {/* Header - only for vertical */}
                    {!horizontal && (
                        <h3 className="text-xl font-black text-ocean-text mb-6 tracking-tight shrink-0 relative z-[1]">Story</h3>
                    )}

                    {/* Scroll Up Button - Vertical only */}
                    {!horizontal && (
                        <button
                            onClick={() => scroll('up')}
                            className="mb-2 p-1 text-ocean-text-dim hover:text-biolum transition-colors z-[2] bg-ocean-deep/80 rounded-full backdrop-blur-sm"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                        </button>
                    )}

                    {/* Stories List */}
                    <div
                        ref={scrollContainerRef}
                        className={`flex-1 flex ${horizontal ? 'flex-row overflow-x-auto py-2 px-1 w-full' : 'flex-col items-center overflow-y-auto no-scrollbar scroll-smooth'} gap-3 sm:gap-5 no-scrollbar pb-4 relative z-[1]`}
                    >
                        {/* Your Story Avatar */}
                        <div className="flex flex-col items-center gap-2 group cursor-pointer shrink-0" onClick={() => setShowCreateMenu(true)}>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileSelect} 
                                accept="image/*,video/*" 
                                className="hidden" 
                            />
                            <div className={`relative p-1 rounded-full group-hover:scale-105 transition-all duration-300 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="w-14 h-14 sm:w-[64px] sm:h-[64px] rounded-full border-2 border-ocean-border border-dashed p-0.5 group-hover:border-biolum/50 overflow-hidden bg-ocean-surface flex flex-col items-center justify-center relative transition-colors">
                                    {user?.profile_picture ? (
                                        <img src={user.profile_picture} alt={user.name} className="w-full h-full rounded-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        <div className="w-full h-full rounded-full flex items-center justify-center bg-ocean-surface text-ocean-text-dim text-2xl font-bold opacity-30">
                                            {user?.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-biolum border-2 border-ocean-surface flex items-center justify-center text-white text-sm font-bold shadow-sm z-20 group-hover:scale-110 transition-transform">
                                    {uploading ? (
                                        <svg className="w-3 h-3 animate-spin text-biolum-foreground" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                        <svg className="w-3.5 h-3.5 text-biolum-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    )}
                                </div>
                            </div>
                            <span className="text-[11px] font-semibold text-ocean-text-dim tracking-wide truncate max-w-[72px]">Your Story</span>
                        </div>

                        {/* Other Stories Avatars */}
                        {groupedStories.map((group) => {
                            const firstStory = group.items[0];
                            return (
                                <div
                                    key={group.user.id}
                                    className="flex flex-col items-center gap-2 group cursor-pointer shrink-0 relative hover-lift"
                                    onClick={() => setSelectedStory(group.items[0])}
                                >
                                    <div className="p-[3px] rounded-full bg-gradient-to-tr from-biolum via-biolum-bright to-ocean-border transition-all duration-300 group-hover:scale-[1.03]">
                                        <div className="w-14 h-14 sm:w-[64px] sm:h-[64px] rounded-full border-[2.5px] border-ocean-card overflow-hidden bg-ocean-surface transition-transform duration-300 relative flex items-center justify-center">
                                            {firstStory.type === 'text' ? (
                                                <div className="w-full h-full bg-gradient-to-br from-[#c84bb0] to-[#FF6B9E] flex items-center justify-center p-2 text-center">
                                                    <span className="text-[8px] font-bold text-white leading-tight line-clamp-4 break-words shadow-sm">
                                                        {firstStory.content}
                                                    </span>
                                                </div>
                                            ) : firstStory.image ? (
                                                firstStory.type === 'video' ? (
                                                    <video src={firstStory.image} className="w-full h-full object-cover bg-black" muted playsInline />
                                                ) : (
                                                    <img src={firstStory.image} alt="Story content" className="w-full h-full object-cover" />
                                                )
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-biolum text-biolum-foreground text-xl font-bold font-serif">
                                                    {group.user.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        {/* Mini Avatar Overlay */}
                                        <div className="absolute bottom-[20px] right-0 w-6 h-6 rounded-full border-[2px] border-ocean-card bg-ocean-surface overflow-hidden shadow-sm z-10">
                                            {group.user.profile_picture ? (
                                                <img src={group.user.profile_picture} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-ocean-text flex items-center justify-center text-[9px] font-bold text-ocean-surface uppercase font-sans">
                                                    {group.user.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-semibold text-ocean-text group-hover:text-ocean-text/80 tracking-wide truncate max-w-[60px] sm:max-w-[72px] text-center transition-colors">
                                        {group.user.name.split(' ')[0]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Scroll Down Button - Vertical only */}
                    {!horizontal && (
                        <button
                            onClick={() => scroll('down')}
                            className="mt-2 p-1 text-ocean-text-dim hover:text-biolum transition-colors z-[2] bg-ocean-deep/80 rounded-full backdrop-blur-sm animate-bounce"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                    )}
                </div>
            )}

            {/* Story Viewer Modal - Rendered via Portal to avoid being trapped in sidebar layout */}
            {selectedStory && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ocean-deep/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
                    {/* Background Close Click Area */}
                    <div className="absolute inset-0 z-0" onClick={() => {
                        setSelectedStory(null);
                        if (onCloseForced) onCloseForced();
                    }} />

                    {/* Navigation Buttons (Desktop) */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-10 z-[110] pointer-events-none hidden md:flex">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePrevStory();
                            }}
                            className={`p-3 rounded-full bg-ocean-deep/20 hover:bg-ocean-deep/40 text-ocean-text transition-all pointer-events-auto backdrop-blur-md border border-ocean-border/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)] ${stories.findIndex(s => s.id === selectedStory.id) === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                        >
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleNextStory();
                            }}
                            className={`p-3 rounded-full bg-ocean-deep/20 hover:bg-ocean-deep/40 text-ocean-text transition-all pointer-events-auto backdrop-blur-md border border-ocean-border/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)] ${stories.findIndex(s => s.id === selectedStory.id) === stories.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                        >
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    {/* Close Button + Owner Actions */}
                    <div className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-2 z-[120]">
                        {/* Owner Actions — Delete & Archive */}
                        {selectedStory.is_owner && (
                            <>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            await axios.post(`/stories/${selectedStory.id}/archive`);
                                            setSelectedStory(null);
                                            if (onCloseForced) onCloseForced();
                                            fetchStories();
                                        } catch (err) { console.error(err); }
                                    }}
                                    className="p-2.5 text-white/70 hover:text-amber-300 transition-all bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-xl border border-white/10 cursor-pointer"
                                    title="Archive Story"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!confirm('Delete this story permanently?')) return;
                                        try {
                                            await axios.delete(`/stories/${selectedStory.id}`);
                                            setSelectedStory(null);
                                            if (onCloseForced) onCloseForced();
                                            fetchStories();
                                        } catch (err) { console.error(err); }
                                    }}
                                    className="p-2.5 text-white/70 hover:text-rose-400 transition-all bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-xl border border-white/10 cursor-pointer"
                                    title="Delete Story"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => {
                                setSelectedStory(null);
                                if (onCloseForced) onCloseForced();
                            }}
                            className="p-3 text-ocean-text-muted hover:text-white transition-all hover:rotate-90 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-xl border border-white/10"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="relative z-10 w-full md:max-w-md h-full md:h-[min(90vh,800px)] md:aspect-[9/16] bg-ocean-card/40 md:rounded-[24px] overflow-hidden border-x md:border border-ocean-divider/30 ring-1 ring-ocean-deep/10 flex flex-col backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
                        {/* Progress Bars */}
                        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-1 py-4 md:px-4 md:top-4">
                            {currentGroupItems.map((s, idx) => {
                                const currentIndex = currentGroupItems.findIndex(st => st.id === selectedStory.id);
                                return (
                                    <div key={s.id} className="h-0.5 md:h-1 flex-1 bg-ocean-border/40 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                                        <div className={`h-full bg-biolum transition-all duration-300 ${idx < currentIndex ? 'w-full' : idx === currentIndex ? 'animate-story-progress origin-left' : 'w-0'}`} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Story Header */}
                        <div className="absolute top-6 left-4 right-4 z-20 flex items-center gap-3 md:top-10 bg-gradient-to-b from-black/80 to-transparent pb-6 pt-2 px-2 -mx-2 -mt-2 rounded-t-[24px]">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.5)] overflow-hidden bg-ocean-surface shrink-0">
                                {selectedStory.user.profile_picture ? (
                                    <img src={selectedStory.user.profile_picture} alt={selectedStory.user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-bold bg-biolum font-serif">
                                        {selectedStory.user.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 drop-shadow-md">
                                <p className="text-sm md:text-base font-bold text-white leading-none tracking-wide">{selectedStory.user.name}</p>
                                <p className="text-[10px] md:text-[11px] text-white/70 font-semibold mt-1 tracking-wider uppercase">{selectedStory.time}</p>
                            </div>
                        </div>

                        {/* Story Content Media */}
                        <div className="flex-1 bg-transparent relative flex items-center justify-center pointer-events-auto">
                            {selectedStory.type === 'text' ? (
                                <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center p-8">
                                    <p className="text-white text-2xl md:text-3xl font-bold text-center leading-tight drop-shadow-lg">
                                        {selectedStory.content}
                                    </p>
                                </div>
                            ) : selectedStory.type === 'video' ? (
                                <video 
                                    src={selectedStory.image} 
                                    className="w-full h-full object-contain bg-black/50" 
                                    autoPlay 
                                    playsInline
                                    onEnded={handleNextStory}
                                />
                            ) : selectedStory.image ? (
                                <img
                                    src={selectedStory.image}
                                    alt="Story content"
                                    className="w-full h-full object-contain md:object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />
                            )}
                            
                            {/* Mobile/Tap Navigation Areas */}
                            <div className="absolute inset-0 z-10 flex">
                                <div className="w-[30%] h-full cursor-pointer mix-blend-overlay" onClick={(e) => { e.stopPropagation(); handlePrevStory(); }} />
                                <div className="w-[70%] h-full cursor-pointer mix-blend-overlay" onClick={(e) => { e.stopPropagation(); handleNextStory(); }} />
                            </div>
                        </div>

                        {/* Bottom Overlay with Caption */}
                        <div className="absolute inset-x-0 bottom-0 pointer-events-none flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pb-6 md:p-8 md:pb-8 pt-32 z-30">
                            {selectedStory.content && (
                                <p className="text-white text-base md:text-lg font-medium leading-relaxed drop-shadow-md text-center max-h-[30vh] overflow-y-auto no-scrollbar pointer-events-auto mb-4">
                                    {selectedStory.content}
                                </p>
                            )}

                            {/* Story Viewers & Interactive Bottom */}
                            {selectedStory.is_owner ? (
                                <div className="mt-auto pointer-events-auto flex flex-col w-full">
                                    {/* Live likers row — shows up to 3 recent avatar hearts */}
                                    {liveLikers.length > 0 && (
                                        <div className="flex items-center justify-center gap-1 mb-2" onClick={e => e.stopPropagation()}>
                                            <div className="flex -space-x-2">
                                                {liveLikers.slice(0, 3).map(liker => (
                                                    <div key={liker.id} className="w-6 h-6 rounded-full border-2 border-black/40 overflow-hidden bg-slate-700 shrink-0">
                                                        {liker.profile_picture
                                                            ? <img src={liker.profile_picture} className="w-full h-full object-cover" />
                                                            : <div className="w-full h-full flex items-center justify-center text-white text-[8px] font-bold">{liker.name?.charAt(0)}</div>
                                                        }
                                                    </div>
                                                ))}
                                            </div>
                                            <svg className="w-4 h-4 text-red-400 fill-red-400 ml-1" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
                                            <span className="text-white/80 text-xs font-medium">{liveLikers.length}</span>
                                        </div>
                                    )}

                                    {/* Viewer count button */}
                                    <button
                                        className="flex items-center justify-center gap-2 text-white/90 hover:text-white pb-3 font-medium transition-colors"
                                        onClick={handleToggleViewers}
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        <span>{liveViewCount ?? selectedStory.view_count ?? 0} Viewers</span>
                                        <svg className={`w-3 h-3 transition-transform ${showViewers ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7"/></svg>
                                    </button>

                                    {showViewers && (
                                        <div className="bg-black/60 backdrop-blur-md rounded-t-2xl p-4 max-h-[40vh] overflow-y-auto no-scrollbar border-t border-white/10" onClick={e => e.stopPropagation()}>
                                            <h4 className="text-white font-bold mb-3 mx-1 text-sm">Viewed by</h4>
                                            {storyViewers.length === 0 ? (
                                                <p className="text-white/50 text-sm italic mx-1">No views yet.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {storyViewers.map(view => (
                                                        <div key={view.id} className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 shrink-0 border border-white/10">
                                                                {view.viewer?.profile_picture
                                                                    ? <img src={view.viewer.profile_picture} className="w-full h-full object-cover" />
                                                                    : <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs bg-slate-700">{view.viewer?.name?.charAt(0)}</div>
                                                                }
                                                            </div>
                                                            <span className="text-white text-sm font-medium flex-1">{view.viewer?.name}</span>
                                                            {/* Heart indicator if they liked */}
                                                            {view.liked && (
                                                                <svg className="w-4 h-4 text-red-400 fill-red-400 shrink-0" viewBox="0 0 24 24">
                                                                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                                                                </svg>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-auto pointer-events-auto w-full flex flex-col gap-2">
                                    {/* Success / error feedback toast */}
                                    {replySent && (
                                        <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-sm rounded-full px-4 py-2 text-emerald-300 text-xs font-semibold self-center animate-in fade-in zoom-in">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                                            Reply sent to Messages!
                                        </div>
                                    )}
                                    {replyError && (
                                        <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/30 backdrop-blur-sm rounded-full px-4 py-2 text-red-300 text-xs font-semibold self-center animate-in fade-in zoom-in">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                            Failed to send. Try again.
                                        </div>
                                    )}
                                    <form onSubmit={handleReplySubmit} className="flex items-center gap-2 w-full max-w-full">
                                        <input
                                            type="text"
                                            placeholder={`Reply to ${selectedStory.user.name.split(' ')[0]}...`}
                                            className="flex-1 w-full min-w-0 bg-white/10 hover:bg-white/15 border border-white/20 text-white placeholder-white/80 rounded-full px-5 py-2.5 text-sm backdrop-blur-xl focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all font-medium drop-shadow-sm"
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            onKeyDown={e => e.stopPropagation()}
                                            onClick={e => e.stopPropagation()}
                                        />

                                        {/* Like Button */}
                                        <button
                                            type="button"
                                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 hover:scale-110 active:scale-95 transition-transform"
                                            onClick={e => handleLike(e, selectedStory)}
                                        >
                                            <svg className={`w-7 h-7 drop-shadow-md transition-colors ${likedStories[selectedStory.id] ? 'text-red-500 fill-red-500' : 'text-white hover:text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={likedStories[selectedStory.id] ? 1 : 2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                            </svg>
                                        </button>

                                        {/* Send Reply Button — only appears when text is typed */}
                                        {replyText.trim() && (
                                            <button
                                                type="submit"
                                                className="w-10 h-10 rounded-full bg-biolum text-white flex items-center justify-center shrink-0 hover:bg-biolum-bright transition-colors shadow-lg"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <svg className="w-[18px] h-[18px] ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                                </svg>
                                            </button>
                                        )}
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Create Story Menu (Photo vs Text selection) */}
            {showCreateMenu && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setShowCreateMenu(false)} />
                    
                    <button onClick={() => setShowCreateMenu(false)} className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all z-10">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 relative z-10 max-w-lg w-full px-4">
                        {/* Photo Story Card */}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="group cursor-pointer w-full sm:w-56 aspect-[3/2] sm:aspect-[4/5] rounded-[24px] bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] p-5 sm:p-6 flex flex-row sm:flex-col items-center sm:justify-center gap-4 hover:scale-[1.02] sm:hover:scale-[1.03] transition-transform duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ring-1 ring-white/10 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_60%)]" />
                            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white shrink-0 ring-1 ring-white/15 relative z-10 transition-transform group-hover:scale-110">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            </div>
                            <span className="text-white font-bold text-base text-center relative z-10 tracking-wide">Photo Story</span>
                            <span className="text-white/40 text-xs text-center relative z-10">Share a moment</span>
                        </div>

                        {/* Text Story Card */}
                        <div 
                            onClick={handleTextStorySelect}
                            className="group cursor-pointer w-full sm:w-56 aspect-[3/2] sm:aspect-[4/5] rounded-[24px] bg-gradient-to-br from-[#f5f5f5] to-[#e0e0e0] p-5 sm:p-6 flex flex-row sm:flex-col items-center sm:justify-center gap-4 hover:scale-[1.02] sm:hover:scale-[1.03] transition-transform duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.15)] ring-1 ring-black/5 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.03),transparent_60%)]" />
                            <div className="w-16 h-16 rounded-full bg-black/8 flex items-center justify-center text-[#1a1a1a] shrink-0 ring-1 ring-black/10 relative z-10 transition-transform group-hover:scale-110">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                            </div>
                            <span className="text-[#1a1a1a] font-bold text-base text-center relative z-10 tracking-wide">Text Story</span>
                            <span className="text-black/40 text-xs text-center relative z-10">Express yourself</span>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Create Story Modal (Edit View) */}
            {showCreateModal && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex bg-[#030712] animate-in fade-in duration-200">
                    
                    {/* Left Sidebar (Settings) */}
                    <div className="w-full md:w-80 bg-ocean-deep border-r border-ocean-border flex flex-col shrink-0 h-full fixed md:relative z-20 md:z-auto transition-transform duration-300 transform md:translate-x-0 shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center gap-4 px-4 py-3 border-b border-ocean-divider bg-ocean-deep">
                            <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-ocean-card border border-ocean-divider-subtle hover:bg-ocean-surface text-ocean-text-dim hover:text-ocean-text transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                            <h2 className="text-[17px] font-semibold text-ocean-text">Your story</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto w-full no-scrollbar pb-4 md:pb-0">
                            {/* User Info */}
                            <div className="p-4 mx-4 mt-4 border border-ocean-divider-subtle rounded-[16px] bg-ocean-card shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full border border-ocean-divider overflow-hidden flex-shrink-0">
                                    {user?.profile_picture ? (
                                        <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-ocean-text font-bold bg-biolum/20">
                                            {user?.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <span className="font-medium text-ocean-text text-sm truncate">{user?.name}</span>
                            </div>

                            {/* Editing Controls */}
                            <div className="p-4 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-ocean-text-dim uppercase tracking-wider ml-1">
                                        {creationType === 'text' ? 'Story Text' : 'Caption'}
                                    </label>
                                    <textarea 
                                        value={creationCaption}
                                        onChange={(e) => setCreationCaption(e.target.value)}
                                        placeholder={creationType === 'text' ? "Start typing..." : "Add a short caption..."}
                                        className="w-full h-28 bg-ocean-card/50 border border-ocean-divider-subtle rounded-[14px] p-3 text-ocean-text text-sm focus:ring-1 focus:ring-biolum/30 focus:border-biolum/50 transition-all resize-none placeholder:text-ocean-text-dim/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                                    />
                                    <p className="text-[10px] text-ocean-text-dim ml-1">Drag text on preview to reposition</p>
                                </div>

                                {/* Font Size Slider */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-ocean-text-dim uppercase tracking-wider ml-1">Text Size</label>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-ocean-text-dim">A</span>
                                        <input
                                            type="range"
                                            min="14"
                                            max="48"
                                            value={textFontSize}
                                            onChange={(e) => setTextFontSize(Number(e.target.value))}
                                            className="flex-1 h-1.5 bg-ocean-border rounded-full appearance-none cursor-pointer accent-biolum"
                                        />
                                        <span className="text-lg font-bold text-ocean-text-dim">A</span>
                                    </div>
                                </div>

                                {/* Text Background */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-ocean-text-dim uppercase tracking-wider ml-1">Text Background</label>
                                    <div className="flex gap-2">
                                        {[
                                            { id: 'none', label: 'None', cls: 'bg-transparent border-ocean-border' },
                                            { id: 'dark', label: 'Dark', cls: 'bg-black/70 border-white/20' },
                                            { id: 'light', label: 'Light', cls: 'bg-white/80 border-black/10' },
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setTextBg(opt.id)}
                                                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                                                    textBg === opt.id
                                                        ? 'ring-2 ring-biolum border-biolum text-biolum'
                                                        : `${opt.cls} text-ocean-text-dim hover:text-ocean-text`
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-ocean-text-dim uppercase tracking-wider ml-1">Visibility</label>
                                    <div className="relative">
                                        <select 
                                            value={creationVisibility} 
                                            onChange={(e) => setCreationVisibility(e.target.value)}
                                            className="w-full bg-ocean-card/50 border border-ocean-divider-subtle text-ocean-text font-medium rounded-[14px] p-3 pr-10 text-sm focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/30 transition-all appearance-none cursor-pointer shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                                        >
                                            <option value="public" className="bg-ocean-deep border-none text-ocean-text">Public (Anyone)</option>
                                            <option value="friends" className="bg-ocean-deep border-none text-ocean-text">Friends Only</option>
                                            <option value="private" className="bg-ocean-deep border-none text-ocean-text">Only Me</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ocean-text-dim"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 flex items-center gap-3 bg-ocean-deep border-t border-ocean-divider shrink-0">
                            <button onClick={cancelUpload} className="px-6 py-2.5 rounded-full border border-ocean-divider-subtle bg-ocean-card text-ocean-text-muted hover:bg-ocean-surface hover:text-ocean-text focus:outline-none font-semibold text-sm transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                Discard
                            </button>
                            <button onClick={confirmUpload} disabled={uploading || (creationType === 'text' && !creationCaption)} className="flex-1 py-2.5 rounded-full bg-biolum text-white hover:bg-biolum-bright focus:outline-none font-bold text-sm transition-all shadow-[0_1px_4px_rgba(25,25,112,0.15)] disabled:opacity-50 disabled:cursor-not-allowed text-center tracking-wide">
                                {uploading ? 'Sharing...' : 'Share to story'}
                            </button>
                        </div>
                    </div>

                    {/* Main Preview Area */}
                    <div className="hidden md:flex flex-1 items-center justify-center p-6 relative overflow-hidden bg-[#0a0f18] min-h-0">
                        <div
                            ref={previewRef}
                            className={`relative max-w-sm w-full h-full max-h-[85vh] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl select-none ${creationType === 'text' ? 'bg-gradient-to-br from-[#1a1a2e] to-[#16213e]' : 'bg-[#111827]'}`}
                        >
                            
                            {creationType === 'photo' && creationPreview && (
                                <div className="absolute inset-0 bg-black flex items-center justify-center">
                                    {creationFile && creationFile.type.startsWith('video') ? (
                                        <video src={creationPreview} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                                    ) : (
                                        <img src={creationPreview} alt="Preview" className="w-full h-full object-cover" draggable={false} />
                                    )}
                                </div>
                            )}
                            
                            {/* Draggable Text Overlay */}
                            {creationCaption ? (
                                <div
                                    onMouseDown={handleTextMouseDown}
                                    onTouchStart={handleTextMouseDown}
                                    className={`absolute z-20 px-4 py-2 rounded-xl max-w-[85%] break-words text-center transition-shadow select-none ${
                                        isDraggingText ? 'shadow-[0_0_20px_rgba(34,211,238,0.3)] ring-2 ring-biolum/50' : 'hover:shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                                    } ${
                                        textBg === 'dark' ? 'bg-black/70 backdrop-blur-sm' :
                                        textBg === 'light' ? 'bg-white/80 backdrop-blur-sm' : ''
                                    }`}
                                    style={{
                                        left: `${textPos.x}%`,
                                        top: `${textPos.y}%`,
                                        transform: 'translate(-50%, -50%)',
                                        fontSize: `${textFontSize}px`,
                                        cursor: isDraggingText ? 'grabbing' : 'grab',
                                    }}
                                >
                                    <p className={`font-bold leading-tight drop-shadow-lg ${
                                        textBg === 'light' ? 'text-[#1a1a1a]' : 'text-white'
                                    }`}>
                                        {creationCaption}
                                    </p>
                                </div>
                            ) : creationType === 'text' ? (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <p className="text-white/30 text-center text-2xl font-bold leading-tight">
                                        Start typing...
                                    </p>
                                </div>
                            ) : null}

                            {/* Drag guide lines */}
                            {isDraggingText && (
                                <>
                                    <div className="absolute left-0 right-0 top-1/2 h-px bg-biolum/30 pointer-events-none z-10" />
                                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-biolum/30 pointer-events-none z-10" />
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes story-progress {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                }
                .animate-story-progress {
                    animation: story-progress 5s linear forwards;
                }
            `}} />
        </>
    );
}
