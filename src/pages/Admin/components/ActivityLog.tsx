import React, { useEffect, useState } from 'react';
import { ActivityLogEntry } from '../../../types/admin.types';
import { adminService } from '../../../services/adminService';
import { motion } from 'framer-motion';

const ActivityLog = () => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await adminService.getActivityLogs();
        setLogs(data);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return <div className="placeholder-content">Loading logs...</div>;
  }

  return (
    <div className="activity-log">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>System Activity</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Track administrative changes across the organization.</p>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <motion.tr 
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{formatTimestamp(log.timestamp)}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{log.userName}</div>
                </td>
                <td>
                  <span style={{ 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px', 
                    background: 'var(--secondary)', 
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: 'var(--accent)'
                  }}>
                    {log.action}
                  </span>
                </td>
                <td>{log.target}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLog;
