import React, { useState, useRef } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import PostCard from '@/Components/UI/Cards/PostCard';
import { useCurrents } from '@/Contexts/CurrentsContext';
import CurrentsTabContent from '@/Components/Features/Schools/CurrentsTabContent';
import axios from 'axios';

/* ── Event helpers ───────────────────────────────────────────────────── */
const formatEventDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const formatEventTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};
const statusColors = {
    live: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    upcoming: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    ended: 'bg-zinc-200/60 text-zinc-500 border-zinc-300/40',
};

/* ── Icon helpers ────────────────────────────────────────────────────────── */
const CameraIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
);

const PencilIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
    </svg>
);

const SpinnerIcon = () => (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);

export default function SchoolProfile() {
    const { school: initialSchool, posts: initialPosts, members: initialMembers, events: initialEvents, auth, activeSession, blockedIds } = usePage().props;
    const [school, setSchool] = useState(initialSchool);
    const [posts] = useState(initialPosts?.data || []);
    const [members] = useState(initialMembers?.data || []);
    const [events, setEvents] = useState(initialEvents || []);
    const [activeTab, setActiveTab] = useState('posts');
    const [joiningCall, setJoiningCall] = useState(false);
    const currents = useCurrents();

    // Post composer state
    const [showPostForm, setShowPostForm] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [mediaFiles, setMediaFiles] = useState([]);
    const [mediaPreviews, setMediaPreviews] = useState([]);
    const [posting, setPosting] = useState(false);
    const fileInputRef = useRef(null);
    const postFileInputRef = useRef(null);

    // Admin image upload state
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingProfile, setUploadingProfile] = useState(false);
    const coverInputRef = useRef(null);
    const profileInputRef = useRef(null);

    // Edit details state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({
        name: school.name,
        description: school.description || '',
        privacy: school.privacy,
    });
    const [saving, setSaving] = useState(false);

    // Create event state
    const [showEventModal, setShowEventModal] = useState(false);
    const [eventForm, setEventForm] = useState({
        title: '', description: '', location: '', meeting_link: '',
        starts_at: '', ends_at: '', privacy: 'public',
    });
    const [eventCoverFile, setEventCoverFile] = useState(null);
    const [eventCoverPreview, setEventCoverPreview] = useState(null);
    const [creatingEvent, setCreatingEvent] = useState(false);
    const eventCoverRef = useRef(null);

    const isAdmin = school.is_admin || school.is_creator;
    const initials = school.name?.substring(0, 2).toUpperCase();

    // ── Actions ──────────────────────────────────────────────────────────
    const handleToggleMembership = async () => {
        try {
            const res = await axios.post(`/schools/${school.id}/toggle-membership`);
            setSchool(prev => ({
                ...prev,
                is_member: res.data.is_member,
                members_count: prev.members_count + (res.data.is_member ? 1 : -1),
            }));
        } catch (err) { console.error(err); }
    };

    const handleCoverUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingCover(true);
        const fd = new FormData();
        fd.append('cover_image', file);
        try {
            await axios.post(`/schools/${school.id}/cover-image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            router.reload({ only: ['school'] });
        } catch (err) { console.error(err); }
        setUploadingCover(false);
    };

    const handleProfileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingProfile(true);
        const fd = new FormData();
        fd.append('profile_image', file);
        try {
            await axios.post(`/schools/${school.id}/profile-image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            router.reload({ only: ['school'] });
        } catch (err) { console.error(err); }
        setUploadingProfile(false);
    };

    const handleSaveDetails = async () => {
        setSaving(true);
        try {
            await axios.put(`/schools/${school.id}/details`, editData);
            setSchool(prev => ({ ...prev, ...editData }));
            setShowEditModal(false);
        } catch (err) { console.error(err); }
        setSaving(false);
    };

    // ── Post Composer with media ─────────────────────────────────────────
    const handlePostFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        const remaining = 4 - mediaFiles.length;
        const newFiles = files.slice(0, remaining);
        if (newFiles.length === 0) return;

        setMediaFiles(prev => [...prev, ...newFiles]);
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setMediaPreviews(prev => [...prev, {
                    url: ev.target.result,
                    type: file.type.startsWith('video/') ? 'video' : 'image',
                    name: file.name,
                }]);
            };
            reader.readAsDataURL(file);
        });
        if (postFileInputRef.current) postFileInputRef.current.value = '';
    };

    const removePostMedia = (index) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreatePost = (e) => {
        e.preventDefault();
        if (!newPostContent.trim() && mediaFiles.length === 0) return;
        setPosting(true);

        const formData = new FormData();
        formData.append('content', newPostContent || '');
        formData.append('visibility', 'public');
        mediaFiles.forEach((file, i) => {
            formData.append(`media[${i}]`, file);
        });

        router.post(`/schools/${school.id}/posts`, formData, {
            forceFormData: true,
            onSuccess: () => {
                setNewPostContent('');
                setMediaFiles([]);
                setMediaPreviews([]);
                setShowPostForm(false);
            },
            onFinish: () => setPosting(false),
        });
    };

    // ── Event handlers ────────────────────────────────────────────────────
    const handleEventCoverSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setEventCoverFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setEventCoverPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleCreateEvent = (e) => {
        e.preventDefault();
        if (!eventForm.title.trim() || !eventForm.starts_at) return;
        setCreatingEvent(true);

        const fd = new FormData();
        Object.entries(eventForm).forEach(([k, v]) => { if (v) fd.append(k, v); });
        if (eventCoverFile) fd.append('cover_image', eventCoverFile);

        router.post(`/schools/${school.id}/events`, fd, {
            forceFormData: true,
            onSuccess: () => {
                setShowEventModal(false);
                setEventForm({ title: '', description: '', location: '', meeting_link: '', starts_at: '', ends_at: '', privacy: 'public' });
                setEventCoverFile(null);
                setEventCoverPreview(null);
            },
            onFinish: () => setCreatingEvent(false),
        });
    };

    const handleRsvp = async (eventId, status) => {
        try {
            const res = await axios.post(`/events/${eventId}/rsvp`, { status });
            setEvents(prev => prev.map(ev =>
                ev.id === eventId ? { ...ev, user_rsvp: res.data.status, going_count: res.data.going_count, interested_count: res.data.interested_count } : ev
            ));
        } catch (err) { console.error(err); }
    };

    const handleStartSession = async (e) => {
        if(e) e.preventDefault();
        try {
            setJoiningCall(true);
            await currents.startSession(school, currentSettings.url, blockedIds);
            setShowCurrentsModal(false);
            setCurrentSettings({ title: '', url: '' });
        } catch (err) {
            console.error(err);
        }
        setJoiningCall(false);
    };

    const handleJoinSession = async () => {
        try {
            setJoiningCall(true);
            await currents.joinSession(school, blockedIds);
        } catch (err) {
            console.error(err);
        }
        setJoiningCall(false);
    };

    const handleEndSession = async () => {
        try {
            await currents.endSession();
        } catch (err) {
            console.error(err);
        }
    };

    // ── Tab config ───────────────────────────────────────────────────────
    const tabs = [
        { key: 'posts',   label: 'Posts',   count: school.posts_count,   icon: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z' },
        { key: 'events',  label: 'Events',  count: school.events_count,  icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },
        { key: 'currents', label: 'Currents', icon: 'M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z' },
        { key: 'members', label: 'Members', count: school.members_count, icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
        { key: 'about',   label: 'About',                                 icon: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z' },
    ];

    const joinedDate = school.created_at
        ? new Date(school.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : null;

    return (
        <MainLayout>
            <Head title={school.name} />

            {/* ═══════ COVER BANNER (full-bleed) ═══════ */}
            <div className="relative -mt-4 w-full">
                <div className="h-48 sm:h-56 md:h-72 overflow-hidden relative">
                    {school.cover_image ? (
                        <img src={school.cover_image} alt={school.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-biolum/20 via-ocean-surface to-ocean-deep relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[80px] font-bold text-biolum/[0.06] select-none">{school.name.substring(0, 4)}</span>
                            </div>
                        </div>
                    )}
                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep via-ocean-deep/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-ocean-deep/30 to-transparent" />

                    {/* Admin: Cover edit button */}
                    {isAdmin && (
                        <>
                            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                            <button
                                onClick={() => coverInputRef.current?.click()}
                                disabled={uploadingCover}
                                className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white text-xs font-bold hover:bg-black/60 transition-all z-20"
                            >
                                {uploadingCover ? <SpinnerIcon /> : <CameraIcon className="w-3.5 h-3.5" />}
                                {uploadingCover ? 'Uploading...' : 'Edit Cover'}
                            </button>
                        </>
                    )}
                </div>

                {/* ═══════ PROFILE INFO OVERLAY ═══════ */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 -mt-16 sm:-mt-20 relative z-10">
                        {/* Profile Avatar */}
                        <div className="relative group/avatar shrink-0">
                            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[28px] bg-ocean-card border-4 border-ocean-deep ring-1 ring-ocean-border overflow-hidden flex items-center justify-center shadow-2xl">
                                {school.profile_image ? (
                                    <img src={school.profile_image} alt={school.name} className="w-full h-full object-cover" />
                                ) : school.cover_image ? (
                                    <img src={school.cover_image} alt={school.name} className="w-full h-full object-cover scale-150 blur-[1px]" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-biolum/20 to-biolum/5 flex items-center justify-center">
                                        <span className="text-3xl sm:text-4xl font-black text-biolum/60">{initials}</span>
                                    </div>
                                )}
                            </div>
                            {isAdmin && (
                                <>
                                    <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfileUpload} />
                                    <button
                                        onClick={() => profileInputRef.current?.click()}
                                        disabled={uploadingProfile}
                                        className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-biolum border-[3px] border-ocean-deep flex items-center justify-center text-white hover:bg-biolum-bright transition-all shadow-lg opacity-0 group-hover/avatar:opacity-100"
                                    >
                                        {uploadingProfile ? <SpinnerIcon /> : <CameraIcon className="w-4 h-4" />}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 min-w-0 pb-2 sm:pb-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h1 className="text-2xl sm:text-3xl md:text-[2rem] font-bold text-ocean-text tracking-tight leading-tight">{school.name}</h1>
                                        <span className={`px-2.5 py-0.5 rounded-xl text-xs font-semibold border ${
                                            school.privacy === 'public'
                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                        }`}>
                                            {school.privacy === 'public' ? 'Public' : 'Private'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-ocean-text-dim flex-wrap">
                                        <span className="flex items-center gap-1.5 font-semibold">
                                            <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                                            <strong className="text-ocean-text">{school.members_count}</strong> members
                                        </span>
                                        <span className="flex items-center gap-1.5 font-semibold">
                                            <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                                            <strong className="text-ocean-text">{school.posts_count}</strong> posts
                                        </span>
                                        {school.creator && (
                                            <span className="flex items-center gap-1.5 text-ocean-text-dim">
                                                Created by <Link href={`/users/${school.creator.id}`} className="font-bold text-biolum hover:underline">{school.creator.name}</Link>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2.5 mt-4 flex-wrap">
                                {school.is_member && (
                                    <button
                                        onClick={() => setShowPostForm(!showPostForm)}
                                        className="inline-flex items-center gap-2 px-5 py-2 bg-biolum text-ocean-deep text-sm font-semibold rounded-xl hover:bg-biolum-bright transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                        Write Post
                                    </button>
                                )}
                                {!school.is_creator && (
                                    <button
                                        onClick={handleToggleMembership}
                                        className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                            school.is_member
                                                ? 'bg-transparent border border-ocean-border text-ocean-text-dim hover:text-red-500 hover:border-red-500/50'
                                                : 'bg-biolum text-ocean-deep hover:bg-biolum-bright'
                                        }`}
                                    >
                                        {school.is_member ? (
                                            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Joined</>
                                        ) : (
                                            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 018.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>Join Group</>
                                        )}
                                    </button>
                                )}
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="inline-flex items-center gap-2 px-5 py-2 bg-ocean-surface border border-ocean-border text-ocean-text text-sm font-semibold rounded-xl hover:bg-ocean-card hover:border-biolum/30 transition-colors"
                                    >
                                        <PencilIcon className="w-3.5 h-3.5" />
                                        Edit Group
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════ TABS ═══════ */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
                <div className="flex items-center gap-1 border-b border-ocean-border overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                                activeTab === tab.key
                                    ? 'text-biolum border-biolum'
                                    : 'text-ocean-text-dim border-transparent hover:text-ocean-text hover:border-ocean-border'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                                    activeTab === tab.key ? 'bg-biolum/10 text-biolum' : 'bg-ocean-surface text-ocean-text-dim'
                                }`}>{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══════ TAB CONTENT ═══════ */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6" key={activeTab}>

                {/* ── POSTS TAB ── */}
                {activeTab === 'posts' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24 self-start order-2 lg:order-1">
                            {/* Quick About */}
                            <div className="bg-ocean-card border border-ocean-border rounded-[20px] p-5 shadow-sm">
                                <h3 className="text-sm font-black text-ocean-text tracking-tight mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                                    About
                                </h3>
                                <p className="text-sm text-ocean-text-dim leading-relaxed line-clamp-4">
                                    {school.description || 'No description provided yet.'}
                                </p>
                                {school.description && school.description.length > 150 && (
                                    <button onClick={() => setActiveTab('about')} className="text-xs font-bold text-biolum mt-2 hover:underline">Read more</button>
                                )}
                                <div className="mt-4 pt-4 border-t border-ocean-border space-y-2.5">
                                    <div className="flex items-center gap-2.5 text-xs text-ocean-text-dim">
                                        <svg className="w-3.5 h-3.5 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Created {joinedDate}
                                    </div>
                                    <div className="flex items-center gap-2.5 text-xs text-ocean-text-dim">
                                        <svg className="w-3.5 h-3.5 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" /></svg>
                                        {school.privacy === 'public' ? 'Anyone can join' : 'Invite only'}
                                    </div>
                                </div>
                            </div>

                            {/* Member Preview */}
                            <div className="bg-ocean-card border border-ocean-border rounded-[20px] p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-base font-bold text-ocean-text tracking-tight">Members</h3>
                                    <button onClick={() => setActiveTab('members')} className="text-xs font-semibold text-biolum hover:underline">See All</button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {members.slice(0, 6).map(m => (
                                        <Link key={m.id} href={`/users/${m.id}`} className="group text-center">
                                            <div className="aspect-square rounded-xl bg-ocean-surface overflow-hidden border border-ocean-border group-hover:border-biolum/40 transition-all shadow-sm">
                                                {m.profile_picture
                                                    ? <img src={m.profile_picture} alt={m.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    : <div className="w-full h-full flex items-center justify-center bg-biolum/10 text-biolum font-bold text-xs">{m.name?.charAt(0)}</div>
                                                }
                                            </div>
                                            <span className="block text-[10px] font-bold text-ocean-text truncate mt-1.5 group-hover:text-biolum transition-colors">{m.name?.split(' ')[0]}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Feed */}
                        <div className="lg:col-span-2 space-y-4 order-1 lg:order-2">
                            {/* Post Composer */}
                            {showPostForm && school.is_member && (
                                <div className="bg-ocean-card border border-ocean-border rounded-[20px] p-5 shadow-sm animate-[fadeIn_0.2s_ease-out]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-biolum/20 overflow-hidden ring-1 ring-ocean-border flex items-center justify-center text-sm font-bold text-ocean-text">
                                            {auth.user?.profile_picture
                                                ? <img src={auth.user.profile_picture} className="w-full h-full object-cover" />
                                                : auth.user?.name?.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-ocean-text">{auth.user?.name}</p>
                                            <p className="text-[10px] text-ocean-text-dim font-semibold">Posting in <span className="text-biolum">{school.name}</span></p>
                                        </div>
                                    </div>
                                    <form onSubmit={handleCreatePost}>
                                        <textarea
                                            value={newPostContent}
                                            onChange={(e) => setNewPostContent(e.target.value)}
                                            placeholder={`Share something with ${school.name}...`}
                                            className="w-full bg-ocean-surface border border-ocean-border rounded-2xl px-4 py-3 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/20 placeholder-ocean-text-dim resize-none min-h-[100px] transition-all"
                                            rows="3"
                                        />

                                        {/* Media Previews */}
                                        {mediaPreviews.length > 0 && (
                                            <div className={`grid gap-1 mt-3 rounded-xl overflow-hidden border border-ocean-border ${mediaPreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                                {mediaPreviews.map((preview, i) => (
                                                    <div key={i} className={`relative aspect-video bg-ocean-surface group/media ${mediaPreviews.length === 1 ? 'col-span-2' : ''}`}>
                                                        {preview.type === 'video'
                                                            ? <video src={preview.url} className="w-full h-full object-cover" muted />
                                                            : <img src={preview.url} className="w-full h-full object-cover" />
                                                        }
                                                        <button type="button" onClick={() => removePostMedia(i)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500 transition-colors opacity-0 group-hover/media:opacity-100">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Toolbar */}
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-ocean-border">
                                            <div className="flex items-center gap-1">
                                                <input ref={postFileInputRef} type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/mov,video/webm" onChange={handlePostFileSelect} className="hidden" />
                                                <button type="button" onClick={() => postFileInputRef.current?.click()} disabled={mediaFiles.length >= 4} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-ocean-text-dim hover:text-biolum hover:bg-biolum/10 transition-all text-xs font-bold disabled:opacity-30">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                                                    Photo/Video
                                                    {mediaFiles.length > 0 && <span className="text-[10px] text-biolum">({mediaFiles.length}/4)</span>}
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button type="button" onClick={() => { setShowPostForm(false); setNewPostContent(''); setMediaFiles([]); setMediaPreviews([]); }} className="px-5 py-2 rounded-xl border border-ocean-border text-ocean-text text-xs font-semibold hover:bg-ocean-surface transition-colors">
                                                    Cancel
                                                </button>
                                                <button type="submit" disabled={posting || (!newPostContent.trim() && mediaFiles.length === 0)} className="px-5 py-2 rounded-xl bg-biolum text-ocean-deep text-xs font-semibold hover:bg-biolum-bright transition-colors disabled:opacity-40">
                                                    {posting ? <><SpinnerIcon /> Posting...</> : 'Post'}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Posts */}
                            {posts.length > 0 ? (
                                posts.map(post => <PostCard key={post.id} post={post} />)
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-ocean-card border border-ocean-border rounded-[20px] text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-ocean-surface flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-ocean-text mb-1">No posts yet</h3>
                                    <p className="text-sm text-ocean-text-dim mb-4">{school.is_member ? 'Be the first to share something!' : 'Join to start posting.'}</p>
                                    {school.is_member && (
                                        <button onClick={() => setShowPostForm(true)} className="px-6 py-2.5 bg-biolum text-white font-bold text-sm rounded-full hover:bg-biolum-bright transition-all">Create First Post</button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── MEMBERS TAB ── */}
                {activeTab === 'members' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {members.map(member => (
                            <Link key={member.id} href={`/users/${member.id}`} className="flex items-center gap-4 p-4 bg-ocean-card border border-ocean-border rounded-[20px] hover:border-biolum/30 hover:shadow-md transition-all group">
                                <div className="w-14 h-14 rounded-full bg-biolum/10 overflow-hidden ring-1 ring-ocean-border flex items-center justify-center font-bold text-sm text-ocean-text shrink-0 group-hover:ring-biolum/40 transition-all">
                                    {member.profile_picture
                                        ? <img src={member.profile_picture} className="w-full h-full object-cover" />
                                        : <span className="text-biolum">{member.name?.charAt(0)}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-ocean-text group-hover:text-biolum transition-colors truncate">{member.name}</h4>
                                    <p className="text-xs text-ocean-text-dim truncate">@{member.username || 'user'}</p>
                                    {member.bio && <p className="text-[11px] text-ocean-text-dim truncate mt-0.5">{member.bio}</p>}
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                                    member.pivot?.role === 'admin'
                                        ? 'bg-biolum/10 text-biolum border border-biolum/20'
                                        : member.pivot?.role === 'moderator'
                                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                            : 'bg-ocean-surface text-ocean-text-dim border border-ocean-border'
                                }`}>
                                    {member.pivot?.role || 'member'}
                                </span>
                            </Link>
                        ))}
                        {members.length === 0 && (
                            <div className="col-span-full text-center py-16 text-ocean-text-dim">
                                <p className="text-sm font-semibold">No members yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── EVENTS TAB ── */}
                {activeTab === 'events' && (
                    <div className="space-y-5">
                        {/* Header with Create button */}
                        {isAdmin && school.is_member && (
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-ocean-text tracking-tight">Group Events</h3>
                                <button
                                    onClick={() => setShowEventModal(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-biolum text-biolum-foreground text-sm font-semibold rounded-xl hover:bg-biolum-bright transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    Create Event
                                </button>
                            </div>
                        )}

                        {/* Event Cards */}
                        {events.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {events.map(event => (
                                    <div key={event.id} className="bg-ocean-card border border-ocean-border rounded-[20px] overflow-hidden hover:shadow-lg hover:border-biolum/20 transition-all group">
                                        {/* Cover */}
                                        <Link href={`/events/${event.id}`} className="block">
                                            <div className="h-36 bg-ocean-surface relative overflow-hidden">
                                                {event.cover_image ? (
                                                    <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-biolum/5 to-ocean-surface flex items-center justify-center">
                                                        <svg className="w-10 h-10 text-ocean-border" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                                                    </div>
                                                )}
                                                {/* Status badge */}
                                                <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusColors[event.status] || statusColors.upcoming}`}>
                                                    {event.status === 'live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />}
                                                    {event.status}
                                                </span>
                                            </div>
                                        </Link>

                                        {/* Content */}
                                        <div className="p-4">
                                            <Link href={`/events/${event.id}`} className="block">
                                                <h4 className="text-base font-bold text-ocean-text group-hover:text-biolum transition-colors truncate">{event.title}</h4>
                                            </Link>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-ocean-text-dim">
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    {formatEventDate(event.starts_at)} • {formatEventTime(event.starts_at)}
                                                </span>
                                            </div>
                                            {event.location && (
                                                <span className="flex items-center gap-1 mt-1.5 text-xs text-ocean-text-dim">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                                                    {event.location}
                                                </span>
                                            )}

                                            {/* Attendee row */}
                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-ocean-border">
                                                <div className="flex items-center gap-2">
                                                    {/* Stacked avatars */}
                                                    <div className="flex -space-x-2">
                                                        {(event.going_avatars || []).slice(0, 4).map((a, i) => (
                                                            <div key={a.id} className="w-6 h-6 rounded-full bg-ocean-surface border-2 border-ocean-card overflow-hidden" style={{ zIndex: 5 - i }}>
                                                                {a.profile_picture
                                                                    ? <img src={a.profile_picture} className="w-full h-full object-cover" />
                                                                    : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-biolum bg-biolum/10">{a.name?.charAt(0)}</div>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-ocean-text-dim">
                                                        {event.going_count || 0} going · {event.interested_count || 0} interested
                                                    </span>
                                                </div>

                                                {/* RSVP button */}
                                                {school.is_member && event.status !== 'ended' && (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleRsvp(event.id, 'going')}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                                                event.user_rsvp === 'going'
                                                                    ? 'bg-biolum text-biolum-foreground border-biolum'
                                                                    : 'bg-ocean-surface text-ocean-text-dim border-ocean-border hover:border-biolum/40'
                                                            }`}
                                                        >Going</button>
                                                        <button
                                                            onClick={() => handleRsvp(event.id, 'interested')}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                                                event.user_rsvp === 'interested'
                                                                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                                                    : 'bg-ocean-surface text-ocean-text-dim border-ocean-border hover:border-amber-500/40'
                                                            }`}
                                                        >Interested</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-ocean-card border border-ocean-border rounded-[20px] text-center">
                                <div className="w-16 h-16 rounded-2xl bg-ocean-surface flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                                </div>
                                <h3 className="text-lg font-bold text-ocean-text mb-1">No events yet</h3>
                                <p className="text-sm text-ocean-text-dim mb-4">{isAdmin ? 'Create the first event for this group!' : 'Check back later for upcoming events.'}</p>
                                {isAdmin && school.is_member && (
                                    <button onClick={() => setShowEventModal(true)} className="px-6 py-2.5 bg-biolum text-biolum-foreground font-bold text-sm rounded-full hover:bg-biolum-bright transition-all">Create Event</button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── CURRENTS TAB ── */}
                {activeTab === 'currents' && (
                    <CurrentsTabContent 
                        school={school} 
                        activeSession={activeSession} 
                        isAdmin={isAdmin} 
                        blockedIds={blockedIds} 
                    />
                )}

                {/* ── ABOUT TAB ── */}
                {activeTab === 'about' && (
                    <div className="max-w-2xl mx-auto space-y-5">
                        {/* Description Card */}
                        <div className="bg-ocean-card border border-ocean-border rounded-[24px] p-8 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-biolum/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                            <div className="relative z-10">
                                <h3 className="text-xl font-black text-ocean-text tracking-tight mb-4">About {school.name}</h3>
                                <p className="text-sm text-ocean-text-dim leading-[1.8] whitespace-pre-wrap">
                                    {school.description || 'No description has been provided for this group yet. Group admins can add one by editing the group details.'}
                                </p>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-ocean-card border border-ocean-border rounded-2xl p-5 text-center shadow-sm hover:border-biolum/20 transition-all group">
                                <p className="text-3xl font-extrabold text-ocean-text group-hover:text-biolum transition-colors">{school.members_count}</p>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-ocean-text-dim mt-1">Members</p>
                            </div>
                            <div className="bg-ocean-card border border-ocean-border rounded-2xl p-5 text-center shadow-sm hover:border-biolum/20 transition-all group">
                                <p className="text-3xl font-extrabold text-ocean-text group-hover:text-biolum transition-colors">{school.posts_count}</p>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-ocean-text-dim mt-1">Posts</p>
                            </div>
                            <div className="bg-ocean-card border border-ocean-border rounded-2xl p-5 text-center shadow-sm hover:border-biolum/20 transition-all group">
                                <p className="text-3xl font-extrabold text-ocean-text group-hover:text-biolum transition-colors">
                                    {Math.ceil((new Date() - new Date(school.created_at)) / (1000 * 60 * 60 * 24))}
                                </p>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-ocean-text-dim mt-1">Days Active</p>
                            </div>
                        </div>

                        {/* Details Card */}
                        <div className="bg-ocean-card border border-ocean-border rounded-[24px] p-8 shadow-sm">
                            <h3 className="text-lg font-black text-ocean-text tracking-tight mb-5">Group Details</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-ocean-surface rounded-2xl border border-ocean-border">
                                    <div className="w-10 h-10 rounded-xl bg-biolum/10 flex items-center justify-center text-biolum shrink-0">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-ocean-text-dim uppercase tracking-widest">Privacy</p>
                                        <p className="text-sm font-semibold text-ocean-text mt-0.5">{school.privacy === 'public' ? 'Public — Anyone can see and join' : 'Private — Invite only'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-ocean-surface rounded-2xl border border-ocean-border">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-ocean-text-dim uppercase tracking-widest">Created</p>
                                        <p className="text-sm font-semibold text-ocean-text mt-0.5">{joinedDate}</p>
                                    </div>
                                </div>
                                {school.creator && (
                                    <Link href={`/users/${school.creator.id}`} className="flex items-center gap-4 p-4 bg-ocean-surface rounded-2xl border border-ocean-border hover:border-biolum/30 transition-all group">
                                        <div className="w-10 h-10 rounded-full bg-biolum/10 overflow-hidden flex items-center justify-center text-biolum font-bold text-sm shrink-0 ring-1 ring-ocean-border">
                                            {school.creator.profile_picture
                                                ? <img src={school.creator.profile_picture} className="w-full h-full object-cover" />
                                                : school.creator.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-ocean-text-dim uppercase tracking-widest">Created By</p>
                                            <p className="text-sm font-semibold text-ocean-text group-hover:text-biolum transition-colors mt-0.5">{school.creator.name}</p>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════ EDIT GROUP MODAL ═══════ */}
            {showEditModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
                    <div className="relative bg-ocean-card border border-ocean-border w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden">
                        <div className="p-6 pb-4 flex items-center justify-between border-b border-ocean-border">
                            <h2 className="text-xl font-black text-ocean-text tracking-tight">Edit Group</h2>
                            <button onClick={() => setShowEditModal(false)} className="w-9 h-9 rounded-full bg-ocean-surface flex items-center justify-center text-ocean-text-dim hover:text-ocean-text transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="text-xs font-semibold text-ocean-text-dim block mb-2">Group Name</label>
                                <input
                                    type="text"
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-4 py-3 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-ocean-text-dim block mb-2">Description</label>
                                <textarea
                                    value={editData.description}
                                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                    className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-4 py-3 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/20 resize-none min-h-[100px] transition-all"
                                    rows="4"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-ocean-text-dim uppercase tracking-widest block mb-2">Privacy</label>
                                <div className="flex gap-3">
                                    {['public', 'private'].map(opt => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setEditData({ ...editData, privacy: opt })}
                                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${
                                                editData.privacy === opt
                                                    ? 'bg-biolum/10 border-biolum/30 text-biolum'
                                                    : 'bg-ocean-surface border-ocean-border text-ocean-text-dim hover:border-ocean-hover'
                                            }`}
                                        >
                                            {opt === 'public' ? 'Public' : 'Private'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 pb-6 flex items-center justify-end gap-3">
                            <button onClick={() => setShowEditModal(false)} className="px-5 py-2.5 rounded-xl border border-ocean-border text-ocean-text text-sm font-semibold hover:bg-ocean-surface transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSaveDetails} disabled={saving || !editData.name.trim()} className="px-6 py-2.5 rounded-xl bg-biolum text-ocean-deep text-sm font-semibold hover:bg-biolum-bright transition-colors disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ CREATE EVENT MODAL ═══════ */}
            {showEventModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEventModal(false)} />
                    <div className="relative bg-ocean-card border border-ocean-border w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 pb-4 flex items-center justify-between border-b border-ocean-border shrink-0">
                            <h2 className="text-xl font-black text-ocean-text tracking-tight">Create Event</h2>
                            <button onClick={() => setShowEventModal(false)} className="w-9 h-9 rounded-full bg-ocean-surface flex items-center justify-center text-ocean-text-dim hover:text-ocean-text transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateEvent} className="overflow-y-auto flex-1">
                            <div className="p-6 space-y-5">
                                {/* Cover image */}
                                <div>
                                    <label className="text-xs font-semibold text-ocean-text-dim block mb-2">Cover Image</label>
                                    <input ref={eventCoverRef} type="file" accept="image/*" className="hidden" onChange={handleEventCoverSelect} />
                                    <div
                                        onClick={() => eventCoverRef.current?.click()}
                                        className="w-full h-32 rounded-2xl bg-ocean-surface border-2 border-dashed border-ocean-border hover:border-biolum/30 flex items-center justify-center cursor-pointer transition-all overflow-hidden"
                                    >
                                        {eventCoverPreview ? (
                                            <img src={eventCoverPreview} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center">
                                                <svg className="w-8 h-8 text-ocean-text-dim mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                                                <span className="text-[10px] font-semibold text-ocean-text-dim">Click to add cover</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="text-xs font-semibold text-ocean-text-dim block mb-2">Event Title *</label>
                                    <input
                                        type="text" required maxLength={150}
                                        value={eventForm.title}
                                        onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                                        placeholder="Give your event a name"
                                        className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-4 py-3 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/20 placeholder-ocean-text-dim transition-all"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-xs font-semibold text-ocean-text-dim block mb-2">Description</label>
                                    <textarea
                                        value={eventForm.description}
                                        onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                                        placeholder="What's this event about?"
                                        className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-4 py-3 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/20 resize-none min-h-[80px] placeholder-ocean-text-dim transition-all"
                                        rows="3"
                                    />
                                </div>

                                {/* Date/Time row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-ocean-text-dim block mb-2">Starts At *</label>
                                        <input
                                            type="datetime-local" required
                                            value={eventForm.starts_at}
                                            onChange={e => setEventForm({ ...eventForm, starts_at: e.target.value })}
                                            className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-4 py-3 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/20 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-ocean-text-dim block mb-2">Ends At</label>
                                        <input
                                            type="datetime-local"
                                            value={eventForm.ends_at}
                                            onChange={e => setEventForm({ ...eventForm, ends_at: e.target.value })}
                                            className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-4 py-3 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/20 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="text-xs font-semibold text-ocean-text-dim block mb-2">Location</label>
                                    <input
                                        type="text"
                                        value={eventForm.location}
                                        onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                                        placeholder="Physical address or 'Online'"
                                        className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-4 py-3 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/20 placeholder-ocean-text-dim transition-all"
                                    />
                                </div>

                                {/* Meeting link */}
                                <div>
                                    <label className="text-xs font-semibold text-ocean-text-dim block mb-2">Meeting Link</label>
                                    <input
                                        type="url"
                                        value={eventForm.meeting_link}
                                        onChange={e => setEventForm({ ...eventForm, meeting_link: e.target.value })}
                                        placeholder="https://meet.google.com/... (optional)"
                                        className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-4 py-3 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/20 placeholder-ocean-text-dim transition-all"
                                    />
                                </div>

                                {/* Privacy */}
                                <div>
                                    <label className="text-[10px] font-black text-ocean-text-dim uppercase tracking-widest block mb-2">Privacy</label>
                                    <div className="flex gap-3">
                                        {[{ v: 'public', l: 'Public' }, { v: 'members_only', l: 'Members Only' }].map(opt => (
                                            <button
                                                key={opt.v} type="button"
                                                onClick={() => setEventForm({ ...eventForm, privacy: opt.v })}
                                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${
                                                    eventForm.privacy === opt.v
                                                        ? 'bg-biolum/10 border-biolum/30 text-biolum'
                                                        : 'bg-ocean-surface border-ocean-border text-ocean-text-dim hover:border-ocean-hover'
                                                }`}
                                            >{opt.l}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 pb-6 flex items-center justify-end gap-3 shrink-0">
                                <button type="button" onClick={() => setShowEventModal(false)} className="px-5 py-2.5 rounded-xl border border-ocean-border text-ocean-text text-sm font-semibold hover:bg-ocean-surface transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={creatingEvent || !eventForm.title.trim() || !eventForm.starts_at} className="px-6 py-2.5 rounded-xl bg-biolum text-biolum-foreground text-sm font-semibold hover:bg-biolum-bright transition-colors disabled:opacity-50">
                                    {creatingEvent ? 'Creating...' : 'Create Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Player is now rendered globally in app.jsx via CurrentsContext */}



            {/* Animation */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </MainLayout>
    );
}
