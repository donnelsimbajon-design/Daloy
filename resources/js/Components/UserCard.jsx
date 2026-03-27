import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import FriendRequestButton from '@/Components/FriendRequestButton';
import FollowButton from '@/Components/FollowButton';

export default function UserCard({ user, onUpdate, showActions = true }) {
    const { auth } = usePage().props;
    const isSelf = user.id === auth.user.id;

    const avatarText = user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    // Just mocking a background gradient based on ID for visual variety matching the design
    const gradHue = (user.id * 137) % 360;
    const gradientStyle = user.background_picture 
        ? { backgroundImage: `url(${user.background_picture})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: `linear-gradient(135deg, hsl(${gradHue}, 60%, 80%) 0%, hsl(${(gradHue + 40) % 360}, 50%, 95%) 100%)` };

    return (
        <div className="flex flex-col bg-ocean-card rounded-[24px] border border-ocean-border hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:border-ocean-divider transition-all duration-300 overflow-hidden group">
            {/* Top Cover / Background Image */}
            <div 
                className="h-32 w-full relative"
                style={gradientStyle}
            >
                {/* Overlay gradient to smooth into dark theme if we had images */}
                <div className="absolute inset-0 bg-gradient-to-t from-ocean-card via-ocean-card/20 to-transparent"></div>
            </div>

            <div className="px-6 pb-6 pt-0 relative flex flex-col flex-1">
                {/* Profile Picture Overlapping */}
                <div className="relative -mt-10 mb-3">
                    <Link href={`/users/${user.id}`} className="block w-20 h-20 rounded-[20px] bg-ocean-surface p-1 shadow-lg ring-1 ring-ocean-border/50 group-hover:scale-105 transition-transform duration-300 relative z-10 z-index">
                        <div className="w-full h-full rounded-[16px] overflow-hidden bg-biolum/20 flex items-center justify-center text-ocean-text font-bold text-xl">
                            {user.profile_picture ? (
                                <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                avatarText
                            )}
                        </div>
                        {user.is_online && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full ring-4 ring-ocean-card" />
                        )}
                    </Link>
                </div>

                {/* User Info */}
                <Link href={`/users/${user.id}`} className="mb-4">
                    <h3 className="text-xl font-bold text-ocean-text tracking-tight hover:text-biolum transition-colors">
                        {user.name}
                    </h3>
                    <p className="text-sm text-ocean-text-dim mt-0.5">
                        {user.bio ? user.bio.substring(0, 40) : (user.username ? `@${user.username}` : 'Voyager')}
                        {user.location ? ` • ${user.location}` : ''}
                    </p>
                </Link>

                {/* Tags (Mocked aesthetics if no real tags exist) */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 bg-ocean-surface border border-ocean-divider-subtle rounded-md text-[10px] font-bold text-ocean-text-dim tracking-widest uppercase">
                        {user.id % 2 === 0 ? 'DESIGN' : 'TECH'}
                    </span>
                    <span className="px-3 py-1 bg-ocean-surface border border-ocean-divider-subtle rounded-md text-[10px] font-bold text-ocean-text-dim tracking-widest uppercase">
                        {user.id % 3 === 0 ? 'EDITORIAL' : 'CULTURE'}
                    </span>
                </div>

                {/* Action buttons pinned to bottom */}
                <div className="mt-auto">
                    {showActions && !isSelf ? (
                        <FriendRequestButton 
                            user={user} 
                            onUpdate={onUpdate} 
                            className="w-full justify-center py-3 bg-biolum hover:bg-biolum-bright text-white font-bold rounded-xl shadow-[0_4px_14px_rgba(25,25,112,0.3)] transition-all flex items-center gap-2 tracking-wide uppercase text-xs"
                            customText={true}
                        />
                    ) : isSelf ? (
                        <Link
                            href={`/users/${user.id}`}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-ocean-surface border border-ocean-divider-subtle hover:bg-ocean-hover text-ocean-text font-bold rounded-xl transition-all uppercase text-xs tracking-wide"
                        >
                            View Profile
                        </Link>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
