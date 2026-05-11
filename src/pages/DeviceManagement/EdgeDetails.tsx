import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './DeviceManagement.module.scss';
import Modal from '@/components/Modal/Modal';
import CustomDropdown from '@/components/CustomDropdown/CustomDropdown';
import KebabMenu from '@/components/KebabMenu/KebabMenu';
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal';

interface Device {
    id: string;
    name: string;
    type: string;
    status: 'online' | 'offline';
    lastSeen: string;
}

const EdgeDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
    const [deviceForm, setDeviceForm] = useState({ name: '', type: 'SENSOR', protocol: 'MODBUS' });

    const [devices, setDevices] = useState<Device[]>([
        { id: 'dev-1', name: 'Temperature Sensor 01', type: 'SENSOR', status: 'online', lastSeen: 'Just now' },
        { id: 'dev-2', name: 'Power Meter Main', type: 'METER', status: 'online', lastSeen: 'Just now' },
        { id: 'dev-3', name: 'Humidity Controller', type: 'ACTUATOR', status: 'offline', lastSeen: '2h ago' },
    ]);

    const typeOptions = [
        { id: 'SENSOR', label: 'Sensor' },
        { id: 'METER', label: 'Meter' },
        { id: 'ACTUATOR', label: 'Actuator' },
        { id: 'GATEWAY', label: 'Gateway' },
    ];

    const protocolOptions = [
        { id: 'MODBUS', label: 'Modbus TCP' },
        { id: 'MQTT', label: 'MQTT' },
        { id: 'HTTP', label: 'HTTP/REST' },
    ];

    const [search, setSearch] = useState('');

    const filteredDevices = devices.filter(device => 
        device.name.toLowerCase().includes(search.toLowerCase()) || 
        device.type.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddClick = () => {
        setEditingDevice(null);
        setDeviceForm({ name: '', type: 'SENSOR', protocol: 'MODBUS' });
        setIsModalOpen(true);
    };

    const handleEditDevice = (device: Device) => {
        setEditingDevice(device);
        setDeviceForm({ name: device.name, type: device.type, protocol: 'MODBUS' });
        setIsModalOpen(true);
    };

    const handleDeleteDevice = (deviceId: string) => {
        setDeletingDeviceId(deviceId);
        setIsConfirmOpen(true);
    };

    const confirmDeleteDevice = () => {
        // Mock delete logic
        console.log('Confirmed delete device:', deletingDeviceId);
        setDeletingDeviceId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsModalOpen(false);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <button 
                        onClick={() => navigate(-1)} 
                        className={styles.filterBtn}
                        style={{ padding: '0.5rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '10px' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                        Back
                    </button>
                    <h1>{id?.replace('-', ' ').toUpperCase()}</h1>
                    <p>Edge Node Deployment Detail</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.addBtn} onClick={handleAddClick}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Device
                    </button>
                </div>
            </header>

            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <div className={styles.statCardLabel}>IP ADDRESS</div>
                    <div className={styles.statCardValue}>192.168.1.45</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statCardLabel}>UPTIME</div>
                    <div className={styles.statCardValue}>14d 6h 22m</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statCardLabel}>CPU TEMP</div>
                    <div className={styles.statCardValue}>42°C</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statCardLabel}>DISK USAGE</div>
                    <div className={styles.statCardValue}>14%</div>
                </div>
            </div>

            <div style={{ background: 'var(--surface)', border: 'var(--border)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(20px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Connected Assets
                        <span className={styles.tag}>{filteredDevices.length} Total</span>
                    </h2>
                    <div className={styles.searchBox} style={{ width: '300px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input 
                            type="text" 
                            placeholder="Filter assets..." 
                            style={{ background: 'transparent', border: 'none', color: '#fff', padding: '8px', fontSize: '0.9rem', outline: 'none', width: '100%' }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className={styles.devicesTableContainer}>
                    <table className={styles.devicesTable}>
                        <thead>
                            <tr>
                                <th>Asset Name</th>
                                <th>Category</th>
                                <th>Operational Status</th>
                                <th>Last Sync</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDevices.map(device => (
                                <tr key={device.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{device.name}</td>
                                    <td>
                                        <span className={styles.tag} style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>{device.type}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: device.status === 'online' ? 'var(--success)' : 'var(--danger)' }}>
                                            <div className={styles.pulseContainer} style={{ color: 'inherit', width: '10px', height: '10px' }}>
                                                <div className={styles.pulse} style={{ animation: device.status === 'online' ? undefined : 'none', opacity: device.status === 'online' ? 0.4 : 0 }}></div>
                                                <div className={styles.dot} style={{ width: '6px', height: '6px' }}></div>
                                            </div>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.02em' }}>{device.status.toUpperCase()}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', opacity: 0.7 }}>{device.lastSeen}</td>
                                    <td>
                                        <KebabMenu options={[
                                            { 
                                                label: 'Edit Device', 
                                                onClick: () => handleEditDevice(device),
                                                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                            },
                                            { 
                                                label: 'Delete Device', 
                                                onClick: () => handleDeleteDevice(device.id),
                                                danger: true,
                                                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                            }
                                        ]} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredDevices.length === 0 && (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No assets match your search criteria.
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDevice ? 'Edit Asset Configuration' : 'Register New Asset'}>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label>Asset Identity</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Temperature Sensor 04" 
                            required 
                            value={deviceForm.name}
                            onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <CustomDropdown 
                            label="Asset Category"
                            options={typeOptions}
                            value={deviceForm.type}
                            onChange={(val) => setDeviceForm({ ...deviceForm, type: val })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <CustomDropdown 
                            label="Communication Protocol"
                            options={protocolOptions}
                            value={deviceForm.protocol}
                            onChange={(val) => setDeviceForm({ ...deviceForm, protocol: val })}
                        />
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.filterBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className={styles.addBtn}>{editingDevice ? 'Commit Changes' : 'Register Asset'}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal 
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDeleteDevice}
                title="Decommission Asset"
                message={`Are you sure you want to decommission this asset? This will stop all telemetry data collection and remove it from your digital twin mapping.`}
                confirmLabel="Confirm Decommission"
            />
        </div>
    );
};

export default EdgeDetails;
