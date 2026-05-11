import React, { useState } from 'react';
import styles from './DeviceManagement.module.scss';
import { SearchIcon } from '@/components/ChartListSidebar/ChartListSidebarIcons';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/Modal/Modal';
import CustomDropdown from '@/components/CustomDropdown/CustomDropdown';

import KebabMenu from '@/components/KebabMenu/KebabMenu';

interface DeviceCardProps {
    id: string;
    name: string;
    status: string;
    location: string;
    cpu: string;
    mem: string;
    modbus: number;
    lastHeartbeat: string;
    isOnline: boolean;
    onClick: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ id, name, status, location, cpu, mem, modbus, lastHeartbeat, isOnline, onClick, onEdit, onDelete }) => {
    const kebabOptions = [
        { 
            label: 'Edit Edge', 
            onClick: () => onEdit(id),
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        },
        { 
            label: 'Delete Edge', 
            onClick: () => onDelete(id),
            danger: true,
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        }
    ];

    return (
        <div className={styles.deviceCard} onClick={() => onClick(id)}>
            <div className={styles.cardHeader}>
                <div className={styles.titleInfo}>
                    <div className={styles.statusRow}>
                        <div className={`${styles.pulseContainer} ${isOnline ? styles.online : styles.offline}`}>
                            <div className={styles.pulse}></div>
                            <div className={styles.dot}></div>
                        </div>
                        <span className={styles.tag}>{status}</span>
                    </div>
                    <h3>{name}</h3>
                    <p className={styles.location}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        {location}
                    </p>
                </div>
                <div className={styles.headerActionBtns}>
                    <KebabMenu options={kebabOptions} />
                </div>
            </div>
            
            <div className={styles.statsContainer}>
                <div className={styles.statLine}>
                    <div className={styles.statLabel}>CPU LOAD</div>
                    <div className={styles.statBarContainer}>
                        <div className={styles.statBar} style={{ width: cpu }}></div>
                    </div>
                    <div className={styles.statValue}>{cpu}</div>
                </div>
                <div className={styles.statLine}>
                    <div className={styles.statLabel}>MEMORY</div>
                    <div className={styles.statBarContainer}>
                        <div className={styles.statBar} style={{ width: mem }}></div>
                    </div>
                    <div className={styles.statValue}>{mem}</div>
                </div>
            </div>

            <div className={styles.technicalInfo}>
                <div className={styles.techItem}>
                    <span className={styles.techLabel}>SLAVES</span>
                    <span className={styles.techValue}>{modbus}</span>
                </div>
                <div className={styles.techItem}>
                    <span className={styles.techLabel}>PROTOCOL</span>
                    <span className={styles.techValue}>MODBUS/TCP</span>
                </div>
            </div>

            <div className={styles.cardFooter}>
                <div className={styles.heartbeat}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    <span>Last Heartbeat: {lastHeartbeat}</span>
                </div>
            </div>
        </div>
    );
};

import ConfirmModal from '@/components/ConfirmModal/ConfirmModal';

