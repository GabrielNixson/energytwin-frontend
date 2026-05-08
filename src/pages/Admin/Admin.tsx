import { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './Admin.module.scss';
import MemberManagement from './components/MemberManagement';
import RoleManagement from './components/RoleManagement';
import ActivityLog from './components/ActivityLog';

const tabs = [
  { id: 'members', label: 'Members', description: 'Manage team access and roles' },
  { id: 'roles', label: 'Roles & Permissions', description: 'Define what users can do' },
  { id: 'logs', label: 'Activity Logs', description: 'Audit system changes' },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState('members');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'members':
        return <MemberManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'logs':
        return <ActivityLog />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={styles["admin-container"]}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className={styles["page-header"]}>
        <div className={styles["header-text"]}>
          <motion.h1 variants={itemVariants}>Admin Panel</motion.h1>
          <motion.p className={styles["subtitle"]} variants={itemVariants}>
            Configure your organization, manage members, and audit system activity.
          </motion.p>
        </div>
      </div>

      <div className={styles["tab-nav"]}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles["tab-button"]} ${activeTab === tab.id ? styles["active"] : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles["tab-label"]}>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className={styles["tab-underline"]}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}
      </div>

      <motion.div 
        className={styles["tab-content"]}
        key={activeTab}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderContent()}
      </motion.div>
    </motion.div>
  );
};

export default Admin;
