import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import Modal from '../../Components/Admin/Modal';

const reportedConversations = [
    { id: 1, participants: ['Alice Rivera', 'ToxicUser99'], reportedBy: 'Alice Rivera', reason: 'Threats and harassment', date: '2026-03-29', status: 'pending' },
    { id: 2, participants: ['Bob Chen', 'SpamBot42'], reportedBy: 'Bob Chen', reason: 'Spam / unsolicited messages', date: '2026-03-28', status: 'pending' },
    { id: 3, participants: ['Grace Lee', 'StalkerAccount'], reportedBy: 'Grace Lee', reason: 'Stalking / unwanted contact', date: '2026-03-27', status: 'resolved' },
    { id: 4, participants: ['David Kim', 'ScamUser'], reportedBy: 'David Kim', reason: 'Phishing / scam links', date: '2026-03-26', status: 'resolved' },
    { id: 5, participants: ['Iris Johnson', 'AbusiveUser'], reportedBy: 'Iris Johnson', reason: 'Verbal abuse', date: '2026-03-25', status: 'pending' },
];

const mockMessages = {
    1: [
        { id: 1, sender: 'Alice Rivera', text: 'Hey, please stop sending me those messages.', time: '10:30 AM', flagged: false },
        { id: 2, sender: 'ToxicUser99', text: 'I will find you and make you pay for blocking me.', time: '10:32 AM', flagged: true },
        { id: 3, sender: 'Alice Rivera', text: 'That is a threat. I am reporting this conversation.', time: '10:33 AM', flagged: false },
        { id: 4, sender: 'ToxicUser99', text: 'You better watch your back.', time: '10:35 AM', flagged: true },
    ],
    2: [
        { id: 1, sender: 'SpamBot42', text: '🎉 Congratulations! You won $10,000! Click here: bit.ly/scam', time: '9:15 AM', flagged: true },
        { id: 2, sender: 'Bob Chen', text: 'This is obviously spam.', time: '9:20 AM', flagged: false },
        { id: 3, sender: 'SpamBot42', text: '💰 Double your money NOW! Visit totallylegit.com', time: '9:22 AM', flagged: true },
    ],
    5: [
        { id: 1, sender: 'AbusiveUser', text: 'You are worthless and nobody likes you.', time: '3:40 PM', flagged: true },
        { id: 2, sender: 'Iris Johnson', text: 'Please stop this is hurtful', time: '3:42 PM', flagged: false },
        { id: 3, sender: 'AbusiveUser', text: 'I hope terrible things happen to you.', time: '3:45 PM', flagged: true },
    ],
};

export default function Messages() {
    const [selectedConv, setSelectedConv] = useState(null);
    const [modalType, setModalType] = useState(null);

    const messages = selectedConv ? (mockMessages[selectedConv.id] || []) : [];

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '16px', minHeight: '600px' }}>
                {/* Conversation List */}
                <div className="adm-card">
                    <div className="adm-card-header">
                        <h3>Reported Conversations</h3>
                        <span style={{ fontSize: '12px', color: '#888' }}>{reportedConversations.filter(c => c.status === 'pending').length} pending</span>
                    </div>
                    <div className="adm-conv-list">
                        {reportedConversations.map(conv => (
                            <div
                                key={conv.id}
                                className={`adm-conv-item ${selectedConv?.id === conv.id ? 'active' : ''}`}
                                onClick={() => setSelectedConv(conv)}
                            >
                                <div className="adm-conv-item-avatar">
                                    {conv.participants[1].charAt(0)}
                                </div>
                                <div className="adm-conv-item-info">
                                    <h4>{conv.participants.join(' & ')}</h4>
                                    <p>{conv.reason}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <span className="adm-conv-item-time">{conv.date}</span>
                                    <span className={`adm-badge ${conv.status === 'pending' ? 'adm-badge-pending' : 'adm-badge-resolved'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                                        {conv.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Message Thread */}
                <div className="adm-card">
                    {selectedConv ? (
                        <>
                            <div className="adm-card-header">
                                <div>
                                    <h3>{selectedConv.participants.join(' & ')}</h3>
                                    <div className="adm-card-header-sub">
                                        Reported by {selectedConv.reportedBy} — {selectedConv.reason}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => setModalType('warn')}>⚠ Warn User</button>
                                    <button className="adm-btn adm-btn-outline adm-btn-sm" style={{ color: '#dc2626', borderColor: '#dc2626' }} onClick={() => setModalType('restrict')}>🚫 Restrict</button>
                                </div>
                            </div>
                            <div className="adm-message-thread" style={{ maxHeight: '440px', overflowY: 'auto' }}>
                                {messages.map(msg => (
                                    <div key={msg.id}>
                                        <div className="adm-message-meta" style={{ textAlign: msg.sender === selectedConv.participants[0] ? 'right' : 'left' }}>
                                            {msg.sender} · {msg.time}
                                        </div>
                                        <div className={`adm-message-bubble ${msg.sender === selectedConv.participants[0] ? 'sent' : 'received'} ${msg.flagged ? 'adm-message-flagged' : ''}`}>
                                            {msg.flagged && <span style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', display: 'block', marginBottom: '4px' }}>⚑ FLAGGED</span>}
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e5e5', fontSize: '12px', color: '#888', textAlign: 'center' }}>
                                Only reported conversations are visible. User privacy is maintained.
                            </div>
                        </>
                    ) : (
                        <div className="adm-empty">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            <h4>Select a Conversation</h4>
                            <p>Choose a reported conversation from the list to review flagged messages.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Modals */}
            <Modal
                isOpen={['warn', 'restrict'].includes(modalType)}
                onClose={() => setModalType(null)}
                title={modalType === 'warn' ? 'Warn User' : 'Restrict Messaging'}
                size="sm"
                footer={
                    <>
                        <button className="adm-btn adm-btn-outline" onClick={() => setModalType(null)}>Cancel</button>
                        <button className="adm-btn adm-btn-primary" onClick={() => setModalType(null)}>Confirm</button>
                    </>
                }
            >
                <div>
                    <p style={{ marginBottom: '12px', fontSize: '13px', lineHeight: 1.6 }}>
                        {modalType === 'warn' && `Send a warning to the reported user about their messaging behavior?`}
                        {modalType === 'restrict' && `Restrict this user's ability to send messages? They can still receive but cannot initiate new conversations.`}
                    </p>
                    <div className="adm-form-group">
                        <label className="adm-form-label">Note</label>
                        <textarea className="adm-form-textarea" placeholder="Document reason..." />
                    </div>
                </div>
            </Modal>
        </>
    );
}

Messages.layout = (page) => <AdminLayout currentPage="Admin/Messages">{page}</AdminLayout>;
