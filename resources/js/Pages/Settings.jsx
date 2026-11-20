import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import axios from 'axios';

/* ─── Primitives ──────────────────────────────────────────────────────── */
const Ic = ({ d, className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>
);

function Card({ children, className = '' }) {
    return <div className={`bg-ocean-card border border-ocean-border rounded-2xl p-5 sm:p-6 ${className}`}>{children}</div>;
}

function CardTitle({ title, desc, right }) {
    return (
        <div className="flex items-start justify-between mb-5">
            <div>
                <h3 className="text-[15px] font-bold text-ocean-text">{title}</h3>
                {desc && <p className="text-[12px] text-ocean-text-dim mt-0.5">{desc}</p>}
            </div>
            {right}
        </div>
    );
}

function Field({ label, hint, error, children }) {
    return (
        <div>
            {label && <label className="block text-[13px] font-semibold text-ocean-text mb-1.5">{label}</label>}
            {children}
            {hint && !error && <p className="text-[11px] text-ocean-text-dim mt-1">{hint}</p>}
            {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
        </div>
    );
}

function Input({ label, hint, error, ...props }) {
    return (
        <Field label={label} hint={hint} error={error}>
            <input className="w-full h-11 px-4 bg-ocean-surface border border-ocean-border rounded-xl text-ocean-text text-sm placeholder:text-ocean-text-dim/50 focus:outline-none focus:ring-2 focus:ring-biolum/30 focus:border-biolum/40 transition-all" {...props} />
        </Field>
    );
}

function Textarea({ label, maxLen, value, error, rows = 3, ...props }) {
    return (
        <Field label={label} error={error}>
            <textarea rows={rows} value={value} maxLength={maxLen} className="w-full px-4 py-3 bg-ocean-surface border border-ocean-border rounded-xl text-ocean-text text-sm placeholder:text-ocean-text-dim/50 focus:outline-none focus:ring-2 focus:ring-biolum/30 focus:border-biolum/40 transition-all resize-none" {...props} />
            {maxLen && <p className="text-right text-[11px] text-ocean-text-dim mt-0.5">{(value || '').length}/{maxLen}</p>}
        </Field>
    );
}

function Toggle({ on, onChange, disabled }) {
    return (
        <button type="button" disabled={disabled} onClick={onChange}
            className={`relative w-[44px] h-[26px] rounded-full transition-colors duration-200 shrink-0 ${on ? 'bg-biolum' : 'bg-ocean-border'} ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
            <span className="absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                style={{ transform: on ? 'translateX(18px)' : 'translateX(0)' }} />
        </button>
    );
}

function SaveBtn({ processing, label = 'Save changes' }) {
    return (
        <button type="submit" disabled={processing}
            className="h-10 px-7 bg-biolum text-white text-sm font-semibold rounded-xl hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm shadow-biolum/20">
            {processing ? <span className="flex items-center gap-2"><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving…</span> : label}
        </button>
    );
}

/* ─── Main ────────────────────────────────────────────────────────────── */
export default function Settings({ user, blocked_users = [], muted_keywords = [], interest_tags = [], user_interest_ids = [], login_activities = [] }) {
    const [activeTab, setActiveTab] = useState('profile');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [uploadingProfile, setUploadingProfile] = useState(false);
    const [uploadingBackground, setUploadingBackground] = useState(false);
    const [savingNotifs, setSavingNotifs] = useState(false);

    const defaultNotifPrefs = { push_likes: true, push_comments: true, push_follows: true, push_messages: true, push_mentions: true, email_digest: false, email_security: true, email_updates: false };
    const [notifPrefs, setNotifPrefs] = useState({ ...defaultNotifPrefs, ...(user.notification_preferences || {}) });
    const toggleNotif = (key) => {
        const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
        setNotifPrefs(updated);
        setSavingNotifs(true);
        router.patch('/settings/notifications', { notification_preferences: updated }, { preserveScroll: true, preserveState: true, onFinish: () => setSavingNotifs(false) });
    };

    const [profilePreview, setProfilePreview] = useState(user.profile_picture || null);
    const [backgroundPreview, setBackgroundPreview] = useState(user.background_picture || null);
    const profilePicRef = useRef(null);
    const backgroundPicRef = useRef(null);

    const profileForm = useForm({ name: user.name || '', username: user.username || '', email: user.email || '', bio: user.bio || '', about: user.about || '', phone: user.phone || '', location: user.location || '', pronouns: user.pronouns || '' });
    const passwordForm = useForm({ current_password: '', password: '', password_confirmation: '' });
    const privacyForm = useForm({ privacy_setting: user.privacy_setting || 'public', show_activity_status: user.show_activity_status ?? true });
    const deleteForm = useForm({ password: '' });
    const accessibilityForm = useForm({ font_size: user.font_size || 'medium', reduce_motion: user.reduce_motion || false, high_contrast: user.high_contrast || false, dark_mode: user.dark_mode || false });

    // New state
    const [selectedInterests, setSelectedInterests] = useState(user_interest_ids || []);
    const [savingInterests, setSavingInterests] = useState(false);
    const [mutedKws, setMutedKws] = useState(muted_keywords || []);
    const [newKeyword, setNewKeyword] = useState('');
    const [profileAccent, setProfileAccent] = useState(user.profile_accent || 'deep-blue');
    const [savingAccent, setSavingAccent] = useState(false);

    const submitProfile = (e) => { e.preventDefault(); profileForm.patch('/settings/profile'); };
    const submitPassword = (e) => { e.preventDefault(); passwordForm.put('/settings/password', { onSuccess: () => passwordForm.reset() }); };
    const submitPrivacy = (e) => { e.preventDefault(); privacyForm.patch('/settings/privacy'); };
    const submitDelete = (e) => { e.preventDefault(); deleteForm.delete('/settings/account'); };
    const submitAccessibility = (e) => { e.preventDefault(); accessibilityForm.patch('/settings/accessibility'); };
    const handleUnblock = (userId) => { if (confirm('Unblock this user?')) router.delete(`/settings/unblock/${userId}`, { preserveScroll: true }); };

    const saveInterests = async () => {
        setSavingInterests(true);
        router.post('/settings/interests', { tag_ids: selectedInterests }, { preserveScroll: true, preserveState: true, onFinish: () => setSavingInterests(false) });
    };
    const toggleInterest = (id) => {
        setSelectedInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 10 ? [...prev, id] : prev);
    };
    const addMutedKeyword = async () => {
        if (!newKeyword.trim()) return;
        router.post('/settings/muted-keywords', { keyword: newKeyword }, { preserveScroll: true, preserveState: true, onSuccess: () => { setNewKeyword(''); router.reload({ only: ['muted_keywords'] }); } });
    };
    const removeMutedKeyword = (id) => {
        router.delete(`/settings/muted-keywords/${id}`, { preserveScroll: true, preserveState: true });
        setMutedKws(prev => prev.filter(k => k.id !== id));
    };
    const saveAccent = () => {
        setSavingAccent(true);
        router.patch('/settings/accent', { profile_accent: profileAccent }, { preserveScroll: true, preserveState: true, onFinish: () => setSavingAccent(false) });
    };
    const logoutOtherSessions = async () => {
        if (!confirm('Log out all other sessions?')) return;
        try { await axios.post('/settings/logout-other-sessions'); alert('Done! All other sessions have been logged out.'); } catch {} 
    };

    const handlePicUpload = async (file, endpoint, setUploading, setPreview, fieldName) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target.result);
        reader.readAsDataURL(file);
        setUploading(true);
        const formData = new FormData();
        formData.append(fieldName, file);
        try { await axios.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); router.reload(); }
        catch (err) { console.error(err); }
        setUploading(false);
    };

    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';

    const statusMessages = {
        'profile-updated': 'Profile updated!', 'password-updated': 'Password changed!',
        'privacy-updated': 'Privacy saved!', 'profile-picture-updated': 'Photo updated!',
        'background-updated': 'Cover updated!', 'notifications-updated': 'Notifications saved!',
        'accessibility-updated': 'Accessibility saved!', 'user-unblocked': 'User unblocked!',
        'interests-updated': 'Interests saved!', 'accent-updated': 'Accent updated!',
        'keyword-muted': 'Keyword muted!', 'keyword-unmuted': 'Keyword removed!',
    };
    const currentStatus = usePage().props.status;

    const tabs = [
        { id: 'profile', label: 'Profile', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
        { id: 'security', label: 'Security', icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z' },
        { id: 'notifications', label: 'Notifications', icon: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0' },
        { id: 'privacy', label: 'Privacy', icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
        { id: 'accessibility', label: 'Accessibility', icon: 'M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802' },
        { id: 'personalize', label: 'Personalize', icon: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42' },
        { id: 'blocked', label: 'Blocked', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
        { id: 'help', label: 'Help', icon: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z' },
    ];

    return (
        <MainLayout>
            <Head title="Settings" />
            <div className="daloy-page daloy-settings px-3 sm:px-0">

            {/* ══ Toast ══ */}
            {currentStatus && statusMessages[currentStatus] && (
                <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
                    <div className="flex items-center gap-3 px-5 py-3 bg-ocean-card border border-emerald-500/30 rounded-2xl shadow-2xl">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center">
                            <Ic d="M4.5 12.75l6 6 9-13.5" className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-sm font-medium text-ocean-text">{statusMessages[currentStatus]}</span>
                    </div>
                </div>
            )}

            {/* ══ Profile Hero Banner ══ */}
            <div className="relative rounded-2xl overflow-hidden mb-6">
                {/* Cover */}
                <div className="h-40 sm:h-48 relative group">
                    {backgroundPreview
                        ? <img src={backgroundPreview} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full bg-gradient-to-br from-biolum/20 via-biolum/5 to-ocean-surface" />
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-ocean-card via-transparent to-transparent" />
                    <button type="button" onClick={() => backgroundPicRef.current?.click()} disabled={uploadingBackground}
                        className="absolute top-3 right-3 h-8 px-3 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm text-ocean-text text-[12px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white">
                        <Ic d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" className="w-3.5 h-3.5" />
                        {uploadingBackground ? 'Uploading…' : 'Edit cover'}
                    </button>
                    <input ref={backgroundPicRef} type="file" accept="image/*" className="hidden" onChange={e => handlePicUpload(e.target.files[0], '/settings/background-picture', setUploadingBackground, setBackgroundPreview, 'background_picture')} />
                </div>

                {/* User info bar */}
                <div className="relative bg-ocean-card px-6 pb-5 pt-0 flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 sm:-mt-14">
                    <div className="relative group shrink-0">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-ocean-card bg-biolum flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-lg">
                            {profilePreview ? <img src={profilePreview} className="w-full h-full object-cover" alt="" /> : initials}
                        </div>
                        <button type="button" onClick={() => profilePicRef.current?.click()} disabled={uploadingProfile}
                            className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            {uploadingProfile
                                ? <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                : <Ic d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" className="w-5 h-5 text-white" />
                            }
                        </button>
                        <input ref={profilePicRef} type="file" accept="image/*" className="hidden" onChange={e => handlePicUpload(e.target.files[0], '/settings/profile-picture', setUploadingProfile, setProfilePreview, 'profile_picture')} />
                    </div>
                    <div className="text-center sm:text-left flex-1 pb-1">
                        <h1 className="text-xl font-bold text-ocean-text">{user.name}</h1>
                        <p className="text-sm text-ocean-text-dim">@{user.username} · {user.email}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-6 pb-1">
                        {[
                            { label: 'Posts', value: user.posts_count ?? 0 },
                            { label: 'Followers', value: user.followers_count ?? 0 },
                            { label: 'Following', value: user.following_count ?? 0 },
                        ].map(s => (
                            <div key={s.label} className="text-center">
                                <p className="text-lg font-semibold text-ocean-text">{s.value}</p>
                                <p className="text-xs font-semibold text-ocean-text-dim">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══ Tab Bar ══ */}
            <div className="mb-6 -mx-4 sm:mx-0">
                <div className="flex gap-1 overflow-x-auto px-4 sm:px-0 pb-2 sm:pb-0 scrollbar-hide">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium whitespace-nowrap transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-biolum text-ocean-deep'
                                    : 'text-ocean-text-muted hover:text-ocean-text hover:bg-ocean-surface'
                            }`}>
                            <Ic d={tab.icon} className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ══════════════════════ PROFILE TAB ══════════════════════ */}
            {activeTab === 'profile' && (
                <form onSubmit={submitProfile}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* ── Left Column: Form (8 cols) ── */}
                        <div className="lg:col-span-8 space-y-6">
                            <Card>
                                <CardTitle title="Basic information" desc="Your public identity on Daloy." />
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Full name" value={profileForm.data.name} onChange={e => profileForm.setData('name', e.target.value)} error={profileForm.errors.name} placeholder="John Doe" />
                                        <Input label="Username" value={profileForm.data.username} onChange={e => profileForm.setData('username', e.target.value)} error={profileForm.errors.username} placeholder="johndoe" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Email" type="email" value={profileForm.data.email} onChange={e => profileForm.setData('email', e.target.value)} error={profileForm.errors.email} />
                                        <Input label="Phone" value={profileForm.data.phone} onChange={e => profileForm.setData('phone', e.target.value)} error={profileForm.errors.phone} hint="Optional" placeholder="+63 9XX XXX XXXX" />
                                    </div>
                                    <Input label="Location" value={profileForm.data.location} onChange={e => profileForm.setData('location', e.target.value)} error={profileForm.errors.location} placeholder="Manila, Philippines" hint="Optional" />
                                    <Input label="Pronouns" value={profileForm.data.pronouns} onChange={e => profileForm.setData('pronouns', e.target.value)} error={profileForm.errors.pronouns} placeholder="e.g. he/him, she/her, they/them" hint="Optional · displayed on your profile" />
                                </div>
                            </Card>

                            <Card>
                                <CardTitle title="About you" desc="Tell people a bit about yourself." />
                                <div className="space-y-4">
                                    <Textarea label="Bio" value={profileForm.data.bio} onChange={e => profileForm.setData('bio', e.target.value)} error={profileForm.errors.bio} maxLen={500} rows={3} placeholder="Write a short tagline…" />
                                    <Textarea label="About" value={profileForm.data.about} onChange={e => profileForm.setData('about', e.target.value)} error={profileForm.errors.about} maxLen={2000} rows={6} placeholder="Share more about yourself…" />
                                </div>
                            </Card>
                            
                            <div className="flex justify-end">
                                <SaveBtn processing={profileForm.processing} />
                            </div>
                        </div>

                        {/* ── Right Column: Stats & Tips (4 cols) ── */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="bg-biolum/5 border-biolum/10">
                                <CardTitle title="Profile Status" />
                                <div className="space-y-4 mt-2">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-ocean-card/50 border border-ocean-border">
                                        <span className="text-xs text-ocean-text-dim">Profile Strength</span>
                                        <span className="text-xs font-semibold text-biolum">Advanced</span>
                                    </div>
                                    <div className="w-full bg-ocean-surface rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-biolum h-full w-[85%] rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                    </div>
                                    <p className="text-[11px] text-ocean-text-dim leading-relaxed">
                                        Your profile is 85% complete. Add a detailed "About" section to reach 100%.
                                    </p>
                                </div>
                            </Card>

                            <Card>
                                <CardTitle title="Privacy Tips" />
                                <div className="space-y-3 mt-2">
                                    {[
                                        { t: 'Public Profile', d: 'Your profile is visible to everyone.' },
                                        { t: 'Searchable', d: 'People can find you via search tide.' },
                                        { t: 'SafetyFirst', d: 'Never share your real password.' }
                                    ].map(tip => (
                                        <div key={tip.t} className="p-3 rounded-xl hover:bg-ocean-surface transition-colors cursor-help">
                                            <p className="text-xs font-semibold text-ocean-text">{tip.t}</p>
                                            <p className="text-[10px] text-ocean-text-dim mt-0.5">{tip.d}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </form>
            )}

            {/* ══════════════════════ SECURITY TAB ══════════════════════ */}
            {activeTab === 'security' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <form onSubmit={submitPassword}>
                        <Card className="h-full">
                            <CardTitle title="Change password" desc="Use a strong, unique password." />
                            <div className="space-y-4">
                                <Input label="Current password" type="password" value={passwordForm.data.current_password} onChange={e => passwordForm.setData('current_password', e.target.value)} error={passwordForm.errors.current_password} placeholder="••••••••" />
                                <Input label="New password" type="password" value={passwordForm.data.password} onChange={e => passwordForm.setData('password', e.target.value)} error={passwordForm.errors.password} placeholder="••••••••" />
                                <Input label="Confirm password" type="password" value={passwordForm.data.password_confirmation} onChange={e => passwordForm.setData('password_confirmation', e.target.value)} error={passwordForm.errors.password_confirmation} placeholder="••••••••" />
                            </div>
                            <div className="flex justify-end mt-6 pt-4 border-t border-ocean-border">
                                <SaveBtn processing={passwordForm.processing} label="Update password" />
                            </div>
                        </Card>
                    </form>

                    <Card>
                        <CardTitle title="Danger zone" />
                        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                                    <Ic d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" className="w-4 h-4 text-rose-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-rose-700">Delete account permanently</p>
                                    <p className="text-[12px] text-rose-600/70 mt-1 mb-4">All posts, messages, and connections will be gone forever.</p>
                                    {!showDeleteConfirm ? (
                                        <button type="button" onClick={() => setShowDeleteConfirm(true)}
                                            className="h-9 px-5 text-[13px] font-medium text-rose-600 border border-rose-300 rounded-xl hover:bg-rose-100 transition-all">
                                            Delete my account
                                        </button>
                                    ) : (
                                        <form onSubmit={submitDelete} className="space-y-3">
                                            <p className="text-[12px] text-rose-600 font-medium">Enter password to confirm:</p>
                                            <Input type="password" value={deleteForm.data.password} onChange={e => deleteForm.setData('password', e.target.value)} error={deleteForm.errors.password} placeholder="Your password" />
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => { setShowDeleteConfirm(false); deleteForm.reset(); }}
                                                    className="h-9 px-4 text-[13px] text-ocean-text-muted bg-ocean-surface border border-ocean-border rounded-xl hover:text-ocean-text transition-all">Cancel</button>
                                                <button type="submit" disabled={deleteForm.processing}
                                                    className="h-9 px-4 text-[13px] font-medium text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-all disabled:opacity-50">
                                                    {deleteForm.processing ? 'Deleting…' : 'Delete forever'}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* ══════════════════════ NOTIFICATIONS TAB ══════════════════════ */}
            {activeTab === 'notifications' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardTitle title="Push notifications" desc="Instant alerts for activity."
                            right={savingNotifs && <span className="text-[11px] text-biolum animate-pulse font-medium">Saving…</span>} />
                        <div className="divide-y divide-ocean-border">
                            {[
                                { key: 'push_likes', label: 'Likes', desc: 'Someone likes your post', icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' },
                                { key: 'push_comments', label: 'Comments', desc: 'Someone comments on your post', icon: 'M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z' },
                                { key: 'push_follows', label: 'New followers', desc: 'Someone follows you', icon: 'M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z' },
                                { key: 'push_messages', label: 'Messages', desc: 'You receive a new message', icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75' },
                                { key: 'push_mentions', label: 'Mentions', desc: 'Someone mentions you', icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10' },
                            ].map(item => (
                                <div key={item.key} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-biolum/8 flex items-center justify-center shrink-0">
                                            <Ic d={item.icon} className="w-4 h-4 text-biolum" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-ocean-text">{item.label}</p>
                                            <p className="text-[11px] text-ocean-text-dim">{item.desc}</p>
                                        </div>
                                    </div>
                                    <Toggle on={notifPrefs[item.key]} onChange={() => toggleNotif(item.key)} disabled={savingNotifs} />
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <CardTitle title="Email notifications" desc="Periodic updates to your inbox." />
                        <div className="divide-y divide-ocean-border">
                            {[
                                { key: 'email_digest', label: 'Weekly digest', desc: 'Summary of your weekly activity', icon: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6V7.5z' },
                                { key: 'email_security', label: 'Security alerts', desc: 'Login attempts & password changes', icon: 'M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
                                { key: 'email_updates', label: 'Product updates', desc: 'New features & announcements', icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
                            ].map(item => (
                                <div key={item.key} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-biolum/8 flex items-center justify-center shrink-0">
                                            <Ic d={item.icon} className="w-4 h-4 text-biolum" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-ocean-text">{item.label}</p>
                                            <p className="text-[11px] text-ocean-text-dim">{item.desc}</p>
                                        </div>
                                    </div>
                                    <Toggle on={notifPrefs[item.key]} onChange={() => toggleNotif(item.key)} disabled={savingNotifs} />
                                </div>
                            ))}
                        </div>

                        {/* Notification summary */}
                        <div className="mt-5 pt-5 border-t border-ocean-border">
                            <p className="text-[12px] font-semibold text-ocean-text mb-2">Summary</p>
                            <div className="flex gap-3">
                                <div className="flex-1 p-3 rounded-xl bg-biolum/5 border border-biolum/10 text-center">
                                    <p className="text-lg font-bold text-biolum">{Object.entries(notifPrefs).filter(([k, v]) => k.startsWith('push_') && v).length}</p>
                                    <p className="text-[10px] text-ocean-text-dim uppercase tracking-wider">Push on</p>
                                </div>
                                <div className="flex-1 p-3 rounded-xl bg-biolum/5 border border-biolum/10 text-center">
                                    <p className="text-lg font-bold text-biolum">{Object.entries(notifPrefs).filter(([k, v]) => k.startsWith('email_') && v).length}</p>
                                    <p className="text-[10px] text-ocean-text-dim uppercase tracking-wider">Email on</p>
                                </div>
                                <div className="flex-1 p-3 rounded-xl bg-ocean-surface border border-ocean-border text-center">
                                    <p className="text-lg font-bold text-ocean-text-dim">{Object.values(notifPrefs).filter(v => !v).length}</p>
                                    <p className="text-[10px] text-ocean-text-dim uppercase tracking-wider">Off</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* ══════════════════════ PRIVACY TAB ══════════════════════ */}
            {activeTab === 'privacy' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <form onSubmit={submitPrivacy}>
                        <Card className="h-full">
                            <CardTitle title="Profile visibility" desc="Control who can see your profile." />
                            <div className="space-y-3">
                                {[
                                    { value: 'public', label: 'Public', desc: 'Anyone can see your profile and posts.', icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418' },
                                    { value: 'followers', label: 'Followers only', desc: 'Only followers see your posts.', icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
                                    { value: 'private', label: 'Private', desc: 'Only you can see. Others must request to follow.', icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z' },
                                ].map(opt => (
                                    <label key={opt.value}
                                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${privacyForm.data.privacy_setting === opt.value
                                            ? 'bg-biolum/5 border-biolum/30 ring-1 ring-biolum/10'
                                            : 'border-ocean-border hover:bg-ocean-surface/60'
                                        }`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${privacyForm.data.privacy_setting === opt.value ? 'bg-biolum/15 text-biolum' : 'bg-ocean-surface text-ocean-text-dim'}`}>
                                            <Ic d={opt.icon} className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-ocean-text">{opt.label}</p>
                                            <p className="text-[12px] text-ocean-text-dim">{opt.desc}</p>
                                        </div>
                                        <input type="radio" name="privacy" value={opt.value} checked={privacyForm.data.privacy_setting === opt.value}
                                            onChange={e => privacyForm.setData('privacy_setting', e.target.value)}
                                            className="w-4 h-4 text-biolum border-ocean-border focus:ring-biolum/20" />
                                    </label>
                                ))}
                            </div>
                            {/* Activity Status Toggle */}
                            <div className="flex items-center justify-between py-4 border-t border-ocean-border mt-4">
                                <div>
                                    <p className="text-sm font-medium text-ocean-text">Show activity status</p>
                                    <p className="text-[12px] text-ocean-text-dim">Let others see when you're active</p>
                                </div>
                                <Toggle on={privacyForm.data.show_activity_status} onChange={() => privacyForm.setData('show_activity_status', !privacyForm.data.show_activity_status)} />
                            </div>
                            <div className="flex justify-end mt-6 pt-4 border-t border-ocean-border">
                                <SaveBtn processing={privacyForm.processing} label="Save privacy" />
                            </div>
                        </Card>
                    </form>

                    <Card>
                        <CardTitle title="Privacy tips" desc="How to stay safe on Daloy." />
                        <div className="space-y-4">
                            {[
                                { t: 'Control who messages you', d: 'Set your account to private to require follow approval before anyone can message you.' },
                                { t: 'Block unwanted users', d: 'Blocked users cannot see your posts, profile, or send you messages.' },
                                { t: 'Review tagged content', d: 'You can remove tags from posts and photos from your profile settings.' },
                                { t: 'Report abusive behavior', d: 'Use the report button on any post or profile to flag inappropriate content.' },
                            ].map((tip, i) => (
                                <div key={i} className="flex gap-3 p-3 rounded-xl bg-ocean-surface/50">
                                    <div className="w-7 h-7 rounded-lg bg-biolum/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-[11px] font-bold text-biolum">{i + 1}</span>
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-semibold text-ocean-text">{tip.t}</p>
                                        <p className="text-[11px] text-ocean-text-dim mt-0.5">{tip.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* ══════════════════════ ACCESSIBILITY TAB ══════════════════════ */}
            {activeTab === 'accessibility' && (
                <form onSubmit={submitAccessibility}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardTitle title="Display preferences" desc="Adjust font size and contrast." />
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[13px] font-semibold text-ocean-text mb-3">Font size</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[{ v: 'small', l: 'Small', sample: 'Aa', size: 'text-sm' }, { v: 'medium', l: 'Medium', sample: 'Aa', size: 'text-base' }, { v: 'large', l: 'Large', sample: 'Aa', size: 'text-lg' }].map(s => (
                                            <button type="button" key={s.v} onClick={() => accessibilityForm.setData('font_size', s.v)}
                                                className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border transition-all ${
                                                    accessibilityForm.data.font_size === s.v ? 'bg-biolum/5 border-biolum/30 ring-1 ring-biolum/10' : 'border-ocean-border hover:bg-ocean-surface/60'
                                                }`}>
                                                <span className={`${s.size} font-bold ${accessibilityForm.data.font_size === s.v ? 'text-biolum' : 'text-ocean-text'}`}>{s.sample}</span>
                                                <span className="text-[11px] text-ocean-text-dim">{s.l}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between py-4 border-t border-ocean-border">
                                    <div>
                                        <p className="text-sm font-medium text-ocean-text">Reduce motion</p>
                                        <p className="text-[12px] text-ocean-text-dim">Limit animations and transitions</p>
                                    </div>
                                    <Toggle on={accessibilityForm.data.reduce_motion} onChange={() => accessibilityForm.setData('reduce_motion', !accessibilityForm.data.reduce_motion)} />
                                </div>
                                <div className="flex items-center justify-between py-4 border-t border-ocean-border">
                                    <div>
                                        <p className="text-sm font-medium text-ocean-text">High contrast</p>
                                        <p className="text-[12px] text-ocean-text-dim">Increase contrast for readability</p>
                                    </div>
                                    <Toggle on={accessibilityForm.data.high_contrast} onChange={() => accessibilityForm.setData('high_contrast', !accessibilityForm.data.high_contrast)} />
                                </div>
                                <div className="flex items-center justify-between py-4 border-t border-ocean-border">
                                    <div>
                                        <p className="text-sm font-medium text-ocean-text">Show Now Playing Bar</p>
                                        <p className="text-[12px] text-ocean-text-dim">Display floating track info at the top of the screen.</p>
                                    </div>
                                    <Toggle 
                                        on={localStorage.getItem('daloy_hide_now_playing') !== 'true'} 
                                        onChange={() => {
                                            const curr = localStorage.getItem('daloy_hide_now_playing') === 'true';
                                            localStorage.setItem('daloy_hide_now_playing', !curr ? 'true' : 'false');
                                            window.dispatchEvent(new Event('storage'));
                                            // Force a small state update to rerender toggle
                                            setSavingAccent(prev => !prev);
                                            setTimeout(() => setSavingAccent(prev => !prev), 10);
                                        }} 
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end mt-5 pt-4 border-t border-ocean-border">
                                <SaveBtn processing={accessibilityForm.processing} label="Save preferences" />
                            </div>
                        </Card>

                        <Card>
                            <CardTitle title="Preview" desc="See how your settings look." />
                            <div className={`p-5 rounded-xl border border-ocean-border ${accessibilityForm.data.high_contrast ? 'bg-white' : 'bg-ocean-surface/30'}`}>
                                <p className={`font-bold text-ocean-text mb-2 ${accessibilityForm.data.font_size === 'large' ? 'text-lg' : accessibilityForm.data.font_size === 'small' ? 'text-sm' : 'text-base'}`}>
                                    Sample heading text
                                </p>
                                <p className={`text-ocean-text-dim mb-4 ${accessibilityForm.data.font_size === 'large' ? 'text-base' : accessibilityForm.data.font_size === 'small' ? 'text-xs' : 'text-sm'}`}>
                                    This is how body text will appear throughout the app with your current accessibility settings applied.
                                </p>
                                <div className="flex gap-2">
                                    <button type="button" className="h-9 px-4 bg-biolum text-white text-[13px] font-medium rounded-lg">Primary</button>
                                    <button type="button" className="h-9 px-4 bg-ocean-surface border border-ocean-border text-ocean-text text-[13px] font-medium rounded-lg">Secondary</button>
                                </div>
                            </div>
                            <div className="mt-5 p-4 rounded-xl bg-biolum/5 border border-biolum/10">
                                <p className="text-[12px] font-medium text-biolum mb-1">Tip</p>
                                <p className="text-[12px] text-ocean-text-dim">Accessibility settings apply across the entire app and are saved to your account.</p>
                            </div>
                        </Card>
                    </div>
                </form>
            )}

            {/* ══════════════════════ PERSONALIZE TAB ══════════════════════ */}
            {activeTab === 'personalize' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Interest Tags */}
                    <Card>
                        <CardTitle title="Interest Tags" desc={`Select up to 10 topics you're interested in (${selectedInterests.length}/10).`}
                            right={savingInterests && <span className="text-[11px] text-biolum animate-pulse font-medium">Saving…</span>} />
                        <div className="flex flex-wrap gap-2 mb-4">
                            {interest_tags.map(tag => (
                                <button key={tag.id} type="button" onClick={() => toggleInterest(tag.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        selectedInterests.includes(tag.id)
                                            ? 'bg-biolum/20 text-biolum border border-biolum/30'
                                            : 'bg-ocean-surface/60 text-ocean-text-dim border border-ocean-divider hover:bg-ocean-surface hover:text-ocean-text'
                                    }`}>
                                    {tag.icon && <span className="mr-1">{tag.icon}</span>}{tag.name}
                                </button>
                            ))}
                        </div>
                        <button type="button" onClick={saveInterests} disabled={savingInterests}
                            className="h-9 px-5 bg-biolum text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
                            {savingInterests ? 'Saving…' : 'Save Interests'}
                        </button>
                    </Card>



                    {/* Profile Accent */}
                    <Card>
                        <CardTitle title="Profile Accent Color" desc="Choose your profile's accent color." />
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {[
                                { id: 'deep-blue', label: 'Deep Blue', color: 'bg-blue-600' },
                                { id: 'coral', label: 'Coral', color: 'bg-rose-500' },
                                { id: 'bioluminescent-green', label: 'Bio Green', color: 'bg-emerald-400' },
                                { id: 'abyssal-purple', label: 'Abyssal', color: 'bg-violet-600' },
                                { id: 'seafoam', label: 'Seafoam', color: 'bg-teal-400' },
                                { id: 'sunset-orange', label: 'Sunset', color: 'bg-orange-500' },
                            ].map(accent => (
                                <button key={accent.id} type="button" onClick={() => setProfileAccent(accent.id)}
                                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                                        profileAccent === accent.id ? 'border-biolum/40 ring-1 ring-biolum/10 bg-biolum/5' : 'border-ocean-border hover:bg-ocean-surface/60'
                                    }`}>
                                    <div className={`w-6 h-6 rounded-full ${accent.color} shrink-0`} />
                                    <span className="text-xs font-medium text-ocean-text">{accent.label}</span>
                                </button>
                            ))}
                        </div>
                        <button type="button" onClick={saveAccent} disabled={savingAccent}
                            className="h-9 px-5 bg-biolum text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
                            {savingAccent ? 'Saving…' : 'Save Accent'}
                        </button>
                    </Card>

                    {/* Muted Keywords */}
                    <Card>
                        <CardTitle title="Muted Keywords" desc="Posts containing these words will be hidden from your feed." />
                        <div className="flex gap-2 mb-4">
                            <input type="text" value={newKeyword} onChange={e => setNewKeyword(e.target.value)}
                                placeholder="Add a keyword…" maxLength={100}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMutedKeyword())}
                                className="flex-1 h-10 px-4 bg-ocean-surface border border-ocean-border rounded-xl text-ocean-text text-sm placeholder:text-ocean-text-dim/50 focus:outline-none focus:ring-2 focus:ring-biolum/30" />
                            <button type="button" onClick={addMutedKeyword}
                                className="h-10 px-4 bg-biolum text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all">Add</button>
                        </div>
                        {mutedKws.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {mutedKws.map(kw => (
                                    <div key={kw.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-ocean-surface/60 border border-ocean-divider rounded-full">
                                        <span className="text-xs text-ocean-text">{kw.keyword}</span>
                                        <button onClick={() => removeMutedKeyword(kw.id)} className="text-ocean-text-dim/50 hover:text-rose-400 transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-ocean-text-dim">No muted keywords. Posts with muted keywords won't appear in your feed.</p>
                        )}
                    </Card>

                    {/* Login Activity */}
                    <Card>
                        <CardTitle title="Login Activity" desc="Recent login sessions for your account." />
                        {login_activities.length > 0 ? (
                            <div className="space-y-2">
                                {login_activities.map((activity, i) => (
                                    <div key={activity.id || i} className="flex items-center justify-between p-3 rounded-xl bg-ocean-surface/50 border border-ocean-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-biolum/8 flex items-center justify-center">
                                                <Ic d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" className="w-4 h-4 text-biolum" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-ocean-text">{activity.ip_address || 'Unknown'}</p>
                                                <p className="text-[10px] text-ocean-text-dim">{activity.user_agent?.substring(0, 50) || 'Unknown device'}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-ocean-text-dim">{activity.logged_in_at ? new Date(activity.logged_in_at).toLocaleDateString() : ''}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-ocean-text-dim">No login activity recorded.</p>
                        )}
                        <button type="button" onClick={logoutOtherSessions}
                            className="mt-4 h-9 px-4 text-xs font-semibold text-rose-500 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors">
                            Log out all other sessions
                        </button>
                    </Card>
                </div>
            )}

            {/* ══════════════════════ BLOCKED TAB ══════════════════════ */}
            {activeTab === 'blocked' && (
                <Card>
                    <CardTitle title="Blocked users" desc="Blocked people can't see your profile, posts, or message you." />
                    {blocked_users.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-ocean-surface flex items-center justify-center mb-4">
                                <Ic d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-8 h-8 text-emerald-500/60" />
                            </div>
                            <p className="text-base font-semibold text-ocean-text mb-1">All clear!</p>
                            <p className="text-[13px] text-ocean-text-dim max-w-sm">You haven't blocked anyone. Block users from their profile page using the ⋯ menu.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {blocked_users.map(bu => (
                                <div key={bu.id} className="flex items-center justify-between p-4 rounded-xl bg-ocean-surface/50 border border-ocean-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-biolum flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                                            {bu.profile_picture ? <img src={bu.profile_picture} className="w-full h-full object-cover" alt="" /> : bu.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-ocean-text">{bu.name}</p>
                                            <p className="text-[11px] text-ocean-text-dim">@{bu.username}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleUnblock(bu.id)}
                                        className="h-8 px-3 text-xs font-semibold text-rose-500 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors">
                                        Unblock
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* ══════════════════════ HELP TAB ══════════════════════ */}
            {activeTab === 'help' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardTitle title="Help & support" desc="Find answers and get help." />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { t: 'Getting started', d: 'Learn the basics of Daloy', icon: 'M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342' },
                                    { t: 'Privacy & safety', d: 'How to protect your account', icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
                                    { t: 'Report a problem', d: 'Let us know about bugs', icon: 'M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5' },
                                    { t: 'Community guidelines', d: 'Rules for a respectful space', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
                                ].map(c => (
                                    <button key={c.t} className="flex items-start gap-3 p-4 rounded-xl bg-ocean-surface/50 border border-ocean-border hover:border-biolum/20 hover:shadow-sm transition-all text-left group">
                                        <div className="w-9 h-9 rounded-xl bg-biolum/8 flex items-center justify-center shrink-0 group-hover:bg-biolum/15 transition-colors">
                                            <Ic d={c.icon} className="w-[18px] h-[18px] text-biolum" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-semibold text-ocean-text group-hover:text-biolum transition-colors">{c.t}</p>
                                            <p className="text-[11px] text-ocean-text-dim mt-0.5">{c.d}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <Card>
                        <CardTitle title="About Daloy" />
                        <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-biolum/5 border border-biolum/10">
                            <div className="w-10 h-10 rounded-xl bg-biolum flex items-center justify-center shrink-0">
                                <span className="text-white text-lg font-black">D</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-ocean-text">Daloy</p>
                                <p className="text-[11px] text-ocean-text-dim">Version 2.0.0</p>
                            </div>
                        </div>
                        <div className="divide-y divide-ocean-border text-sm">
                            {[{ l: 'Terms of service' }, { l: 'Privacy policy' }, { l: 'Licenses' }, { l: 'Contact us' }].map(row => (
                                <div key={row.l} className="flex justify-between py-3 first:pt-0 last:pb-0">
                                    <span className="text-ocean-text-dim text-[13px]">{row.l}</span>
                                    <span className="text-biolum cursor-pointer hover:underline text-[13px]">View →</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}
            </div>
        </MainLayout>
    );
}
