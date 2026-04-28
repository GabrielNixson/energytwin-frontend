import { motion, AnimatePresence } from "framer-motion";
import styles from "./NotificationDropdown.module.scss";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  isUnread: boolean;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
  onMarkAsRead: (id: number) => void;
}


const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/>
    <path d="M12 17h.01"/>
  </svg>
);

const ErrorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="m15 9-6 6"/>
    <path d="m9 9 6 6"/>
  </svg>
);

export const NotificationDropdown = ({ 
  isOpen, 
  onClose, 
  notifications, 
  onMarkAllRead,
  onMarkAsRead 
}: NotificationDropdownProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(5px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(5px)" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={styles["notification-dropdown"]}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <h3>Notifications</h3>
            <button className={styles["mark-read-btn"]} onClick={onMarkAllRead}>
              Mark all as read
            </button>
          </div>
          <div className={styles["notification-list"]}>
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`${styles["notification-item"]} ${notif.isUnread ? styles.unread : ""}`}
                onClick={() => onMarkAsRead(notif.id)}
              >
                <div className={`${styles.icon} ${styles[notif.type]}`}>
                  {notif.type === "alert" && <AlertIcon />}
                  {notif.type === "info" && <InfoIcon />}
                  {notif.type === "warning" && <WarningIcon />}
                  {notif.type === "error" && <ErrorIcon />}
                </div>
                <div className={styles.content}>
                  <h4>{notif.title}</h4>
                  <p>{notif.message}</p>
                  <span className={styles.time}>{notif.time}</span>
                </div>
                {notif.isUnread && <div className={styles["unread-dot"]} />}
              </div>
            ))}
            {notifications.length === 0 && (
              <div className={styles["empty-state"]}>
                <p>No notifications yet</p>
              </div>
            )}
          </div>
          <div className={styles.footer}>
            <button onClick={onClose}>View All Activity</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
