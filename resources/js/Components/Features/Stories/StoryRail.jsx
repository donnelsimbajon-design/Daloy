import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePage } from '@inertiajs/react';
import axios from 'axios';


export default function StoryRail({ horizontal = false }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const [stories, setStories] = useState([]);
    const [groupedStories, setGroupedStories] = useState([]);
    const [selectedStory, setSelectedStory] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    // Story Creation States
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creationType, setCreationType] = useState('photo'); // 'photo' or 'text'
    const [creationFile, setCreationFile] = useState(null);
    const [creationPreview, setCreationPreview] = useState(null);
    const [creationVisibility, setCreationVisibility] = useState('friends');
    const [creationCaption, setCreationCaption] = useState('');

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
        fetchStories();
    }, []);

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
    };

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
        if (creationCaption) {
            formData.append('content', creationCaption);
        }

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
        }
    };

    const cancelUpload = () => {
        setShowCreateModal(false);
        setShowCreateMenu(false);
        setCreationFile(null);
        setCreationPreview(null);
        setCreationCaption('');
        setCreationVisibility('friends');
    };

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'up' ? -200 : 200;
            scrollContainerRef.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        }
    };

    const currentGroup = selectedStory ? groupedStories.find(g => g.user.id === selectedStory.user.id) : null;
    const currentGroupItems = currentGroup ? currentGroup.items : [];

    return (
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
                className={`flex-1 flex ${horizontal ? 'flex-row overflow-x-auto py-2 px-2 w-[calc(100vw-2rem)]' : 'flex-col items-center overflow-y-auto no-scrollbar scroll-smooth'} gap-5 no-scrollbar pb-4 relative z-[1]`}
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
                    <div className={`relative p-0.5 rounded-full ring-2 ring-ocean-border border-dashed group-hover:ring-biolum/60 group-hover:bg-biolum/5 transition-all duration-300 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="w-[64px] h-[64px] rounded-full border-2 border-ocean-card overflow-hidden bg-ocean-surface flex flex-col items-center justify-center relative">
                            {user?.profile_picture ? (
                                <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-ocean-surface text-ocean-text-dim text-2xl font-bold opacity-30">
                                    {user?.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-biolum border-[2.5px] border-ocean-card flex items-center justify-center text-white text-sm font-bold shadow-[0_2px_6px_rgba(25,25,112,0.4)] z-20 group-hover:scale-110 transition-transform">
                            {uploading ? (
                                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            )}
                        </div>
                    </div>
                    <span className="text-[10px] font-medium text-ocean-text-dim tracking-wide truncate max-w-[72px]">Your Story</span>
                </div>

                {/* Other Stories Avatars */}
                {groupedStories.map((group) => (
                    <div
                        key={group.user.id}
                        className="flex flex-col items-center gap-2 group cursor-pointer shrink-0 relative"
                        onClick={() => setSelectedStory(group.items[0])}
                    >
                        <div className="p-0.5 rounded-full ring-2 ring-biolum/50 group-hover:ring-biolum transition-all duration-300">
                            <div className="w-[64px] h-[64px] rounded-full border-2 border-ocean-card overflow-hidden bg-ocean-surface transition-transform duration-300 group-hover:scale-105 relative">
                                {group.user.profile_picture ? (
                                    <img src={group.user.profile_picture} alt={group.user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-biolum text-white text-2xl font-bold">
                                        {group.user.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="text-[10px] font-medium text-ocean-text-dim group-hover:text-ocean-text tracking-wide truncate max-w-[72px] text-center transition-colors">
                            {group.user.name.split(' ')[0]}
                        </span>
                    </div>
                ))}
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

            {/* Story Viewer Modal - Rendered via Portal to avoid being trapped in sidebar layout */}
            {selectedStory && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ocean-deep/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
                    {/* Background Close Click Area */}
                    <div className="absolute inset-0 z-0" onClick={() => setSelectedStory(null)} />

                    {/* Navigation Buttons */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-10 z-[110] pointer-events-none">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const currentIndex = stories.findIndex(s => s.id === selectedStory.id);
                                if (currentIndex > 0) setSelectedStory(stories[currentIndex - 1]);
                            }}
                            className={`p-3 rounded-full bg-ocean-deep/20 hover:bg-ocean-deep/40 text-ocean-text transition-all pointer-events-auto backdrop-blur-md border border-ocean-border/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)] ${stories.findIndex(s => s.id === selectedStory.id) === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                        >
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const currentIndex = stories.findIndex(s => s.id === selectedStory.id);
                                if (currentIndex < stories.length - 1) setSelectedStory(stories[currentIndex + 1]);
                            }}
                            className={`p-3 rounded-full bg-ocean-deep/20 hover:bg-ocean-deep/40 text-ocean-text transition-all pointer-events-auto backdrop-blur-md border border-ocean-border/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)] ${stories.findIndex(s => s.id === selectedStory.id) === stories.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                        >
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    {/* Close Button - More accessible on mobile */}
                    <button
                        onClick={() => setSelectedStory(null)}
                        className="absolute top-4 right-4 md:top-8 md:right-8 p-3 text-ocean-text-dim hover:text-ocean-text transition-all hover:rotate-90 z-[120] bg-ocean-deep/20 hover:bg-ocean-deep/40 rounded-full md:bg-transparent backdrop-blur-md md:backdrop-blur-none"
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

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
                        <div className="absolute top-6 left-4 right-4 z-20 flex items-center gap-3 md:top-10">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-ocean-divider/40 ring-2 ring-biolum/50 shadow-[0_2px_8px_rgba(0,0,0,0.2)] overflow-hidden bg-ocean-surface shrink-0">
                                {selectedStory.user.profile_picture ? (
                                    <img src={selectedStory.user.profile_picture} alt={selectedStory.user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-ocean-text font-bold bg-biolum">
                                        {selectedStory.user.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm md:text-base font-bold text-ocean-text leading-none">{selectedStory.user.name}</p>
                                <p className="text-[10px] md:text-xs text-ocean-text/70 font-medium mt-1">{selectedStory.time}</p>
                            </div>
                        </div>

                        {/* Story Content Media */}
                        <div className="flex-1 bg-transparent relative flex items-center justify-center">
                            {selectedStory.type === 'video' ? (
                                <video 
                                    src={selectedStory.image} 
                                    className="w-full h-full object-contain bg-black/50" 
                                    autoPlay 
                                    loop 
                                    playsInline
                                    controls 
                                />
                            ) : (
                                <img
                                    src={selectedStory.image}
                                    alt="Story content"
                                    className="w-full h-full object-contain md:object-cover"
                                />
                            )}
                        </div>

                        {/* Bottom Overlay with Caption */}
                        <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 bg-black/80 pt-32">
                            <p className="text-ocean-text text-base md:text-xl font-medium leading-relaxed text-center">
                                {selectedStory.content}
                            </p>

                            {/* Drop-down indicator */}
                            <div className="mt-8 flex flex-col items-center gap-1 opacity-50">
                                <span className="text-[10px] font-bold text-biolum uppercase tracking-widest">More</span>
                                <svg className="w-4 h-4 text-ocean-text animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Create Story Menu (Photo vs Text selection) */}
            {showCreateMenu && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ocean-deep/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setShowCreateMenu(false)} />
                    
                    <button onClick={() => setShowCreateMenu(false)} className="absolute top-6 right-6 p-3 rounded-full bg-ocean-card/20 hover:bg-ocean-card/40 backdrop-blur-md text-white transition-all z-10 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6 relative z-10 max-w-lg w-full px-4">
                        {/* Photo Story Card */}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="group cursor-pointer w-full md:w-60 aspect-[3/4] md:aspect-[4/5] rounded-[24px] bg-gradient-to-br from-[#4f8ff7] to-[#80B3FF] p-6 flex flex-col items-center justify-center gap-4 hover:scale-[1.03] transition-transform duration-300 shadow-[0_8px_32px_rgba(79,143,247,0.3)] ring-1 ring-white/20 relative overflow-hidden"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)] relative z-10 transition-transform group-hover:scale-110">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            </div>
                            <span className="text-white font-bold text-base text-center relative z-10 tracking-wide">Photo Story</span>
                        </div>

                        {/* Text Story Card */}
                        <div 
                            onClick={handleTextStorySelect}
                            className="group cursor-pointer w-full md:w-60 aspect-[3/4] md:aspect-[4/5] rounded-[24px] bg-gradient-to-br from-[#c84bb0] to-[#FF6B9E] p-6 flex flex-col items-center justify-center gap-4 hover:scale-[1.03] transition-transform duration-300 shadow-[0_8px_32px_rgba(200,75,176,0.3)] ring-1 ring-white/20 relative overflow-hidden"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)] relative z-10 transition-transform group-hover:scale-110">
                                <span className="text-2xl font-serif leading-none mt-1 font-light">T</span>
                            </div>
                            <span className="text-white font-bold text-base text-center relative z-10 tracking-wide">Text Story</span>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Create Story Modal (Edit View) */}
            {showCreateModal && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex bg-[#030712] animate-in fade-in duration-200">
                    
                    {/* Left Sidebar (Settings) */}
                    <div className="w-full md:w-80 bg-ocean-deep border-r border-ocean-border flex flex-col shrink-0 h-full fixed md:relative z-20 md:z-auto transition-transform duration-300 transform md:translate-x-0 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center gap-4 px-4 py-3 border-b border-ocean-divider bg-ocean-deep">
                            <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-ocean-card border border-ocean-divider-subtle hover:bg-ocean-surface text-ocean-text-dim hover:text-ocean-text transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                            <h2 className="text-[17px] font-semibold text-ocean-text">Your story</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto w-full no-scrollbar">
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
                            <div className="p-4 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-ocean-text-dim uppercase tracking-wider ml-1">
                                        {creationType === 'text' ? 'Story Text' : 'Caption'}
                                    </label>
                                    <textarea 
                                        value={creationCaption}
                                        onChange={(e) => setCreationCaption(e.target.value)}
                                        placeholder={creationType === 'text' ? "Start typing..." : "Add a short caption..."}
                                        className="w-full h-32 bg-ocean-card/50 border border-ocean-divider-subtle rounded-[14px] p-3 text-ocean-text text-sm focus:ring-1 focus:ring-biolum/30 focus:border-biolum/50 transition-all resize-none placeholder:text-ocean-text-dim/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-ocean-text-dim uppercase tracking-wider ml-1">Visibility</label>
                                    <div className="relative">
                                        <select 
                                            value={creationVisibility} 
                                            onChange={(e) => setCreationVisibility(e.target.value)}
                                            className="w-full bg-ocean-card/50 border border-ocean-divider-subtle text-ocean-text font-medium rounded-[14px] p-3 pr-10 text-sm focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/30 transition-all appearance-none cursor-pointer shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                                        >
                                            <option value="public" className="bg-ocean-deep border-none text-ocean-text">🌍 Public (Anyone)</option>
                                            <option value="friends" className="bg-ocean-deep border-none text-ocean-text">👥 Friends Only</option>
                                            <option value="private" className="bg-ocean-deep border-none text-ocean-text">🔒 Only Me</option>
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
                        <div className={`relative max-w-sm w-full h-full max-h-[85vh] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl ${creationType === 'text' ? 'bg-gradient-to-br from-[#B840B0] to-[#FF6B9E]' : 'bg-[#111827]'}`}>
                            
                            {creationType === 'photo' && creationPreview && (
                                <div className="absolute inset-0 bg-black flex items-center justify-center">
                                    {creationFile && creationFile.type.startsWith('video') ? (
                                        <video src={creationPreview} className="w-full h-full object-contain" autoPlay loop muted playsInline />
                                    ) : (
                                        <img src={creationPreview} alt="Preview" className="w-full h-full object-contain" />
                                    )}
                                </div>
                            )}
                            
                            <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col items-center justify-center pointer-events-none z-10 w-full h-full">
                                {creationCaption && (
                                    <p className={`text-white text-center drop-shadow-lg ${creationType === 'text' ? 'text-2xl font-bold leading-tight' : 'text-xl font-semibold absolute bottom-12 left-6 right-6'}`}>
                                        {creationCaption}
                                    </p>
                                )}
                                {!creationCaption && creationType === 'text' && (
                                    <p className="text-white/50 text-center text-2xl font-bold leading-tight drop-shadow-md">
                                        Start typing
                                    </p>
                                )}
                            </div>
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
        </div>
    );
}
