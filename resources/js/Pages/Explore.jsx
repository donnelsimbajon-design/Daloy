import React, { useState, useRef } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import PostCard from '@/Components/PostCard';
import axios from 'axios';

// ── Helper: relative time ────────────────────────────────────────────
function getTimeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Helper: format count ─────────────────────────────────────────────
function formatCount(n) {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
}

export default function Explore({
    featuredPosts = [],
    trendingHashtags = [],
    trendingPosts = [],
    recommendedSchools = [],
    collections = [],
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [feedFilter, setFeedFilter] = useState('hot'); // hot | new
    const searchTimeout = useRef(null);

    // Sort trending posts by filter
    const sortedPosts = [...trendingPosts].sort((a, b) => {
        if (feedFilter === 'new') return new Date(b.created_at) - new Date(a.created_at);
        return ((b.reactions_count || 0) * 2 + (b.comments_count || 0)) -
               ((a.reactions_count || 0) * 2 + (a.comments_count || 0));
    });

    const handleSearch = (query) => {
        setSearchQuery(query);
        clearTimeout(searchTimeout.current);
        if (!query.trim()) {
            setSearchResults(null);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const res = await axios.get('/api/search', { params: { q: query } });
                setSearchResults(res.data);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 400);
    };

    // Pick the first featured post as the hero, rest as secondary
    const heroPost = featuredPosts[0] || null;
    const secondaryPosts = featuredPosts.slice(1, 4);

    return (
        <MainLayout>
            <Head title="Explore — Deep Tides" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-20">
                {/* ═══════════════════════════════════════════════════
                    SEARCH BAR
                ═══════════════════════════════════════════════════ */}
                <div className="relative mb-8 max-w-2xl mx-auto">
                    <div className="relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search currents..."
                            className="w-full pl-12 pr-10 py-3 bg-ocean-card border border-ocean-divider rounded-2xl text-sm text-ocean-text placeholder-ocean-text-dim/60 focus:border-biolum/40 transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => { setSearchQuery(''); setSearchResults(null); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-ocean-text-dim hover:text-ocean-text transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                    {isSearching && (
                        <div className="absolute right-12 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-ocean-text-dim/30 border-t-biolum rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* ── Search Results overlay ── */}
                {searchResults && searchQuery ? (
                    <div className="max-w-3xl mx-auto space-y-6 animate-subtle-in">
                        <h2 className="text-lg font-bold text-ocean-text">Results for "{searchQuery}"</h2>

                        {searchResults.users?.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-ocean-text-dim mb-3 uppercase tracking-widest">Voyagers</h3>
                                <div className="space-y-2">
                                    {searchResults.users.map(user => (
                                        <Link key={user.id} href={`/users/${user.id}`} className="flex items-center gap-3 p-3 bg-ocean-card border border-ocean-divider rounded-xl hover:border-biolum/30 transition-all group">
                                            <div className="w-10 h-10 rounded-full bg-ocean-surface overflow-hidden shrink-0 ring-1 ring-ocean-divider">
                                                {user.profile_picture ? <img src={user.profile_picture} alt="" className="w-full h-full object-cover" /> : <span className="flex items-center justify-center w-full h-full text-sm font-bold text-ocean-text-dim">{user.name?.[0]}</span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-ocean-text group-hover:text-biolum transition-colors truncate">{user.name}</p>
                                                <p className="text-xs text-ocean-text-dim truncate">@{user.username}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {searchResults.posts?.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-ocean-text-dim mb-3 uppercase tracking-widest">Posts</h3>
                                <div className="space-y-4">
                                    {searchResults.posts.map(post => <PostCard key={post.id} post={post} />)}
                                </div>
                            </div>
                        )}

                        {searchResults.schools?.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-ocean-text-dim mb-3 uppercase tracking-widest">Schools</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {searchResults.schools.map(school => (
                                        <Link key={school.id} href={`/schools/${school.id}`} className="p-4 bg-ocean-card border border-ocean-divider rounded-xl hover:border-biolum/30 transition-all group">
                                            <h4 className="text-sm font-bold text-ocean-text group-hover:text-biolum transition-colors">{school.name}</h4>
                                            <p className="text-xs text-ocean-text-dim mt-1 line-clamp-2">{school.description}</p>
                                            <p className="text-[10px] text-ocean-text-dim/70 mt-2">{school.members_count} members</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!searchResults.users?.length && !searchResults.posts?.length && !searchResults.schools?.length && (
                            <div className="text-center py-16">
                                <div className="text-4xl mb-3">🌊</div>
                                <p className="text-ocean-text-dim">No currents found for "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* ═══════════════════════════════════════════════════
                            FEATURED EXPLORATION — "Deep Tides" Hero
                        ═══════════════════════════════════════════════════ */}
                        <section className="mb-10 animate-subtle-in">
                            {/* Section Header */}
                            <div className="flex items-end justify-between mb-5">
                                <div>
                                    <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-biolum mb-1">Featured Exploration</p>
                                    <h1 className="text-2xl sm:text-3xl font-black text-ocean-text tracking-tight">Deep Tides</h1>
                                </div>
                                <Link href="/schools" className="text-sm font-semibold text-ocean-text-dim hover:text-biolum transition-colors flex items-center gap-1 group">
                                    View Atlas
                                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                                </Link>
                            </div>

                            {/* Featured Grid */}
                            {(heroPost || secondaryPosts.length > 0) ? (
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                                    {/* Hero Card — Large */}
                                    {heroPost && (
                                        <div className="lg:col-span-3 relative group rounded-2xl overflow-hidden bg-ocean-card border border-ocean-divider hover:border-ocean-border transition-all cursor-pointer"
                                             style={{ minHeight: '340px' }}>
                                            {/* Background image */}
                                            {heroPost.media?.[0]?.url ? (
                                                <img
                                                    src={heroPost.media[0].url}
                                                    alt=""
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-ocean-surface to-ocean-card" />
                                            )}
                                            {/* Gradient overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                                            {/* Content overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                                                {/* Tags */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    {heroPost.hashtags?.slice(0, 2).map(tag => (
                                                        <span key={tag.id} className="px-2.5 py-1 bg-white/15 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
                                                            {tag.name}
                                                        </span>
                                                    ))}
                                                    {heroPost.school && (
                                                        <span className="px-2.5 py-1 bg-biolum/80 text-biolum-foreground text-[10px] font-bold uppercase tracking-wider rounded-md">
                                                            {heroPost.school.name}
                                                        </span>
                                                    )}
                                                    {!heroPost.hashtags?.length && !heroPost.school && (
                                                        <span className="px-2.5 py-1 bg-biolum/80 text-biolum-foreground text-[10px] font-bold uppercase tracking-wider rounded-md">
                                                            Top Story
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Title / Content preview */}
                                                <h2 className="text-xl sm:text-2xl font-black text-white leading-snug mb-2 line-clamp-2">
                                                    {heroPost.content?.substring(0, 80) || 'Featured Post'}
                                                </h2>
                                                <p className="text-sm text-white/70 line-clamp-2 leading-relaxed max-w-lg">
                                                    {heroPost.content?.substring(0, 150)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Secondary Cards */}
                                    <div className="lg:col-span-2 flex flex-col gap-3">
                                        {secondaryPosts.map((post, i) => (
                                            <Link key={post.id} href={`/users/${post.user?.id}`}
                                                className="relative group rounded-2xl overflow-hidden bg-ocean-card border border-ocean-divider hover:border-ocean-border transition-all flex-1"
                                                style={{ minHeight: '105px' }}
                                            >
                                                {/* Background */}
                                                {post.media?.[0]?.url ? (
                                                    <img
                                                        src={post.media[0].url}
                                                        alt=""
                                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-ocean-surface to-ocean-card" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                                                {/* Content */}
                                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                                    {/* Category tag */}
                                                    {(post.hashtags?.[0] || post.school) && (
                                                        <span className="inline-block px-2 py-0.5 bg-white/15 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider rounded mb-1.5">
                                                            {post.hashtags?.[0]?.name || post.school?.name}
                                                        </span>
                                                    )}
                                                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                                                        {post.content?.substring(0, 60) || 'Trending Post'}
                                                    </h3>
                                                </div>
                                            </Link>
                                        ))}

                                        {/* Fill empty slots with placeholder */}
                                        {secondaryPosts.length < 2 && Array.from({ length: 2 - secondaryPosts.length }).map((_, i) => (
                                            <div key={`empty-${i}`} className="relative rounded-2xl overflow-hidden bg-ocean-card border border-ocean-divider flex-1 flex items-center justify-center" style={{ minHeight: '105px' }}>
                                                <div className="text-center">
                                                    <div className="text-3xl mb-1 opacity-30">🌊</div>
                                                    <p className="text-xs text-ocean-text-dim/50">More currents coming soon</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* Empty state for featured */
                                <div className="rounded-2xl bg-ocean-card border border-ocean-divider p-12 text-center">
                                    <div className="text-5xl mb-3 opacity-40">🌊</div>
                                    <h3 className="text-lg font-bold text-ocean-text mb-1">No featured explorations yet</h3>
                                    <p className="text-sm text-ocean-text-dim">Posts with media and high engagement will appear here.</p>
                                </div>
                            )}
                        </section>

                        {/* ═══════════════════════════════════════════════════
                            TRENDING FEED + SIDEBAR (2-column)
                        ═══════════════════════════════════════════════════ */}
                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* ── LEFT: Trending Feed ── */}
                            <div className="lg:col-span-2">
                                {/* Section header with filter */}
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-lg sm:text-xl font-black text-ocean-text tracking-tight">Trending Across the Ocean</h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setFeedFilter('hot')}
                                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                                                feedFilter === 'hot'
                                                    ? 'bg-ocean-card border border-ocean-border text-ocean-text shadow-sm'
                                                    : 'text-ocean-text-dim hover:text-ocean-text-muted'
                                            }`}
                                        >
                                            Hot
                                        </button>
                                        <button
                                            onClick={() => setFeedFilter('new')}
                                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                                                feedFilter === 'new'
                                                    ? 'bg-biolum text-biolum-foreground shadow-sm'
                                                    : 'text-ocean-text-dim hover:text-ocean-text-muted'
                                            }`}
                                        >
                                            New
                                        </button>
                                    </div>
                                </div>

                                {/* Article-style trending posts */}
                                <div className="space-y-1">
                                    {sortedPosts.length > 0 ? sortedPosts.map(post => (
                                        <TrendingPostRow key={post.id} post={post} />
                                    )) : (
                                        <div className="text-center py-16">
                                            <div className="text-4xl mb-3 opacity-40">📊</div>
                                            <p className="text-sm text-ocean-text-dim">No trending posts yet. Be the first to make waves!</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── RIGHT: Reef Sidebar ── */}
                            <div className="space-y-6">
                                {/* Trending Currents (Hashtags) */}
                                <div className="bg-ocean-card border border-ocean-divider rounded-2xl p-5">
                                    <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase text-ocean-text-dim mb-4">Trending Currents</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {trendingHashtags.length > 0 ? trendingHashtags.map((tag, i) => (
                                            <Link
                                                key={tag.id || i}
                                                href={`/hashtag/${tag.name}`}
                                                className="px-3 py-1.5 bg-ocean-surface border border-ocean-divider rounded-full text-xs font-semibold text-ocean-text hover:bg-ocean-hover hover:border-ocean-border transition-all"
                                            >
                                                #{tag.name}
                                            </Link>
                                        )) : (
                                            <p className="text-xs text-ocean-text-dim">No trending currents yet</p>
                                        )}
                                    </div>
                                </div>

                                {/* Recommended For You (Schools) */}
                                <div className="bg-ocean-card border border-ocean-divider rounded-2xl p-5">
                                    <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase text-biolum mb-4">Recommended For You</h3>
                                    <div className="space-y-3.5">
                                        {recommendedSchools.length > 0 ? recommendedSchools.map(school => (
                                            <Link
                                                key={school.id}
                                                href={`/schools/${school.id}`}
                                                className="flex items-center gap-3 group"
                                            >
                                                <div className="w-11 h-11 rounded-xl bg-ocean-surface border border-ocean-divider overflow-hidden shrink-0">
                                                    {school.profile_image ? (
                                                        <img src={school.profile_image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="flex items-center justify-center w-full h-full text-base font-bold text-ocean-text-dim">{school.name?.[0]}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-ocean-text group-hover:text-biolum transition-colors truncate">{school.name}</p>
                                                    <p className="text-[11px] text-ocean-text-dim uppercase tracking-wider">{formatCount(school.members_count)} Followers</p>
                                                </div>
                                                <div className="p-2 rounded-full bg-biolum text-biolum-foreground hover:bg-biolum-bright transition-colors shrink-0">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                    </svg>
                                                </div>
                                            </Link>
                                        )) : (
                                            <p className="text-xs text-ocean-text-dim">No recommendations yet</p>
                                        )}
                                    </div>

                                    <Link
                                        href="/schools"
                                        className="mt-5 block w-full text-center py-2.5 bg-biolum text-biolum-foreground text-xs font-bold rounded-xl hover:bg-biolum-bright transition-colors"
                                    >
                                        Find More Collections
                                    </Link>
                                </div>

                                {/* Collections (if available) */}
                                {collections.length > 0 && (
                                    <div className="bg-ocean-card border border-ocean-divider rounded-2xl p-5">
                                        <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase text-ocean-text-dim mb-4">Curated Collections</h3>
                                        <div className="space-y-3">
                                            {collections.map(col => (
                                                <div key={col.id} className="rounded-xl overflow-hidden border border-ocean-divider hover:border-ocean-border transition-all cursor-pointer group">
                                                    {col.cover_image && (
                                                        <div className="h-20 overflow-hidden relative">
                                                            <img src={col.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                                        </div>
                                                    )}
                                                    <div className={`p-3 ${col.cover_image ? '-mt-5 relative' : ''}`}>
                                                        <h4 className="text-xs font-bold text-ocean-text">{col.title || col.name}</h4>
                                                        {col.description && <p className="text-[10px] text-ocean-text-dim mt-0.5 line-clamp-1">{col.description}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* ═══════════════════════════════════════════════════
                            FOOTER
                        ═══════════════════════════════════════════════════ */}
                        <footer className="mt-16 pt-6 border-t border-ocean-divider flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-ocean-text-dim/60">
                            <p>© {new Date().getFullYear()} Daloy 2.0. All currents reserved.</p>
                            <div className="flex items-center gap-5">
                                <Link href="/settings" className="hover:text-ocean-text-muted transition-colors uppercase tracking-wider font-medium">Status</Link>
                                <Link href="/settings" className="hover:text-ocean-text-muted transition-colors uppercase tracking-wider font-medium">Privacy</Link>
                                <Link href="/settings" className="hover:text-ocean-text-muted transition-colors uppercase tracking-wider font-medium">Terms</Link>
                            </div>
                        </footer>
                    </>
                )}
            </div>
        </MainLayout>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   Trending Post Row — Article-style compact card (matches reference)
═══════════════════════════════════════════════════════════════════════ */
function TrendingPostRow({ post }) {
    const author = post.user || {};
    const timeAgo = getTimeAgo(post.created_at);
    const media = post.media?.[0] || null;
    const initials = author.name ? author.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';

    const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked || false);

    const handleBookmark = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const prev = isBookmarked;
        setIsBookmarked(!isBookmarked);
        try {
            const res = await axios.post(`/posts/${post.id}/bookmark`);
            setIsBookmarked(res.data.bookmarked);
        } catch {
            setIsBookmarked(prev);
        }
    };

    return (
        <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-ocean-hover border border-transparent hover:border-ocean-divider transition-all group cursor-pointer">
            {/* Thumbnail */}
            {media && (
                <Link href={`/users/${author.id}`} className="shrink-0 w-[120px] h-[85px] rounded-xl overflow-hidden bg-ocean-surface border border-ocean-divider">
                    <img
                        src={media.url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                </Link>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Author row */}
                <div className="flex items-center gap-2 mb-1.5">
                    <Link href={`/users/${author.id}`} className="shrink-0">
                        <div className="w-5 h-5 rounded-full bg-ocean-surface overflow-hidden ring-1 ring-ocean-divider">
                            {author.profile_picture ? (
                                <img src={author.profile_picture} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="flex items-center justify-center w-full h-full text-[8px] font-bold text-ocean-text-dim">{initials}</span>
                            )}
                        </div>
                    </Link>
                    <Link href={`/users/${author.id}`} className="text-[11px] font-bold text-ocean-text uppercase tracking-wide hover:text-biolum transition-colors truncate">{author.name}</Link>
                    <span className="text-[10px] text-ocean-text-dim">· {timeAgo}</span>
                </div>

                {/* Title-style content */}
                <h3 className="text-sm font-bold text-ocean-text leading-snug mb-1 line-clamp-2 group-hover:text-biolum transition-colors">
                    {post.content?.substring(0, 100) || 'Untitled Post'}
                </h3>

                {/* Excerpt */}
                {post.content?.length > 100 && (
                    <p className="text-xs text-ocean-text-dim leading-relaxed line-clamp-1 mb-2">
                        {post.content.substring(100, 200)}...
                    </p>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-[11px] text-ocean-text-dim">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                        {formatCount(post.reactions_count || 0)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-ocean-text-dim">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                        </svg>
                        {formatCount(post.comments_count || 0)}
                    </span>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Bookmark */}
                    <button
                        onClick={handleBookmark}
                        className={`p-1 rounded transition-colors ${isBookmarked ? 'text-biolum' : 'text-ocean-text-dim/40 hover:text-ocean-text-dim'}`}
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                    >
                        <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
