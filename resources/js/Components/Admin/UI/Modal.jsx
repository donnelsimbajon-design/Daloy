import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, size = '', children, footer }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClass = size === 'lg' ? 'adm-modal-lg' : size === 'sm' ? 'adm-modal-sm' : '';

    return (
        <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={`adm-modal ${sizeClass}`}>
                <div className="adm-modal-header">
                    <h3>{title}</h3>
                    <button className="adm-modal-close" onClick={onClose} aria-label="Close modal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div className="adm-modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="adm-modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
