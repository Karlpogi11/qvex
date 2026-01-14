import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MonitorPlay, UserCircle, Settings as SettingsIcon, Smartphone } from 'lucide-react';
import { useAppStore } from '../store';
import { csoApi } from '../services/api';
import styles from './HomePage.module.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { theme, setTheme, csos, setCsos } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showCsoSelect, setShowCsoSelect] = useState(false);

  useEffect(() => {
    loadCsos();
  }, []);

  const loadCsos = async () => {
    try {
      const data = await csoApi.getAll();
      setCsos(data);
    } catch (error) {
      console.error('Failed to load CSOs:', error);
    }
  };

  const roleCards = [
    {
      title: 'Reception Desk',
      icon: Smartphone,
      description: 'Register customers and manage queue',
      path: '/reception',
      color: 'var(--electric-blue)',
    },
    {
      title: 'Service Counter',
      icon: UserCircle,
      description: 'CSO dashboard for serving customers',
      action: () => setShowCsoSelect(true),
      color: 'var(--success)',
    },
    {
      title: 'Display Screen',
      icon: MonitorPlay,
      description: 'Full-screen queue display for TV',
      path: '/display',
      color: 'var(--warning)',
    },
  ];

  const handleRoleSelect = (card) => {
    if (card.path) {
      navigate(card.path);
    } else if (card.action) {
      card.action();
    }
  };

  const handleCsoSelect = (csoId) => {
    navigate(`/cso/${csoId}`);
  };

  return (
    <div className={styles.container}>
      {/* Background Pattern */}
      <div className={styles.bgPattern}></div>

      {/* Settings Button */}
      <motion.button
        className={styles.settingsBtn}
        onClick={() => setShowSettings(!showSettings)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <SettingsIcon size={24} />
      </motion.button>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          className={styles.settingsPanel}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
        >
          <h3>Settings</h3>
          {/* <div className={styles.settingItem}>
            <label>Theme</label>
            <div className={styles.themeToggle}>
              <button
                className={theme === 'dark' ? styles.active : ''}
                onClick={() => setTheme('dark')}
              >
                Dark
              </button>
              <button
                className={theme === 'light' ? styles.active : ''}
                onClick={() => setTheme('light')}
              >
                Light
              </button>
            </div>
          </div> */}
          <button
            className={styles.adminBtn}
            onClick={() => navigate('/admin')}
          >
            Advanced Settings
          </button>
        </motion.div>
      )}

      {/* Main Content */}
      <div className={styles.content}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.logo}>
            <div className={styles.logoIcon}>Q</div>
            <div className={styles.logoText}>
              <h1>Qvex</h1>
              <p>Mobilecare Queue Management</p>
            </div>
          </div>
        </motion.div>

        {/* Role Selection Cards */}
        {!showCsoSelect ? (
          <motion.div
            className={styles.roleGrid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {roleCards.map((card, index) => (
              <motion.div
                key={card.title}
                className={styles.roleCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect(card)}
                style={{ '--card-color': card.color }}
              >
                <div className={styles.cardIcon}>
                  <card.icon size={48} />
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <div className={styles.cardGlow}></div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            className={styles.csoSelection}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <button
              className={styles.backBtn}
              onClick={() => setShowCsoSelect(false)}
            >
              ← Back
            </button>
            <h2>Select Your Counter</h2>
            <div className={styles.csoGrid}>
              {csos.map((cso) => (
                <motion.div
                  key={cso.id}
                  className={styles.csoCard}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCsoSelect(cso.id)}
                >
                  <div className={styles.counterNumber}>Counter {cso.counter_number}</div>
                  <div className={styles.csoName}>{cso.name}</div>
                  {cso.current_queue_id && (
                    <div className={styles.serving}>Currently Serving</div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p>© 2026 ASP PODIUM</p>
      </div>
    </div>
  );
};

export default HomePage;
