import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    Users, MessageSquare, Waves, Globe, ShieldCheck,
    Video, Zap, ArrowRight, ChevronDown,
    Music, Bell, Search, Hash, Heart, Menu, X
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
            className="group border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-white/30 transition-all duration-500 hover:bg-white/[0.03] relative overflow-hidden"
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(32px)',
                transition: `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s, border-color 0.3s, background 0.3s`,
            }}
        >
            <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)' }} />
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 sm:mb-5 group-hover:bg-white/10 transition-colors">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h3 className="text-white font-semibold text-base sm:text-lg mb-2 tracking-tight">{title}</h3>
            <p className="text-white/45 text-sm leading-relaxed">{description}</p>
        </div>
    );
}

// ── Stats Item ────────────────────────────────────────────────────
function StatItem({ value, label, index }) {
    const [ref, visible] = useReveal();
    return (
        <div ref={ref} className="text-center" style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: `opacity 0.6s ease ${index * 0.12}s, transform 0.6s ease ${index * 0.12}s`,
        }}>
            <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tighter mb-1 sm:mb-2">{value}</div>
            <div className="text-white/40 text-xs sm:text-sm font-medium uppercase tracking-widest">{label}</div>
        </div>
    );
}

export default function Landing() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [heroRef, heroVisible] = useReveal(0.01);
    const [currentVideo, setCurrentVideo] = useState(1);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollTo = (id) => {
        setMobileMenuOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    const features = [
        { icon: Waves, title: 'Deep Flow Feed', description: 'Your personalized content stream powered by real connections — posts, stories, and moments from the people you follow.' },
        { icon: Users, title: 'Schools', description: 'Join or create communities around shared interests. Every school is a dedicated space for conversation, events, and collaboration.' },
        { icon: Video, title: 'Group Calls', description: 'Crystal-clear HD video calls with up to dozens of participants. Screen sharing, in-call chat, and host controls built in.' },
        { icon: MessageSquare, title: 'Real-Time Messaging', description: 'Instant 1-on-1 and group conversations with media sharing, read receipts, and live typing indicators.' },
        { icon: Music, title: 'Currents Music', description: 'Live synchronized music sessions inside Schools. Everyone in the current hears the same track at the same moment.' },
        { icon: Bell, title: 'Ripples', description: 'Smart, prioritized notifications that keep you in the loop on what truly matters — without the noise.' },
        { icon: Globe, title: 'Events', description: 'Discover and organize events within your schools and across the platform. RSVP, share, and bring your community together.' },
        { icon: ShieldCheck, title: 'Privacy First', description: 'Granular controls over who sees your content, who can message you, and a silent mutual-block system that protects everyone.' },
        { icon: Search, title: 'Explore', description: 'Surface trending content, discover voyagers with shared interests, and find your next school through smart search.' },
    ];

    return (
        <>
            <Head title="Daloy — Dive into the Current" />

            <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>

                {/* ── Nav ─────────────────────────────────────────────── */}
                <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/8' : ''}`}>
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                        <span className="text-xl sm:text-2xl font-medium tracking-wide text-white cursor-pointer"
                            style={{ fontFamily: '"Pacifico", cursive' }}
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            Daloy
                        </span>

                        {/* Desktop */}
                        <div className="hidden md:flex items-center gap-6">
                            <button onClick={() => scrollTo('about')} className="flex items-center text-white/60 hover:text-white text-sm font-semibold transition-colors cursor-pointer tracking-wide pt-[1px]">About</button>
                            <button onClick={() => scrollTo('features')} className="flex items-center text-white/60 hover:text-white text-sm font-semibold transition-colors cursor-pointer tracking-wide pt-[1px]">Features</button>
                            <Link href="/login" className="flex items-center text-white/80 hover:text-white text-sm font-bold transition-colors tracking-wide pt-[1px]">Sign in</Link>
                            <Link href="/register" className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-full hover:bg-gray-200 transition-all duration-200 hover:scale-105 ml-1">Get started</Link>
                        </div>

                        {/* Mobile */}
                        <div className="flex md:hidden items-center gap-1 sm:gap-2">
                            <Link href="/login" className="text-white/70 text-sm font-medium px-3 py-1.5 rounded-full border border-white/15 hover:border-white/30 transition-colors">Sign in</Link>
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-white/60 hover:text-white transition-colors" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen} aria-controls="landing-mobile-menu">
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile dropdown */}
                    {mobileMenuOpen && (
                        <div id="landing-mobile-menu" className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/10 px-4 pb-4 space-y-1">
                            <button onClick={() => scrollTo('about')} className="block w-full text-left text-white/60 hover:text-white py-3 text-sm font-medium border-b border-white/5 transition-colors">About</button>
                            <button onClick={() => scrollTo('features')} className="block w-full text-left text-white/60 hover:text-white py-3 text-sm font-medium border-b border-white/5 transition-colors">Features</button>
                            <Link href="/register" className="block mt-3 text-center bg-white text-black text-sm font-semibold px-4 py-3 rounded-full hover:bg-white/90 transition-all">Get started free</Link>
                        </div>
                    )}
                </nav>

                {/* ── Hero ────────────────────────────────────────────── */}
                <section className="relative min-h-[100svh] flex flex-col justify-center px-5 py-24 sm:px-12 md:px-20 overflow-hidden">
                    {/* Background Video Layer */}
                    <div className="absolute inset-0 pointer-events-none z-0 bg-black">
                        <video
                            key={currentVideo}
                            src={`/video/video${currentVideo}.mp4`}
                            autoPlay
                            muted
                            playsInline
                            onEnded={() => setCurrentVideo(v => v === 1 ? 2 : 1)}
                            className="w-full h-full object-cover opacity-100 transition-opacity duration-1000 animate-[fadeIn_2s_ease-out]"
                        />
                        {/* Just a simple gradient to blend the top nav and bottom content seamlessly into the black page theme */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
                    </div>

                    <div ref={heroRef} style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.9s ease, transform 0.9s ease' }}
                        className="relative z-10 max-w-6xl mx-auto w-full text-left">

                        <div className="inline-flex items-center gap-2 border border-white/20 rounded-full px-4 py-1.5 mb-6 text-white text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-xl bg-white/5 shadow-xl transition-transform hover:scale-105 cursor-default">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/50 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white/80"></span>
                            </span>
                            Social Media, Redefined
                        </div>

                        <h1 className="text-[clamp(2.75rem,10vw,5.5rem)] sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold leading-[1.05] tracking-tight text-white mb-6 drop-shadow-2xl max-w-3xl">
                            Dive into
                            <br />
                            <span className="italic font-normal text-white/80 pb-1 inline-block">the current.</span>
                        </h1>

                        <p className="text-white/70 text-base md:text-lg max-w-xl mb-10 leading-relaxed font-medium drop-shadow-lg pr-4">
                            Daloy is an ocean-themed social platform where communities flow naturally —
                            real connections, live experiences, and meaningful conversations.
                        </p>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <Link href="/register"
                                className="group inline-flex items-center justify-center gap-2 bg-white text-black font-bold px-6 py-3.5 rounded-full hover:bg-gray-200 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] text-sm w-full sm:w-auto">
                                Start voyaging
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <button onClick={() => scrollTo('about')} className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-semibold transition-colors cursor-pointer pl-2 group">
                                Learn more
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform opacity-50 group-hover:opacity-100" />
                            </button>
                        </div>
                    </div>

                    <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 opacity-20">
                        <div className="w-px h-12 sm:h-16 bg-gradient-to-b from-white to-transparent mx-auto" />
                    </div>
                </section>

                {/* ── Stats ───────────────────────────────────────────── */}
                <section className="border-y border-white/8 py-10 sm:py-16 px-4 sm:px-6">
                    <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10">
                        <StatItem value="10K+" label="Voyagers" index={0} />
                        <StatItem value="500+" label="Schools" index={1} />
                        <StatItem value="1M+" label="Messages" index={2} />
                        <StatItem value="99.9%" label="Uptime" index={3} />
                    </div>
                </section>

                {/* ── About ───────────────────────────────────────────── */}
                <section id="about" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-10 sm:gap-16 items-center">
                            <AboutLeft />
                            <AboutRight />
                        </div>
                    </div>
                </section>

                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                </div>

                {/* ── Features ────────────────────────────────────────── */}
                <section id="features" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <FeaturesHeader />
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-10 sm:mt-16">
                            {features.map((f, i) => (
                                <FeatureCard key={f.title} {...f} index={i} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA ─────────────────────────────────────────────── */}
                <CTASection />

                {/* ── Footer ──────────────────────────────────────────── */}
                <footer className="border-t border-white/8 py-8 sm:py-12 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto flex flex-col items-center gap-5 text-center md:flex-row md:justify-between md:text-left">
                        <span className="text-xl font-medium text-white/80" style={{ fontFamily: '"Pacifico", cursive' }}>Daloy</span>
                        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-sm text-white/30">
                            <button onClick={() => scrollTo('about')} className="hover:text-white/60 transition-colors cursor-pointer">About</button>
                            <button onClick={() => scrollTo('features')} className="hover:text-white/60 transition-colors cursor-pointer">Features</button>
                            <Link href="/login" className="hover:text-white/60 transition-colors">Login</Link>
                            <Link href="/register" className="hover:text-white/60 transition-colors">Register</Link>
                        </div>
                        <p className="text-xs text-white/20">© 2026 Daloy. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}

function AboutLeft() {
    const [ref, visible] = useReveal();
    return (
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-24px)', transition: 'opacity 0.8s ease, transform 0.8s ease' }}>
            <div className="text-white/30 text-xs font-semibold uppercase tracking-[0.2em] mb-4">About Daloy</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-5 sm:mb-6 text-white">
                Not just another<br />
                <span className="text-white/40 font-light italic">social network.</span>
            </h2>
            <p className="text-white/45 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                Daloy (Filipino for <em>"flow"</em>) is built around the idea that online communities
                should feel natural — like water finding its own level. No algorithms forcing
                viral outrage. No dark patterns hijacking your attention.
            </p>
            <p className="text-white/35 leading-relaxed text-sm">
                We built Daloy for voyagers who want real connection: deep conversations,
                live music sessions, crystal-clear group calls, and communities — called
                Schools — that actually form around shared interests, not engagement metrics.
            </p>
            <div className="mt-7 sm:mt-10 flex flex-wrap gap-2 sm:gap-3">
                {['Ocean-Themed', 'Privacy-First', 'Community-Driven', 'Open'].map(tag => (
                    <span key={tag} className="border border-white/15 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs text-white/50 font-medium">{tag}</span>
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
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(24px)', transition: 'opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s' }}
            className="grid grid-cols-2 gap-3 sm:gap-4">
            {pillars.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-white/25 transition-colors group">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white/40 mb-2 sm:mb-3 group-hover:text-white/70 transition-colors" />
                    <div className="text-white font-semibold text-xs sm:text-sm mb-1">{label}</div>
                    <div className="text-white/35 text-xs leading-relaxed">{sub}</div>
                </div>
            ))}
        </div>
    );
}

function FeaturesHeader() {
    const [ref, visible] = useReveal();
    return (
        <div ref={ref} className="text-center max-w-2xl mx-auto" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
            <div className="text-white/30 text-xs font-semibold uppercase tracking-[0.2em] mb-4">Features</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-3 sm:mb-4">
                Everything in<br />
                <span className="text-white/40 font-light italic">one current.</span>
            </h2>
            <p className="text-white/40 text-sm sm:text-base leading-relaxed px-2">
                From your daily feed to live video calls — Daloy is the complete platform for modern communities.
            </p>
        </div>
    );
}

function CTASection() {
    const [ref, visible] = useReveal();
    return (
        <section ref={ref} className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.8s ease, transform 0.8s ease' }}>
            <div className="max-w-3xl mx-auto text-center">
                <div className="border border-white/10 rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-14 relative overflow-hidden"
                    style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%)' }}>
                    <div className="absolute top-0 left-0 w-16 sm:w-24 h-px bg-gradient-to-r from-white/30 to-transparent" />
                    <div className="absolute top-0 left-0 h-16 sm:h-24 w-px bg-gradient-to-b from-white/30 to-transparent" />
                    <div className="absolute bottom-0 right-0 w-16 sm:w-24 h-px bg-gradient-to-l from-white/30 to-transparent" />
                    <div className="absolute bottom-0 right-0 h-16 sm:h-24 w-px bg-gradient-to-t from-white/30 to-transparent" />

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-3 sm:mb-4">Ready to flow?</h2>
                    <p className="text-white/40 text-sm sm:text-base mb-8 sm:mb-10 max-w-md mx-auto leading-relaxed">
                        Join thousands of voyagers already riding the current. Your community is waiting.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                        <Link href="/register"
                            className="group inline-flex items-center justify-center gap-2 bg-white text-black font-semibold px-6 sm:px-8 py-3 sm:py-3.5 rounded-full hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] text-sm w-full sm:w-auto">
                            Create your account
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <Link href="/login" className="text-white/40 hover:text-white text-sm font-medium transition-colors">
                            Already a voyager? Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
