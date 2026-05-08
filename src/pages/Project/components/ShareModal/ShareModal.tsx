import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ShareModal.module.scss';
import Modal from '@/components/Modal/Modal';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectUrl: string;
    projectName: string;
}

interface SharedMember {
    id: string;
    email: string;
    role: 'view' | 'edit' | 'owner';
    name: string;
}

const MOCK_MEMBERS: SharedMember[] = [
    { id: '1', name: 'Nalvazhuthi', email: 'nal@energytwin.com', role: 'owner' },
    { id: '3', name: 'Developer', email: 'dev@google.com', role: 'view' },
];

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, projectUrl, projectName }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'view' | 'edit'>('view');
    const [copied, setCopied] = useState(false);
    const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
    const [activeRoleMenuId, setActiveRoleMenuId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number, width: number } | null>(null);
    const [members, setMembers] = useState<SharedMember[]>(MOCK_MEMBERS);
    
    const roleMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
                setIsRoleMenuOpen(false);
            }
            // Close role menu if clicking outside of any role portal
            const target = event.target as HTMLElement;
            if (!target.closest(`.${styles["role-menu"]}`) && !target.closest(`.${styles["role-trigger"]}`)) {
                setActiveRoleMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(projectUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const handleShare = () => {
        if (!email) return;
        const newMember: SharedMember = {
            id: Date.now().toString(),
            name: email.split('@')[0],
            email: email,
            role: role
        };
        setMembers([...members, newMember]);
        setEmail('');
        setIsRoleMenuOpen(false);
    };

    const handleUpdateRole = (memberId: string, newRole: 'view' | 'edit') => {
        setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
        setActiveRoleMenuId(null);
    };

    const handleRemoveMember = (memberId: string) => {
        setMembers(members.filter(m => m.id !== memberId));
        setActiveRoleMenuId(null);
    };

    const handleTransferOwnership = (memberId: string) => {
        // In mock, swap owner with target
        setMembers(members.map(m => {
            if (m.role === 'owner') return { ...m, role: 'edit' };
            if (m.id === memberId) return { ...m, role: 'owner' };
            return m;
        }));
        setActiveRoleMenuId(null);
    };

    const toggleRoleMenu = (e: React.MouseEvent, memberId: string) => {
        if (activeRoleMenuId === memberId) {
            setActiveRoleMenuId(null);
            setMenuPosition(null);
        } else {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + window.scrollY,
                left: rect.right + window.scrollX,
                width: 160 // Match min-width in CSS
            });
            setActiveRoleMenuId(memberId);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Share Project">
            <div className={styles["share-container"]}>
                <div className={styles["share-input-section"]}>
                    <div className={styles["input-group"]}>
                        <input 
                            type="email" 
                            placeholder="Add people by email..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles["email-input"]}
                        />
                        <div className={styles["custom-dropdown"]} ref={roleMenuRef}>
                            <button 
                                className={styles["dropdown-trigger"]}
                                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                            >
                                {role === 'view' ? 'Can view' : 'Can edit'}
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                            
                            {isRoleMenuOpen && (
                                <div className={styles["dropdown-menu"]}>
                                    <button 
                                        className={`${styles["menu-item"]} ${role === 'view' ? styles.active : ""}`}
                                        onClick={() => { setRole('view'); setIsRoleMenuOpen(false); }}
                                    >
                                        Can view
                                    </button>
                                    <button 
                                        className={`${styles["menu-item"]} ${role === 'edit' ? styles.active : ""}`}
                                        onClick={() => { setRole('edit'); setIsRoleMenuOpen(false); }}
                                    >
                                        Can edit
                                    </button>
                                </div>
                            )}
                        </div>
                        <button 
                            className={styles["send-btn"]}
                            onClick={handleShare}
                            disabled={!email}
                        >
                            Send
                        </button>
                    </div>
                </div>

                <div className={styles["members-section"]}>
                    <h4>Members with access</h4>
                    <div className={styles["members-list"]}>
                        {members.map((member, index) => (
                            <div key={member.id} className={styles["member-item"]}>
                                <div className={styles["member-avatar"]}>
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div className={styles["member-info"]}>
                                    <span className={styles["member-name"]}>{member.name}</span>
                                    <span className={styles["member-email"]}>{member.email}</span>
                                </div>
                                
                                {member.role === 'owner' ? (
                                    <div className={styles["member-role-static"]}>Owner</div>
                                ) : (
                                    <div className={styles["member-role-dropdown"]}>
                                        <button 
                                            className={styles["role-trigger"]}
                                            onClick={(e) => toggleRoleMenu(e, member.id)}
                                        >
                                            {member.role === 'edit' ? 'Editor' : 'Viewer'}
                                            <svg width="8" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </button>
                                        
                                        {activeRoleMenuId === member.id && menuPosition && createPortal(
                                            <div 
                                                className={`${styles["role-menu"]} ${index >= members.length - 2 && members.length > 3 ? styles.upward : ""}`}
                                                style={{
                                                    position: 'fixed',
                                                    top: index >= members.length - 2 && members.length > 3 
                                                        ? menuPosition.top - 38 - 140 // Adjusted for more items
                                                        : menuPosition.top + 4,
                                                    left: menuPosition.left - 160, 
                                                    zIndex: 10000
                                                }}
                                            >
                                                <button 
                                                    className={`${styles["role-item"]} ${member.role === 'view' ? styles.active : ""}`}
                                                    onClick={() => handleUpdateRole(member.id, 'view')}
                                                >
                                                    Viewer
                                                </button>
                                                <button 
                                                    className={`${styles["role-item"]} ${member.role === 'edit' ? styles.active : ""}`}
                                                    onClick={() => handleUpdateRole(member.id, 'edit')}
                                                >
                                                    Editor
                                                </button>
                                                
                                                <div className={styles["role-divider"]} />
                                                
                                                {member.role === 'edit' && (
                                                    <button 
                                                        className={styles["role-transfer"]}
                                                        onClick={() => handleTransferOwnership(member.id)}
                                                    >
                                                        Transfer Ownership
                                                    </button>
                                                )}
                                                
                                                <button 
                                                    className={styles["role-remove"]}
                                                    onClick={() => handleRemoveMember(member.id)}
                                                >
                                                    Remove
                                                </button>
                                            </div>,
                                            document.body
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles["divider-text"]}>
                    <span>or share link</span>
                </div>

                <div className={styles["link-section"]}>
                    <div className={styles["link-row"]}>
                        <div className={styles["link-icon"]}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                        </div>
                        <input 
                            type="text" 
                            value={projectUrl} 
                            readOnly 
                            className={styles["readonly-link"]}
                        />
                        <button 
                            className={`${styles["copy-btn"]} ${copied ? styles.copied : ""}`}
                            onClick={handleCopy}
                        >
                            {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ShareModal;
