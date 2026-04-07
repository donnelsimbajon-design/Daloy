import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Search, Users, ImagePlus, Check, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/shadcn/avatar';
import { Input } from '@/Components/shadcn/input';
import { Button } from '@/Components/shadcn/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/shadcn/dialog';

export default function CreateGroupModal({ open, onClose, onCreated, currentUserId }) {
    const [step, setStep] = useState(1); // 1: select members, 2: name & avatar
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [creating, setCreating] = useState(false);
    const [searching, setSearching] = useState(false);
    const avatarInputRef = useRef(null);
    const searchTimeout = useRef(null);

    useEffect(() => {
        if (!open) {
            setStep(1);
            setSearch('');
            setResults([]);
            setSelectedUsers([]);
            setGroupName('');
            setAvatar(null);
            setAvatarPreview(null);
        }
    }, [open]);

    useEffect(() => {
        if (search.trim().length < 2) {
            setResults([]);
            return;
        }
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await axios.get('/api/search', { params: { q: search, type: 'people' } });
                const users = (res.data.people || []).filter(u => u.id !== currentUserId);
                setResults(users);
            } catch (e) {
                console.error(e);
            } finally {
                setSearching(false);
            }
        }, 300);
    }, [search]);

    const toggleUser = (user) => {
        const exists = selectedUsers.find(u => u.id === user.id);
        if (exists) {
            setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
        } else if (selectedUsers.length < 10) { // max 10 + creator = 11 total
            setSelectedUsers(prev => [...prev, user]);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return;
        setCreating(true);
        try {
            const formData = new FormData();
            formData.append('name', groupName.trim());
            selectedUsers.forEach((u, i) => {
                formData.append(`member_ids[${i}]`, u.id);
            });
            if (avatar) {
                formData.append('avatar', avatar);
            }

            const res = await axios.post('/api/conversations/group', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            onCreated?.(res.data);
            onClose();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to create group.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="bg-ocean-card border-ocean-divider backdrop-blur-xl max-w-md mx-auto max-h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-ocean-text flex items-center gap-2">
                        <Users className="w-5 h-5 text-biolum" />
                        {step === 1 ? 'Select Voyagers' : 'Name Your Group'}
                    </DialogTitle>
                </DialogHeader>

                {step === 1 ? (
                    <div className="flex flex-col flex-1 overflow-hidden gap-3">
                        {/* Selected chips */}
                        {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                                {selectedUsers.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => toggleUser(u)}
                                        className="flex items-center gap-1.5 bg-biolum/20 text-biolum text-xs px-2.5 py-1.5 rounded-full hover:bg-biolum/30 transition-colors cursor-pointer"
                                    >
                                        <span className="truncate max-w-[100px]">{u.name}</span>
                                        <X className="w-3 h-3 flex-shrink-0" />
                                    </button>
                                ))}
                                <span className="text-ocean-text-dim text-xs self-center ml-1">
                                    {selectedUsers.length}/9
                                </span>
                            </div>
                        )}

                        {/* Search */}
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ocean-text-dim" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search voyagers..."
                                className="pl-9 bg-white/5 border-white/10 text-ocean-text placeholder:text-ocean-text-dim"
                                autoFocus
                            />
                        </div>

                        {/* Results */}
                        <div className="flex-1 overflow-y-auto space-y-1 min-h-0" style={{ maxHeight: '300px' }}>
                            {searching && (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 text-biolum animate-spin" />
                                </div>
                            )}
                            {!searching && results.length === 0 && search.length >= 2 && (
                                <p className="text-center text-ocean-text-dim text-sm py-4">No voyagers found</p>
                            )}
                            {!searching && results.map(user => {
                                const isSelected = selectedUsers.some(u => u.id === user.id);
                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => toggleUser(user)}
                                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-biolum/15 ring-1 ring-biolum/30'
                                                : 'hover:bg-white/5'
                                        }`}
                                    >
                                        <Avatar className="w-10 h-10 ring-1 ring-white/10">
                                            {user.profile_picture && <AvatarImage src={user.profile_picture} />}
                                            <AvatarFallback className="bg-ocean-deep text-ocean-text text-sm">
                                                {user.name?.[0] || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-ocean-text text-sm font-medium truncate">{user.name}</p>
                                            <p className="text-ocean-text-dim text-xs truncate">@{user.username}</p>
                                        </div>
                                        {isSelected && (
                                            <div className="w-6 h-6 rounded-full bg-biolum flex items-center justify-center">
                                                <Check className="w-4 h-4 text-black" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Next button */}
                        <Button
                            onClick={() => setStep(2)}
                            disabled={selectedUsers.length === 0}
                            className="w-full bg-biolum hover:bg-biolum/80 text-black font-semibold cursor-pointer"
                        >
                            Next — {selectedUsers.length} selected
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {/* Avatar picker */}
                        <div className="flex justify-center">
                            <button
                                onClick={() => avatarInputRef.current?.click()}
                                className="relative w-24 h-24 rounded-2xl bg-white/5 border-2 border-dashed border-white/20 hover:border-biolum/50 flex items-center justify-center transition-colors cursor-pointer overflow-hidden group"
                            >
                                {avatarPreview ? (
                                    <img src={avatarPreview} className="w-full h-full object-cover" alt="Group" />
                                ) : (
                                    <ImagePlus className="w-8 h-8 text-ocean-text-dim group-hover:text-biolum transition-colors" />
                                )}
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ImagePlus className="w-6 h-6 text-white" />
                                </div>
                            </button>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                        </div>

                        {/* Group name */}
                        <div>
                            <label className="text-ocean-text-dim text-xs mb-1.5 block">Group Name</label>
                            <Input
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Enter group name..."
                                className="bg-white/5 border-white/10 text-ocean-text placeholder:text-ocean-text-dim"
                                maxLength={100}
                                autoFocus
                            />
                        </div>

                        {/* Member preview */}
                        <div>
                            <label className="text-ocean-text-dim text-xs mb-1.5 block">
                                Members ({selectedUsers.length + 1} including you)
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedUsers.map(u => (
                                    <div key={u.id} className="flex items-center gap-1.5 bg-white/5 text-ocean-text text-xs px-2 py-1 rounded-full">
                                        <Avatar className="w-4 h-4">
                                            {u.profile_picture && <AvatarImage src={u.profile_picture} />}
                                            <AvatarFallback className="bg-ocean-deep text-[8px]">{u.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        {u.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setStep(1)}
                                className="flex-1 border-white/10 text-ocean-text hover:bg-white/5 cursor-pointer"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleCreate}
                                disabled={!groupName.trim() || creating}
                                className="flex-1 bg-biolum hover:bg-biolum/80 text-black font-semibold cursor-pointer"
                            >
                                {creating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Create Group'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
