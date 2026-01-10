import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { csoApi } from '../services/api';
import { format } from 'date-fns';
import { io } from 'socket.io-client';
import styles from './DisplayPage.module.css';

const DisplayPage = () => {
  const [csos, setCsos] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [highlightedCounter, setHighlightedCounter] = useState(null);

  useEffect(() => {
    //  Socket connection
    const socket = io('http://localhost:3001', {
      transports: ['websocket'],
      reconnection: true,
    });

    socket.on('connect', () => {
      console.log('🟢 Display connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('🔴 Display disconnected');
    });

    // 📥 Load CSOs
    const loadCsos = async () => {
     const data = await csoApi.getAll();
      try {
        
        setCsos(
          data.map(cso => ({
            ...cso,
            current_queue: cso.current_queue || null,
          }))
        );
      } catch (error) {
        console.error('Failed to load CSOs:', error);
      }
    };

    loadCsos();

    //  Listen to queue events
   socket.on('queue_event', (data) => {
  setCsos(prevCsos =>
    prevCsos.map(cso => {
      // Only update the CSO that matches
      if (cso.counter_number === data.counter_number) {
        if (data.type === 'customer_called') {
          return {
            ...cso,
          current_queue: data.type === 'customer_called' ? { queue_number: data.queue_number, queue_type: data.queue_type } : null
      
          };
        }
        if (data.type === 'service_completed') {
          return {
            ...cso,
            current_queue: null,
          };
        }
      }
      // Leave others untouched
      return cso;
    })
  );
});


    // ⏰ Clock
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);

    return () => {
      socket.disconnect();
      clearInterval(timer);
    };
  }, []);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>Q</div>
          <div>
            <h1>ASP PODIUM</h1>
            <p>Queue Management System</p>
          </div>
        </div>

        <div className={styles.datetime}>
          <div className={styles.time}>
            {format(currentDateTime, 'HH:mm:ss')}
          </div>
          <div className={styles.date}>
            {format(currentDateTime, 'EEEE, MMMM dd, yyyy')}
          </div>
        </div>
      </div>

      {/* Counter Grid */}
      <div className={styles.counterGrid}>
        <AnimatePresence>
          {csos.map((cso) => (
            <motion.div
              key={cso.id}
              className={`${styles.counterCard} ${
                highlightedCounter === cso.counter_number
                  ? styles.highlighted
                  : ''
              }`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className={styles.counterHeader}>
                <div className={styles.counterLabel}>Counter</div>
                <div className={styles.counterNumber}>
                  {cso.counter_number}
                </div>
              </div>

              <div className={styles.csoName}>{cso.name}</div>

              {cso.current_queue ? (
                <div className={styles.servingSection}>
                  <div className={styles.nowServing}>Now Serving</div>
                  <div className={styles.queueNumber}>
                    {cso.current_queue.queue_number}
                  </div>
                </div>
              ) : (
                <div className={styles.availableSection}>
                  <div className={styles.availableText}>Available</div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p>Please wait for your number to be called</p>
      </div>
    </div>
  );
};

export default DisplayPage;
