import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    Users, MessageSquare, Waves, Globe, ShieldCheck,
    Video, Zap, ArrowRight, ChevronDown,
    Music, Bell, Search, Hash, Heart
} from 'lucide-react';

// ── Intersection Observer hook for reveal animations ──────────────
function useReveal(threshold = 0.15) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return [ref, visible];
}

// ── Feature Card ──────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, index }) {
    const [ref, visible] = useReveal();
    return (
        <div
            ref={ref}
            className="group border border-white/10 rounded-2xl p-8 hover:border-white/30 transition-all duration-500 hover:bg-white/[0.03] relative overflow-hidden"
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(32px)',
                transition: `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s, border-color 0.3s, background 0.3s`,
            }}
        >
            {/* subtle glow on hover */}
            <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)' }} />

            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:bg-white/10 transition-colors">
                <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2 tracking-tight">{title}</h3>
            <p className="text-white/45 text-sm leading-relaxed">{description}</p>
        </div>
    );
}

// ── Stats Item ────────────────────────────────────────────────────
function StatItem({ value, label, index }) {
    const [ref, visible] = useReveal();
    return (
        <div
            ref={ref}
            className="text-center"
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.6s ease ${index * 0.12}s, transform 0.6s ease ${index * 0.12}s`,
            }}
        >
            <div className="text-4xl md:text-5xl font-bold text-white tracking-tighter mb-2">{value}</div>
            <div className="text-white/40 text-sm font-medium uppercase tracking-widest">{label}</div>
        </div>
    );
}

export default function Landing() {
    const [scrolled, setScrolled] = useState(false);
    const [heroRef, heroVisible] = useReveal(0.01);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    const features = [
        {
            icon: Waves,
            title: 'Deep Flow Feed',
            description: 'Your personalized content stream powered by real connections — posts, stories, and moments from the people you follow.',
        },
        {
            icon: Users,
            title: 'Schools',
            description: 'Join or create communities around shared interests. Every school is a dedicated space for conversation, events, and collaboration.',
        },
        {
            icon: Video,
            title: 'Group Calls',
            description: 'Crystal-clear HD video calls with up to dozens of participants. Screen sharing, in-call chat, and host controls built in.',
        },
        {
            icon: MessageSquare,
            title: 'Real-Time Messaging',
            description: 'Instant 1-on-1 and group conversations with media sharing, read receipts, and live typing indicators.',
        },
        {
            icon: Music,
            title: 'Currents Music',
            description: 'Live synchronized music sessions inside Schools. Everyone in the current hears the same track at the same moment.',
        },
        {
            icon: Bell,
            title: 'Ripples',
            description: 'Smart, prioritized notifications that keep you in the loop on what truly matters — without the noise.',
        },
        {
            icon: Globe,
            title: 'Events',
            description: 'Discover and organize events within your schools and across the platform. RSVP, share, and bring your community together.',
        },
        {
            icon: ShieldCheck,
            title: 'Privacy First',
            description: 'Granular controls over who sees your content, who can message you, and a silent mutual-block system that protects everyone.',
        },
        {
            icon: Search,
            title: 'Explore',
            description: 'Surface trending content, discover voyagers with shared interests, and find your next school through smart search.',
        },
    ];

    return (
        <>
            <Head title="Daloy — Dive into the Current" />

            <div className="min-h-screen bg-black text-white" style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>

                {/* ── Nav ───────────────────────────────────────────────── */}
                <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                    scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/8' : ''
                }`}>
                    <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                        <span
                            className="text-2xl font-medium tracking-wide text-white cursor-pointer"
                            style={{ fontFamily: '"Pacifico", cursive' }}
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            Daloy
                        </span>

                        <div className="flex items-center gap-2 md:gap-6">
                            <button
                                onClick={() => scrollTo('about')}
                                className="hidden md:block text-white/50 hover:text-white text-sm font-medium transition-colors cursor-pointer"
                            >
                                About
                            </button>
                            <button
                                onClick={() => scrollTo('features')}
                                className="hidden md:block text-white/50 hover:text-white text-sm font-medium transition-colors cursor-pointer"
                            >
                                Features
                            </button>
                            <Link
                                href="/login"
                                className="text-white/70 hover:text-white text-sm font-medium transition-colors"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/register"
                                className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-full hover:bg-white/90 transition-all duration-200 hover:scale-[1.02]"
                            >
                                Get started
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* ── Hero ──────────────────────────────────────────────── */}
                <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
                    {/* Subtle grid */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.03]"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
                            backgroundSize: '80px 80px',
                        }}
                    />
                    {/* Radial fade on grid */}
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, black 100%)' }} />

                    <div
                        ref={heroRef}
                        style={{
                            opacity: heroVisible ? 1 : 0,
                            transform: heroVisible ? 'translateY(0)' : 'translateY(24px)',
                            transition: 'opacity 0.9s ease, transform 0.9s ease',
                        }}
                        className="relative z-10 max-w-4xl mx-auto"
                    >
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-1.5 mb-8 text-white/50 text-xs font-medium uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                            Social Media, Redefined
                        </div>

                        {/* Headline */}
                        <h1
                            className="text-6xl md:text-8xl lg:text-[6.5rem] font-bold leading-[0.95] tracking-[-0.04em] text-white mb-6"
                        >
                            Dive into
                            <br />
                            <span className="italic font-light text-white/60">the current.</span>
                        </h1>

                        <p className="text-white/40 text-lg md:text-xl max-w-xl mx-auto mb-12 leading-relaxed font-light">
                            Daloy is an ocean-themed social platform where communities flow naturally —
                            real connections, live experiences, and meaningful conversations.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/register"
                                className="group inline-flex items-center gap-2 bg-white text-black font-semibold px-8 py-3.5 rounded-full hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] text-sm"
                            >
                                Start voyaging
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <button
                                onClick={() => scrollTo('about')}
                                className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium transition-colors cursor-pointer"
                            >
                                Learn more
                                <ChevronDown className="w-4 h-4 animate-bounce" />
                            </button>
                        </div>
                    </div>

                    {/* Scroll hint */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-20">
                        <div className="w-px h-16 bg-gradient-to-b from-white to-transparent mx-auto" />
                    </div>
                </section>

                {/* ── Stats Bar ─────────────────────────────────────────── */}
                <section className="border-y border-white/8 py-16 px-6">
                    <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
                        <StatItem value="10K+" label="Voyagers" index={0} />
                        <StatItem value="500+" label="Schools" index={1} />
                        <StatItem value="1M+" label="Messages" index={2} />
                        <StatItem value="99.9%" label="Uptime" index={3} />
                    </div>
                </section>

                {/* ── About ─────────────────────────────────────────────── */}
                <section id="about" className="py-32 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            {/* Left */}
                            <AboutLeft />
                            {/* Right */}
                            <AboutRight />
                        </div>
                    </div>
                </section>

                {/* ── Divider ───────────────────────────────────────────── */}
                <div className="max-w-6xl mx-auto px-6">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                </div>

                {/* ── Features ──────────────────────────────────────────── */}
                <section id="features" className="py-32 px-6">
                    <div className="max-w-6xl mx-auto">
                        <FeaturesHeader />
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-16">
                            {features.map((f, i) => (
                                <FeatureCard key={f.title} {...f} index={i} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA ───────────────────────────────────────────────── */}
                <CTASection />

                {/* ── Footer ────────────────────────────────────────────── */}
                <footer className="border-t border-white/8 py-12 px-6">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                        <span
                            className="text-xl font-medium text-white/80"
                            style={{ fontFamily: '"Pacifico", cursive' }}
                        >
                            Daloy
                        </span>
                        <div className="flex items-center gap-8 text-sm text-white/30">
                            <button onClick={() => scrollTo('about')} className="hover:text-white/60 transition-colors cursor-pointer">About</button>
                            <button onClick={() => scrollTo('features')} className="hover:text-white/60 transition-colors cursor-pointer">Features</button>
                            <Link href="/login" className="hover:text-white/60 transition-colors">Login</Link>
                            <Link href="/register" className="hover:text-white/60 transition-colors">Register</Link>
                        </div>
                        <p className="text-xs text-white/20">
                            © 2026 Daloy. All rights reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}

// ── Sub-components (keep Landing() clean) ─────────────────────────

function AboutLeft() {
    const [ref, visible] = useReveal();
    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateX(0)' : 'translateX(-24px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
            <div className="text-white/30 text-xs font-semibold uppercase tracking-[0.2em] mb-4">About Daloy</div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6 text-white">
                Not just another<br />
                <span className="text-white/40 font-light italic">social network.</span>
            </h2>
            <p className="text-white/45 leading-relaxed mb-6">
                Daloy (Filipino for <em>"flow"</em>) is built around the idea that online communities
                should feel natural — like water finding its own level. No algorithms forcing
                viral outrage. No dark patterns hijacking your attention.
            </p>
            <p className="text-white/35 leading-relaxed text-sm">
                We built Daloy for voyagers who want real connection: deep conversations,
                live music sessions, crystal-clear group calls, and communities — called
                Schools — that actually form around shared interests, not engagement metrics.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
                {['Ocean-Themed', 'Privacy-First', 'Community-Driven', 'Open'].map(tag => (
                    <span key={tag} className="border border-white/15 rounded-full px-4 py-1.5 text-xs text-white/50 font-medium">
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
}

function AboutRight() {
    const [ref, visible] = useReveal();
    const pillars = [
        { icon: Heart, label: 'Real Connections', sub: 'Built around people, not engagement' },
        { icon: ShieldCheck, label: 'Your Privacy', sub: 'Silent blocks, granular controls' },
        { icon: Zap, label: 'Live Experiences', sub: 'Calls, events, music — all real-time' },
        { icon: Hash, label: 'Niche Communities', sub: 'Schools for every interest' },
    ];
    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateX(0)' : 'translateX(24px)',
            transition: 'opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s',
        }}
            className="grid grid-cols-2 gap-4"
        >
            {pillars.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="border border-white/10 rounded-2xl p-5 hover:border-white/25 transition-colors group">
                    <Icon className="w-5 h-5 text-white/40 mb-3 group-hover:text-white/70 transition-colors" />
                    <div className="text-white font-semibold text-sm mb-1">{label}</div>
                    <div className="text-white/35 text-xs leading-relaxed">{sub}</div>
                </div>
            ))}
        </div>
    );
}

function FeaturesHeader() {
    const [ref, visible] = useReveal();
    return (
        <div ref={ref} className="text-center max-w-2xl mx-auto" style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
            <div className="text-white/30 text-xs font-semibold uppercase tracking-[0.2em] mb-4">Features</div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
                Everything in<br />
                <span className="text-white/40 font-light italic">one current.</span>
            </h2>
            <p className="text-white/40 text-base leading-relaxed">
                From your daily feed to live video calls — Daloy is the complete platform for modern communities.
            </p>
        </div>
    );
}

function CTASection() {
    const [ref, visible] = useReveal();
    return (
        <section ref={ref} className="py-32 px-6" style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
            <div className="max-w-3xl mx-auto text-center">
                <div className="border border-white/10 rounded-3xl p-14 relative overflow-hidden"
                    style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%)' }}
                >
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-24 h-px bg-gradient-to-r from-white/30 to-transparent" />
                    <div className="absolute top-0 left-0 h-24 w-px bg-gradient-to-b from-white/30 to-transparent" />
                    <div className="absolute bottom-0 right-0 w-24 h-px bg-gradient-to-l from-white/30 to-transparent" />
                    <div className="absolute bottom-0 right-0 h-24 w-px bg-gradient-to-t from-white/30 to-transparent" />

                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
                        Ready to flow?
                    </h2>
                    <p className="text-white/40 text-base mb-10 max-w-md mx-auto leading-relaxed">
                        Join thousands of voyagers already riding the current.
                        Your community is waiting.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="group inline-flex items-center gap-2 bg-white text-black font-semibold px-8 py-3.5 rounded-full hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] text-sm"
                        >
                            Create your account
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <Link
                            href="/login"
                            className="text-white/40 hover:text-white text-sm font-medium transition-colors"
                        >
                            Already a voyager? Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
