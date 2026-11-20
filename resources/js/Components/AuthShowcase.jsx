import { Waves, MessageSquare, Users, Sparkles } from 'lucide-react';

// Purely illustrative brand panel. It never makes API calls or mutates user data.
export default function AuthShowcase({ variant = 'login' }) {
    return (
        <aside className="daloy-auth-aside" aria-label="About Daloy">
            <div>
                <div className="brand">Daloy</div>
                <div className="mt-3 auth-aside-mark"><Waves size={16} /> A calmer kind of connection</div>
            </div>
            <div className="relative">
                <div className="mb-7 flex -space-x-2" aria-hidden="true">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-ocean-border bg-ocean-text text-ocean-deep"><Users size={21} /></span>
                    <span className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-ocean-border bg-ocean-surface text-ocean-text"><MessageSquare size={21} /></span>
                    <span className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-ocean-border bg-ocean-surface text-ocean-text"><Sparkles size={21} /></span>
                </div>
                <h2>{variant === 'register' ? 'Your next chapter starts here.' : 'A place to feel connected.'}</h2>
                <p className="mt-6">{variant === 'register'
                    ? 'Meet your people, join communities and bring the moments that matter into the flow.'
                    : 'Catch up with your people, discover new communities, and share your story — all in one current.'}</p>
            </div>
            <div className="flex items-center gap-3 border-t border-white/15 pt-6 text-sm font-medium text-ocean-text-muted">
                <span className="h-2 w-2 rounded-full bg-ocean-text" />
                Stories · Communities · Conversations
            </div>
        </aside>
    );
}
