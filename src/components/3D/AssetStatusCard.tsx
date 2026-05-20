import React from 'react';
import { Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { AssetStatus } from '@/pages/Projects/project';

interface AssetStatusCardProps {
    position: [number, number, number];
    status: AssetStatus;
    name: string;
    visible?: boolean;
}

const statusColors = {
    normal: {
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.5)',
        text: '#10b981',
        glow: 'rgba(16, 185, 129, 0.3)',
        icon: '✅'
    },
    warning: {
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.5)',
        text: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.3)',
        icon: '⚠️'
    },
    error: {
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.5)',
        text: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.3)',
        icon: '🚨'
    }
};

const AssetStatusCard: React.FC<AssetStatusCardProps> = ({ position, status, name, visible = true }) => {
    const colors = statusColors[status.type] || statusColors.normal;

    return (
        <Html
            position={position}
            center
            distanceFactor={12}
            zIndexRange={[100, 0]}
            style={{
                pointerEvents: 'none',
                userSelect: 'none'
            }}
        >
            <AnimatePresence>
                {visible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                        style={{
                            background: 'rgba(15, 23, 42, 0.6)',
                            backdropFilter: 'blur(16px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                            border: `1px solid ${colors.border}`,
                            borderRadius: '12px',
                            padding: '12px 16px',
                            minWidth: '180px',
                            boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.8), 0 0 15px ${colors.glow}`,
                            color: '#f8fafc',
                            fontFamily: '"Outfit", "Inter", sans-serif',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            transform: 'translateY(calc(-50% - 25px))', // Aggressively lift the card above the anchor point
                            pointerEvents: 'none'
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                {name}
                            </span>
                            <motion.span 
                                animate={status.type !== 'normal' ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                style={{ fontSize: '14px' }}
                            >
                                {colors.icon}
                            </motion.span>
                        </div>

                        {/* Status Content */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ fontSize: '20px', fontWeight: 700, color: colors.text }}>
                                    {status.value || '--'}
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 500, opacity: 0.7 }}>
                                    {status.unit || ''}
                                </span>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}>
                                {status.message}
                            </span>
                        </div>

                        {/* Footer / Last Updated */}
                        <div style={{ 
                            marginTop: '4px', 
                            paddingTop: '8px', 
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                            fontSize: '9px',
                            opacity: 0.4,
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}>
                            <span>LIVE TELEMETRY</span>
                            <span>{status.lastUpdated}</span>
                        </div>


                    </motion.div>
                )}
            </AnimatePresence>
        </Html>
    );
};

export default AssetStatusCard;
