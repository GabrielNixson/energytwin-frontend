import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './DeviceManagement.module.scss';
import Modal from '@/components/Modal/Modal';
import CustomDropdown from '@/components/CustomDropdown/CustomDropdown';
import KebabMenu from '@/components/KebabMenu/KebabMenu';
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal';

interface Register {
    address: number;
    dataType: 'int16' | 'uint16' | 'int32' | 'float32' | 'swapped float' | 'bit field';
    name: string;
}

interface ModbusDeviceConfig {
    name: string;
    protocol: 'tcp' | 'rtu';
    serial: {
        path: string;
        baudRate: number;
        parity: 'none' | 'mark' | 'even' | 'odd' | 'space';
        dataBits: 8 | 7 | 6 | 5;
        stopBits: 1 | 1.5 | 2;
    };
    tcp: {
        ip: string;
        port: number;
    };
    slaveId: number;
    pollingInterval: number;
    registers: Register[];
}

interface Device {
    id: string;
    name: string;
    type: string;
    status: 'online' | 'offline';
    lastSeen: string;
    config?: ModbusDeviceConfig;
}

interface DeviceFormState {
    name: string;
    protocol: 'tcp' | 'rtu';
    template: string;
    serial: {
        path: string;
        baudRate: number;
        parity: 'none' | 'mark' | 'even' | 'odd' | 'space';
        dataBits: 8 | 7 | 6 | 5;
        stopBits: 1 | 1.5 | 2;
    };
    tcp: {
        ip: string;
        port: number;
    };
    slaveId: number;
    pollingInterval: number;
    registers: Register[];
}

const initialFormState: DeviceFormState = {
    name: '',
    protocol: 'tcp',
    template: 'custom',
    serial: {
        path: '/dev/ttyUSB0',
        baudRate: 9600,
        parity: 'none',
        dataBits: 8,
        stopBits: 1,
    },
    tcp: {
        ip: '',
        port: 502,
    },
    slaveId: 1,
    pollingInterval: 5000,
    registers: [
        { address: 40001, dataType: 'int16', name: '' }
    ]
};

const DEVICE_TEMPLATES = [
    {
        id: 'custom',
        label: 'Custom Device (Configure manually)',
        registers: [
            { address: 40001, dataType: 'int16' as const, name: '' }
        ]
    },
    {
        id: 'temp-sensor',
        label: 'Schneider Temperature Sensor (Preset)',
        registers: [
            { address: 40001, dataType: 'int16' as const, name: 'temperature' },
            { address: 40002, dataType: 'uint16' as const, name: 'humidity' }
        ]
    },
    {
        id: 'power-meter',
        label: 'Power Meter Main (Preset)',
        registers: [
            { address: 30001, dataType: 'float32' as const, name: 'active_power' },
            { address: 30003, dataType: 'float32' as const, name: 'voltage' }
        ]
    },
    {
        id: 'boiler-controller',
        label: 'Boiler Controller (Preset)',
        registers: [
            { address: 40010, dataType: 'bit field' as const, name: 'relay_status' }
        ]
    }
];

const EdgeDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
    
    const [deviceForm, setDeviceForm] = useState<DeviceFormState>({ ...initialFormState });
    const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [isTested, setIsTested] = useState(false);
    const [testedTemplates, setTestedTemplates] = useState<Record<string, boolean>>({});

    const [devices, setDevices] = useState<Device[]>([
        { 
            id: 'dev-1', 
            name: 'Temperature Sensor 01', 
            type: 'SENSOR', 
            status: 'online', 
            lastSeen: 'Just now',
            config: {
                name: 'Temperature Sensor 01',
                protocol: 'tcp',
                serial: { path: '/dev/ttyUSB0', baudRate: 9600, parity: 'none', dataBits: 8, stopBits: 1 },
                tcp: { ip: '192.168.1.101', port: 502 },
                slaveId: 1,
                pollingInterval: 5000,
                registers: [
                    { address: 40001, dataType: 'int16', name: 'temperature' },
                    { address: 40002, dataType: 'uint16', name: 'humidity' }
                ]
            }
        },
        { 
            id: 'dev-2', 
            name: 'Power Meter Main', 
            type: 'METER', 
            status: 'online', 
            lastSeen: 'Just now',
            config: {
                name: 'Power Meter Main',
                protocol: 'rtu',
                serial: { path: 'COM3', baudRate: 19200, parity: 'even', dataBits: 8, stopBits: 1 },
                tcp: { ip: '', port: 502 },
                slaveId: 2,
                pollingInterval: 2000,
                registers: [
                    { address: 30001, dataType: 'float32', name: 'active_power' },
                    { address: 30003, dataType: 'float32', name: 'voltage' }
                ]
            }
        },
        { 
            id: 'dev-3', 
            name: 'Humidity Controller', 
            type: 'ACTUATOR', 
            status: 'offline', 
            lastSeen: '2h ago',
            config: {
                name: 'Humidity Controller',
                protocol: 'tcp',
                serial: { path: '/dev/ttyUSB0', baudRate: 9600, parity: 'none', dataBits: 8, stopBits: 1 },
                tcp: { ip: '192.168.1.103', port: 502 },
                slaveId: 3,
                pollingInterval: 10000,
                registers: [
                    { address: 40010, dataType: 'bit field', name: 'relay_status' }
                ]
            }
        },
    ]);

    const protocolOptions = [
        { id: 'tcp', label: 'Modbus TCP' },
        { id: 'rtu', label: 'Modbus RTU' },
    ];

    const templateOptions = [
        { id: 'custom', label: 'Custom Device (Configure manually)' },
        { id: 'temp-sensor', label: 'Schneider Temperature Sensor (Preset)' },
        { id: 'power-meter', label: 'Power Meter Main (Preset)' },
        { id: 'boiler-controller', label: 'Boiler Controller (Preset)' },
    ];

    const serialPathOptions = [
        { id: '/dev/ttyUSB0', label: '/dev/ttyUSB0 (Standard USB Serial)' },
        { id: '/dev/ttyUSB1', label: '/dev/ttyUSB1' },
        { id: '/dev/ttyS0', label: '/dev/ttyS0 (Built-in Serial)' },
        { id: 'COM1', label: 'COM1 (Windows)' },
        { id: 'COM2', label: 'COM2' },
        { id: 'COM3', label: 'COM3' },
        { id: 'COM4', label: 'COM4' },
        { id: 'custom', label: 'Enter custom path...' }
    ];

    const baudRateOptions = [
        { id: '75', label: '75' },
        { id: '110', label: '110' },
        { id: '300', label: '300' },
        { id: '1200', label: '1200' },
        { id: '2400', label: '2400' },
        { id: '4800', label: '4800' },
        { id: '9600', label: '9600' },
        { id: '19200', label: '19200' },
        { id: '38400', label: '38400' },
        { id: '57600', label: '57600' },
        { id: '115200', label: '115200' },
    ];

    const parityOptions = [
        { id: 'none', label: 'None (Default)' },
        { id: 'mark', label: 'Mark' },
        { id: 'even', label: 'Even' },
        { id: 'odd', label: 'Odd' },
        { id: 'space', label: 'Space' },
    ];

    const dataBitsOptions = [
        { id: '8', label: '8 Bits (Default)' },
        { id: '7', label: '7 Bits' },
        { id: '6', label: '6 Bits' },
        { id: '5', label: '5 Bits' },
    ];

    const stopBitsOptions = [
        { id: '1', label: '1 Stop Bit (Default)' },
        { id: '1.5', label: '1.5 Stop Bits' },
        { id: '2', label: '2 Stop Bits' },
    ];

    const dataTypeOptions = [
        { id: 'int16', label: 'Int16 (16-bit signed)' },
        { id: 'uint16', label: 'Uint16 (16-bit unsigned)' },
        { id: 'int32', label: 'Int32 (32-bit signed)' },
        { id: 'float32', label: 'Float32 (32-bit float)' },
        { id: 'swapped float', label: 'Swapped Float (32-bit float swapped)' },
        { id: 'bit field', label: 'Bit Field' },
    ];

    const [search, setSearch] = useState('');

    const filteredDevices = devices.filter(device => 
        device.name.toLowerCase().includes(search.toLowerCase()) || 
        (device.config?.protocol || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleConnectionChange = () => {
        setIsTested(false);
        setTestedTemplates({});
    };

    const handleAddClick = () => {
        setEditingDevice(null);
        setIsTested(false);
        setIsTesting(false);
        setTestedTemplates({});
        setDeviceForm({
            name: '',
            protocol: 'tcp',
            template: 'custom',
            serial: { ...initialFormState.serial },
            tcp: { ...initialFormState.tcp },
            slaveId: 1,
            pollingInterval: 5000,
            registers: [{ address: 40001, dataType: 'int16', name: '' }]
        });
        setIsModalOpen(true);
    };

    const handleEditDevice = (device: Device) => {
        setEditingDevice(device);
        setIsTested(true);
        setIsTesting(false);
        const activeTemplate = device.config ? (device.config as any).template || 'custom' : 'custom';
        setTestedTemplates({ [activeTemplate]: true });
        if (device.config) {
            setDeviceForm({
                name: device.config.name,
                protocol: device.config.protocol,
                template: activeTemplate,
                serial: { ...device.config.serial },
                tcp: { ...device.config.tcp },
                slaveId: device.config.slaveId,
                pollingInterval: device.config.pollingInterval,
                registers: device.config.registers.map(r => ({ ...r }))
            });
        } else {
            setDeviceForm({
                ...initialFormState,
                name: device.name,
                protocol: device.type === 'METER' ? 'rtu' : 'tcp'
            });
        }
        setIsModalOpen(true);
    };

    const handleTestConnection = () => {
        if (!deviceForm.name) {
            alert("Please enter a device name first.");
            return;
        }
        if (deviceForm.protocol === 'tcp' && !deviceForm.tcp.ip) {
            alert("Please enter a Modbus TCP IP address first.");
            return;
        }
        setIsTesting(true);
        setTimeout(() => {
            setIsTesting(false);
            setIsTested(true);
            setTestedTemplates(prev => ({ ...prev, [deviceForm.template]: true }));
        }, 1500);
    };

    const handleDeleteDevice = (deviceId: string) => {
        setDeletingDeviceId(deviceId);
        setIsConfirmOpen(true);
    };

    const confirmDeleteDevice = () => {
        setDevices(devices.filter(d => d.id !== deletingDeviceId));
        console.log('Decommissioned device:', deletingDeviceId);
        setDeletingDeviceId(null);
        setIsConfirmOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formConfig: ModbusDeviceConfig & { template?: string } = {
            name: deviceForm.name,
            protocol: deviceForm.protocol,
            template: deviceForm.template,
            serial: { ...deviceForm.serial },
            tcp: { ...deviceForm.tcp },
            slaveId: Number(deviceForm.slaveId),
            pollingInterval: Number(deviceForm.pollingInterval),
            registers: deviceForm.registers.map(r => ({
                address: Number(r.address),
                dataType: r.dataType,
                name: r.name
            }))
        };

        if (editingDevice) {
            setDevices(devices.map(d => d.id === editingDevice.id ? {
                ...d,
                name: deviceForm.name,
                type: deviceForm.protocol === 'tcp' ? 'TCP_DEVICE' : 'RTU_DEVICE',
                config: formConfig
            } : d));
        } else {
            const newDevice: Device = {
                id: `dev-${Date.now()}`,
                name: deviceForm.name,
                type: deviceForm.protocol === 'tcp' ? 'TCP_DEVICE' : 'RTU_DEVICE',
                status: 'online',
                lastSeen: 'Just now',
                config: formConfig
            };
            setDevices([...devices, newDevice]);
        }

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
                                <th style={{ width: '40px' }}></th>
                                <th>Asset Name</th>
                                <th>Protocol & Connection</th>
                                <th>Telemetry Registers</th>
                                <th>Operational Status</th>
                                <th>Last Sync</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDevices.map(device => {
                                const isTcp = device.config?.protocol === 'tcp';
                                const connectionStr = device.config 
                                    ? isTcp 
                                        ? `TCP: ${device.config.tcp.ip || '0.0.0.0'}:${device.config.tcp.port || 502} (Slave ${device.config.slaveId})`
                                        : `RTU: ${device.config.serial.path || 'COM1'} (${device.config.serial.baudRate} bps, ${device.config.serial.dataBits || 8}${device.config.serial.parity === 'none' ? 'N' : device.config.serial.parity?.charAt(0).toUpperCase() || 'N'}${device.config.serial.stopBits || 1}, Slave ${device.config.slaveId})`
                                    : device.type;

                                const registersSummary = device.config?.registers 
                                    ? `${device.config.registers.length} mapped (${device.config.registers.map(r => r.name).filter(Boolean).join(', ') || 'no names'})`
                                    : 'None';

                                return (
                                    <React.Fragment key={device.id}>
                                        <tr 
                                            onClick={() => setExpandedDeviceId(expandedDeviceId === device.id ? null : device.id)}
                                            style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                        >
                                            <td style={{ width: '40px', textAlign: 'center' }}>
                                                <div style={{ 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    transition: 'transform 0.2s', 
                                                    transform: expandedDeviceId === device.id ? 'rotate(90deg)' : 'none',
                                                    color: 'var(--accent)'
                                                }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="9 18 15 12 9 6" />
                                                    </svg>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{device.name}</td>
                                            <td>
                                                <span className={styles.tag} style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                    {connectionStr}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {registersSummary}
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
                                            <td onClick={(e) => e.stopPropagation()}>
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
                                        {expandedDeviceId === device.id && (
                                            <tr style={{ background: 'rgba(255, 255, 255, 0.015)' }}>
                                                <td colSpan={7} style={{ padding: '16px 24px 24px 24px', borderTop: 'none' }}>
                                                    <div style={{ 
                                                        background: 'rgba(6, 9, 18, 0.6)', 
                                                        border: '1px solid rgba(255,255,255,0.06)', 
                                                        borderRadius: '12px', 
                                                        padding: '20px', 
                                                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4)'
                                                    }}>
                                                        <h4 style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 0, marginBottom: '16px' }}>
                                                            Connection Specifications
                                                        </h4>
                                                        {device.config ? (
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Protocol</span>
                                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{device.config.protocol.toUpperCase()}</span>
                                                                </div>
                                                                
                                                                {isTcp && (
                                                                    <>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>IP Address</span>
                                                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{device.config.tcp.ip || '—'}</span>
                                                                        </div>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Port</span>
                                                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{device.config.tcp.port || 502}</span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                                {!isTcp && (
                                                                    <>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Serial Path</span>
                                                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{device.config.serial.path || '—'}</span>
                                                                        </div>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Baud Rate</span>
                                                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{device.config.serial.baudRate} bps</span>
                                                                        </div>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Parity</span>
                                                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, textTransform: 'capitalize' }}>{device.config.serial.parity}</span>
                                                                        </div>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Data Bits</span>
                                                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{device.config.serial.dataBits} bits</span>
                                                                        </div>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Stop Bits</span>
                                                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{device.config.serial.stopBits} bit(s)</span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Modbus Slave ID</span>
                                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{device.config.slaveId}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Polling Interval</span>
                                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{device.config.pollingInterval} ms</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>No connection parameters defined.</div>
                                                        )}
                                                        
                                                        <h4 style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '20px', marginBottom: '12px' }}>
                                                            Registers Mapping Definition ({device.config?.registers.length || 0})
                                                        </h4>
                                                        {device.config?.registers && device.config.registers.length > 0 ? (
                                                            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                                                                    <thead>
                                                                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                            <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 700 }}>Starting Address</th>
                                                                            <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 700 }}>Data Type</th>
                                                                            <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 700 }}>Tag / Field Name (InfluxDB)</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {device.config.registers.map((reg, rIdx) => (
                                                                            <tr key={rIdx} style={{ borderBottom: rIdx === device.config!.registers.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)' }}>
                                                                                <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 600 }}>{reg.address}</td>
                                                                                <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}><span style={{ background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{reg.dataType}</span></td>
                                                                                <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 600 }}>{reg.name}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : (
                                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No registers mapped.</div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredDevices.length === 0 && (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No assets match your search criteria.
                        </div>
                    )}
                </div>
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingDevice ? 'Edit Modbus Device Configuration' : 'Register New Modbus Device'}
                style={{ maxWidth: '750px', width: '90%' }}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', minHeight: 0, marginBottom: '12px' }}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>Device Name (human readable)</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Temperature Sensor 01" 
                                    required 
                                    value={deviceForm.name}
                                    onChange={(e) => {
                                        handleConnectionChange();
                                        setDeviceForm({ ...deviceForm, name: e.target.value });
                                    }}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <CustomDropdown 
                                    label="Modbus Protocol Type"
                                    options={protocolOptions}
                                    value={deviceForm.protocol}
                                    onChange={(val) => {
                                        handleConnectionChange();
                                        setDeviceForm({ ...deviceForm, protocol: val as 'tcp' | 'rtu' });
                                    }}
                                />
                            </div>
                        </div>

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>Modbus Slave ID</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="247" 
                                    required 
                                    value={deviceForm.slaveId}
                                    onChange={(e) => {
                                        handleConnectionChange();
                                        setDeviceForm({ ...deviceForm, slaveId: parseInt(e.target.value) || 1 });
                                    }}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Polling Interval (ms)</label>
                                <input 
                                    type="number" 
                                    min="100" 
                                    step="100" 
                                    required 
                                    value={deviceForm.pollingInterval}
                                    onChange={(e) => {
                                        handleConnectionChange();
                                        setDeviceForm({ ...deviceForm, pollingInterval: parseInt(e.target.value) || 5000 });
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
                            {/* Modbus TCP Settings */}
                            {deviceForm.protocol === 'tcp' && (
                                <div className={`${styles.sectionBox} ${styles.activeSection}`} style={{ marginBottom: 0 }}>
                                    <div className={styles.sectionHeader} style={{ margin: '0 0 12px 0', borderBottom: 'none' }}>
                                        <span>Modbus TCP Settings</span>
                                    </div>
                                    <div className={styles.formGrid} style={{ marginBottom: 0, gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                                            <label>IP Address</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. 192.168.1.100" 
                                                required={deviceForm.protocol === 'tcp'} 
                                                pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
                                                value={deviceForm.tcp.ip}
                                                onChange={(e) => {
                                                    handleConnectionChange();
                                                    setDeviceForm({ 
                                                        ...deviceForm, 
                                                        tcp: { ...deviceForm.tcp, ip: e.target.value } 
                                                    });
                                                }}
                                            />
                                        </div>
                                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                                            <label>Port</label>
                                            <input 
                                                type="number" 
                                                placeholder="502" 
                                                min="1" 
                                                max="65535" 
                                                required={deviceForm.protocol === 'tcp'} 
                                                value={deviceForm.tcp.port}
                                                onChange={(e) => {
                                                    handleConnectionChange();
                                                    setDeviceForm({ 
                                                        ...deviceForm, 
                                                        tcp: { ...deviceForm.tcp, port: parseInt(e.target.value) || 502 } 
                                                    });
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Modbus RTU Serial Settings */}
                            {deviceForm.protocol === 'rtu' && (
                                <div className={`${styles.sectionBox} ${styles.activeSection}`} style={{ marginBottom: 0 }}>
                                    <div className={styles.sectionHeader} style={{ margin: '0 0 12px 0', borderBottom: 'none' }}>
                                        <span>Modbus RTU Serial Settings</span>
                                    </div>
                                
                                <div className={styles.formGroup} style={{ marginBottom: '12px' }}>
                                    <label>Serial Path</label>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <CustomDropdown 
                                                options={serialPathOptions}
                                                value={serialPathOptions.some(opt => opt.id === deviceForm.serial.path && opt.id !== 'custom') ? deviceForm.serial.path : 'custom'}
                                                placeholder="Select serial path..."
                                                onChange={(val) => {
                                                    handleConnectionChange();
                                                    setDeviceForm({
                                                        ...deviceForm,
                                                        serial: { 
                                                            ...deviceForm.serial, 
                                                            path: val === 'custom' ? '' : val 
                                                        }
                                                    });
                                                }}
                                            />
                                        </div>
                                        {(!serialPathOptions.some(opt => opt.id === deviceForm.serial.path && opt.id !== 'custom') || deviceForm.serial.path === '') && (
                                            <input 
                                                type="text"
                                                placeholder="Path"
                                                required={deviceForm.protocol === 'rtu'}
                                                style={{ flex: 1 }}
                                                value={deviceForm.serial.path}
                                                onChange={(e) => {
                                                    handleConnectionChange();
                                                    setDeviceForm({
                                                        ...deviceForm,
                                                        serial: { ...deviceForm.serial, path: e.target.value }
                                                    });
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className={styles.formGrid} style={{ marginBottom: '12px', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                                        <CustomDropdown 
                                            label="Baud Rate"
                                            options={baudRateOptions}
                                            value={String(deviceForm.serial.baudRate)}
                                            onChange={(val) => {
                                                handleConnectionChange();
                                                setDeviceForm({
                                                    ...deviceForm,
                                                    serial: { ...deviceForm.serial, baudRate: parseInt(val) || 9600 }
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                                        <CustomDropdown 
                                            label="Parity"
                                            options={parityOptions}
                                            value={deviceForm.serial.parity}
                                            onChange={(val) => {
                                                handleConnectionChange();
                                                setDeviceForm({
                                                    ...deviceForm,
                                                    serial: { ...deviceForm.serial, parity: val as any }
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className={styles.formGrid} style={{ marginBottom: 0, gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                                        <CustomDropdown 
                                            label="Data Bits"
                                            options={dataBitsOptions}
                                            value={String(deviceForm.serial.dataBits)}
                                            onChange={(val) => {
                                                handleConnectionChange();
                                                setDeviceForm({
                                                    ...deviceForm,
                                                    serial: { ...deviceForm.serial, dataBits: parseInt(val) as any }
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                                        <CustomDropdown 
                                            label="Stop Bits"
                                            options={stopBitsOptions}
                                            value={String(deviceForm.serial.stopBits)}
                                            onChange={(val) => {
                                                handleConnectionChange();
                                                setDeviceForm({
                                                    ...deviceForm,
                                                    serial: { ...deviceForm.serial, stopBits: parseFloat(val) as any }
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            )}
                        </div>

                        {/* Test Connection Action */}
                        <div style={{ 
                            background: isTested ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                            border: isTested ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{ flex: 1, marginRight: '16px' }}>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: isTested ? '#22c55e' : 'var(--text-primary)' }}>
                                    {isTested ? '✓ Connection Verified' : 'Modbus Hardware Verification'}
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {isTested 
                                        ? `Modbus slave ID ${deviceForm.slaveId} is online and responding.` 
                                        : 'Test communication to unlock register mapping and templates.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleTestConnection}
                                disabled={isTesting}
                                style={{
                                    background: isTested ? 'rgba(34, 197, 94, 0.15)' : 'var(--accent)',
                                    color: isTested ? '#22c55e' : '#fff',
                                    border: isTested ? '1px solid rgba(34, 197, 94, 0.4)' : 'none',
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s',
                                    boxShadow: isTested ? 'none' : '0 4px 12px rgba(var(--accent-rgb), 0.2)'
                                }}
                            >
                                {isTesting ? (
                                    <>
                                        <svg className={styles.spinner} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite' }}>
                                            <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9" />
                                        </svg>
                                        Testing...
                                    </>
                                ) : isTested ? (
                                    <>Re-test Connection</>
                                ) : (
                                    <>Test Connection</>
                                )}
                            </button>
                        </div>

                        {/* Device Profile Selection (Select devices after test) */}
                        <div style={{ 
                            marginBottom: '24px',
                            opacity: isTested ? 1 : 0.4,
                            pointerEvents: isTested ? 'auto' : 'none',
                            transition: 'all 0.3s ease',
                            background: 'rgba(255, 255, 255, 0.01)',
                            border: '1px solid rgba(255, 255, 255, 0.04)',
                            borderRadius: '12px',
                            padding: '16px'
                        }}>
                            <CustomDropdown 
                                label="Device Profile / Prototype"
                                options={templateOptions}
                                value={deviceForm.template}
                                onChange={(val) => {
                                    const templateId = val;
                                    const selectedTemplate = DEVICE_TEMPLATES.find(t => t.id === templateId);
                                    if (selectedTemplate) {
                                        const alreadyVerified = !!testedTemplates[templateId];
                                        setIsTested(alreadyVerified);

                                        setDeviceForm({
                                            ...deviceForm,
                                            template: templateId,
                                            registers: selectedTemplate.registers.map(r => ({ ...r }))
                                        });
                                    }
                                }}
                            />
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {deviceForm.template === 'custom' 
                                    ? 'Custom Device: Add your own register mappings manually below.' 
                                    : `Preset Profile: Automatically loaded predefined register mappings for ${templateOptions.find(t => t.id === deviceForm.template)?.label}.`}
                            </p>
                        </div>

                        {/* Registers Mapping (grayed out until tested) */}
                        <div style={{ 
                            opacity: isTested ? 1 : 0.4, 
                            pointerEvents: isTested ? 'auto' : 'none', 
                            transition: 'all 0.3s ease',
                            border: '1px solid rgba(255, 255, 255, 0.03)',
                            background: 'rgba(255, 255, 255, 0.005)',
                            padding: '16px',
                            borderRadius: '12px',
                            marginBottom: '16px'
                        }}>
                            <div className={styles.sectionHeader} style={{ marginTop: 0 }}>
                                <span>Registers Mapping ({deviceForm.registers.length})</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 400 }}>InfluxDB Field Definitions</span>
                            </div>

                            {deviceForm.registers.length > 0 && (
                                <div className={styles.registersHeader}>
                                    <div>Starting Address</div>
                                    <div>Data Type</div>
                                    <div>Tag / Field Name (InfluxDB)</div>
                                    <div></div>
                                </div>
                            )}

                            <div className={styles.registersList}>
                                {deviceForm.registers.map((register, index) => (
                                    <div key={index} className={styles.registerRow}>
                                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Starting Address</label>
                                            <input 
                                                type="number" 
                                                placeholder="40001" 
                                                min="1" 
                                                required 
                                                value={register.address}
                                                onChange={(e) => {
                                                    const updated = [...deviceForm.registers];
                                                    updated[index].address = parseInt(e.target.value) || 40001;
                                                    setDeviceForm({ ...deviceForm, registers: updated });
                                                }}
                                            />
                                        </div>
                                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Data Type</label>
                                            <CustomDropdown 
                                                options={dataTypeOptions}
                                                value={register.dataType}
                                                onChange={(val) => {
                                                    const updated = [...deviceForm.registers];
                                                    updated[index].dataType = val as any;
                                                    setDeviceForm({ ...deviceForm, registers: updated });
                                                }}
                                            />
                                        </div>
                                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Tag / Field Name (InfluxDB)</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. voltage, active_power" 
                                                required 
                                                value={register.name}
                                                onChange={(e) => {
                                                    const updated = [...deviceForm.registers];
                                                    updated[index].name = e.target.value;
                                                    setDeviceForm({ ...deviceForm, registers: updated });
                                                }}
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            className={styles.deleteBtn}
                                            disabled={deviceForm.registers.length <= 1}
                                            style={deviceForm.registers.length <= 1 ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
                                            onClick={() => {
                                                if (deviceForm.registers.length > 1) {
                                                    const updated = deviceForm.registers.filter((_, i) => i !== index);
                                                    setDeviceForm({ ...deviceForm, registers: updated });
                                                }
                                            }}
                                            title="Delete register mapping"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button 
                                type="button" 
                                className={styles.addRegisterBtn}
                                onClick={() => {
                                    const lastAddress = deviceForm.registers.length > 0 
                                        ? deviceForm.registers[deviceForm.registers.length - 1].address 
                                        : 40001;
                                    setDeviceForm({
                                        ...deviceForm,
                                        registers: [
                                            ...deviceForm.registers,
                                            { address: lastAddress + 1, dataType: 'int16', name: '' }
                                        ]
                                    });
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Add Register Row
                            </button>
                        </div>
                    </div>

                    <div className={styles.modalFooter} style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <button type="button" className={styles.filterBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button 
                            type="submit" 
                            className={styles.addBtn}
                            disabled={!isTested}
                            style={!isTested ? { opacity: 0.5, cursor: 'not-allowed', background: '#475569', boxShadow: 'none' } : {}}
                        >
                            {editingDevice ? 'Save Configuration' : 'Register Device'}
                        </button>
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
