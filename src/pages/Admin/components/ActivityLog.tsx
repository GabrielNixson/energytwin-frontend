import { useEffect, useState } from 'react';
import { ActivityLogEntry } from '../../../types/admin.types';
import { adminService } from '../../../services/adminService';
import { motion } from 'framer-motion';
import Loading from '../../../components/Loading/Loading';

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
    return <Loading message="Fetching activity logs..." />;
  }

  return (
    <div className="activity-log" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="management-header" style={{ 
        marginBottom: '1rem',
        padding: '1rem 0',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, margin: 0 }}>System Activity</h2>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Track administrative changes across the organization.</p>
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