const DeviceManagement: React.FC = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [editingEdge, setEditingEdge] = useState<any>(null);
    const [deletingEdgeId, setDeletingEdgeId] = useState<string | null>(null);
    const [edgeForm, setEdgeForm] = useState({ name: '', location: '', env: 'PRODUCTION' });

    const devices = [
        { id: 'plant-a', name: 'Plant-A Gateway', status: 'PRODUCTION', location: 'Bangalore Factory - Floor 1', cpu: '36%', mem: '52%', modbus: 2, lastHeartbeat: 'Just now', isOnline: true },
        { id: 'plant-b', name: 'Plant-B Gateway', status: 'PRODUCTION', location: 'Pune Factory - Boiler Room', cpu: '0%', mem: '0%', modbus: 1, lastHeartbeat: '6s ago', isOnline: false },
        { id: 'lab-edge', name: 'Lab Edge Node', status: 'TESTING', location: 'R&D Lab - Rack 3', cpu: '0%', mem: '0%', modbus: 0, lastHeartbeat: '2.1m ago', isOnline: false },
        { id: 'substation', name: 'Substation North', status: 'PRODUCTION', location: 'Grid Substation 7', cpu: '26%', mem: '41%', modbus: 1, lastHeartbeat: 'Just now', isOnline: true },
    ];

    const stats = [
        { label: 'EDGE DEVICES', value: '4', icon: 'devices' },
        { label: 'ONLINE', value: '2/4', icon: 'online' },
        { label: 'MODBUS SLAVES', value: '4', icon: 'modbus' },
        { label: 'AGENTS HEALTHY', value: '2', icon: 'agents' },
    ];

    const envOptions = [
        { id: 'PRODUCTION', label: 'Production' },
        { id: 'TESTING', label: 'Testing' },
        { id: 'DEVELOPMENT', label: 'Development' },
    ];

    const filteredDevices = devices.filter(device => {
        const matchesSearch = device.name.toLowerCase().includes(search.toLowerCase()) || 
                             device.location.toLowerCase().includes(search.toLowerCase());
        
        const matchesFilter = filter === 'All' || 
                             (filter === 'Production' && device.status === 'PRODUCTION') ||
                             (filter === 'Testing' && device.status === 'TESTING') ||
                             (filter === 'Offline' && !device.isOnline);
        
        return matchesSearch && matchesFilter;
    });

    const handleDeviceClick = (id: string) => {
        navigate(`/device-management/${id}`);
    };

    const handleEditEdge = (id: string) => {
        const edge = devices.find(d => d.id === id);
        if (edge) {
            setEditingEdge(edge);
            setEdgeForm({ name: edge.name, location: edge.location, env: edge.status });
            setIsModalOpen(true);
        }
    };

    const handleDeleteEdge = (id: string) => {
        setDeletingEdgeId(id);
        setIsConfirmOpen(true);
    };

    const confirmDeleteEdge = () => {
        // Mock delete logic
        console.log('Confirmed delete edge:', deletingEdgeId);
        setDeletingEdgeId(null);
    };

    const handleAddClick = () => {
        setEditingEdge(null);
        setEdgeForm({ name: '', location: '', env: 'PRODUCTION' });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsModalOpen(false);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>Operations Overview</h1>
                    <p>Real time fleet telemetry across your edge network</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.addBtn} onClick={handleAddClick}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Edge
                    </button>
                    <button className={styles.viewAllBtn}>View all edges</button>

                </div>
            </header>

            <div className={styles.statsRow}>
                {stats.map((stat, idx) => (
                    <div key={idx} className={styles.statCard}>
                        <div className={styles.statCardLabel}>
                            {stat.icon === 'devices' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
                            {stat.icon === 'online' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>}
                            {stat.icon === 'modbus' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}
                            {stat.icon === 'agents' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
                            {stat.label}
                        </div>
                        <div className={stat.label === 'ONLINE' ? styles.statCardValueOnline : styles.statCardValue}>{stat.value}</div>
                    </div>
                ))}
            </div>

            <div className={styles.controlsRow}>
                <div className={styles.searchBox}>
                    <SearchIcon />
                    <input 
                        type="text" 
                        placeholder="Search edges, locations..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className={styles.filterTabs}>
                    {['All', 'Production', 'Testing', 'Offline'].map(t => (
                        <button 
                            key={t} 
                            className={`${styles.filterBtn} ${filter === t ? styles.active : ''}`}
                            onClick={() => setFilter(t)}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {filteredDevices.length > 0 ? (
                <div className={styles.devicesGrid}>
                    {filteredDevices.map((device, idx) => (
                        <DeviceCard key={idx} {...device} onClick={handleDeviceClick} onEdit={handleEditEdge} onDelete={handleDeleteEdge} />
                    ))}
                </div>
            ) : (
                <div style={{ padding: '80px', textAlign: 'center', background: 'var(--surface)', borderRadius: '24px', border: 'var(--border)' }}>
                    <div style={{ color: 'var(--accent)', marginBottom: '20px', opacity: 0.5 }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>No results found</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your search or filter to find what you're looking for.</p>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEdge ? 'Edit Edge Node' : 'Add New Edge Node'}>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label>Edge Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Factory Alpha Gateway" 
                            required 
                            value={edgeForm.name}
                            onChange={(e) => setEdgeForm({ ...edgeForm, name: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Location</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Building 4 - Floor 2" 
                            required 
                            value={edgeForm.location}
                            onChange={(e) => setEdgeForm({ ...edgeForm, location: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <CustomDropdown 
                            label="Environment"
                            options={envOptions}
                            value={edgeForm.env}
                            onChange={(val) => setEdgeForm({ ...edgeForm, env: val })}
                        />
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.filterBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className={styles.addBtn}>{editingEdge ? 'Save Changes' : 'Provision Edge'}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal 
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDeleteEdge}
                title="Delete Edge Node"
                message={`Are you sure you want to delete this edge node? This action cannot be undone and will disconnect all associated devices.`}
                confirmLabel="Delete Node"
            />
        </div>
    );
};

export default DeviceManagement;
