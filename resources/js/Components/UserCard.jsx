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

    return (
        <div className="flex items-center p-4 bg-ocean-card rounded-xl border border-ocean-border hover:border-biolum/40 transition-all group">
            {/* Clickable avatar → profile */}
            <Link href={`/users/${user.id}`} className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-biolum/30 flex items-center justify-center text-ocean-text font-bold ring-2 ring-ocean-border group-hover:ring-biolum/40 transition-all overflow-hidden">
                    {user.profile_picture ? (
                        <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        avatarText
                    )}
                </div>
                {user.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-ocean-card" />
                )}
            </Link>

            {/* Info — clickable → profile */}
            <Link href={`/users/${user.id}`} className="ml-3 flex-1 min-w-0">
                <h3 className="font-semibold text-ocean-text truncate group-hover:text-biolum transition-colors">
                    {user.name}
                </h3>
                <p className="text-xs text-ocean-text-dim truncate">@{user.username || 'user'}</p>
                {user.bio && (
                    <p className="text-xs text-ocean-text-muted truncate mt-0.5">{user.bio}</p>
                )}
            </Link>

            {/* Action buttons */}
            {showActions && !isSelf && (
                <div className="flex flex-col gap-1.5 sm:flex-row ml-2 shrink-0">
                    <FriendRequestButton user={user} onUpdate={onUpdate} />
                    <FollowButton user={user} onUpdate={onUpdate} />
                    <Link
                        href={`/conversations?user_id=${user.id}`}
                        className="p-1 px-2.5 text-xs border border-ocean-border rounded-lg text-ocean-text-dim hover:text-ocean-text hover:border-biolum/40 transition-colors flex items-center gap-1"
                        title="Message"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                        </svg>
                        Msg
                    </Link>
                </div>
            )}
            {isSelf && (
                <Link
                    href={`/users/${user.id}`}
                    className="ml-2 text-xs text-biolum border border-biolum/30 rounded-lg px-2 py-1 hover:bg-biolum/10 transition-colors"
                >
                    View
                </Link>
            )}
        </div>
    );
}
