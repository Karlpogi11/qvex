import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useAppStore } from '../../store';
import styles from './NotificationContainer.module.css';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useAppStore();

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = icons[notification.type] || Info;
          return (
            <motion.div
              key={notification.id}
              className={`${styles.notification} ${styles[notification.type]}`}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            >
              <div className={styles.icon}>
                <Icon size={20} />
              </div>
              <p className={styles.message}>{notification.message}</p>
              <button
                className={styles.closeBtn}
                onClick={() => removeNotification(notification.id)}
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default NotificationContainer;
