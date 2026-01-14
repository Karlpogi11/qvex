import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { csoApi, queueApi } from '../services/api';
import { format } from 'date-fns';
import { io } from 'socket.io-client';
import styles from './DisplayPage.module.css';

const DisplayPage = () => {
  const [csos, setCsos] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [highlightedCounter, setHighlightedCounter] = useState(null);
  const [waitingQueues, setWaitingQueues] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const enterFullscreen = () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    };
    enterFullscreen();

    // 🔌 Socket connection
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
      try {
        const data = await csoApi.getAll();
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

    // 📥 Load Waiting Queues
    const loadQueues = async () => {
      try {
        const waiting = await queueApi.getWaiting();
        const appts = await queueApi.getByAppointment();
        
        setWaitingQueues(waiting.filter((q) => q.queue_type === 'walk-in'));
        setAppointments(appts.filter((q) => q.queue_type === 'appointment'));
      } catch (err) {
        console.error('Failed to load queues:', err);
      }
    };

    loadCsos();
    loadQueues();

    // 📡 Listen to queue events
    socket.on('queue_event', (data) => {
      console.log('Queue event:', data);

      if (data.type === 'customer_called') {
        setCsos(prev =>
          prev.map(cso =>
            cso.counter_number === data.counter_number
              ? {
                  ...cso,
                  current_queue: {
                    queue_number: data.queue_number,
                    queue_type: data.queue_type,
                  },
                }
              : cso
          )
        );

        setHighlightedCounter(data.counter_number);
        setTimeout(() => setHighlightedCounter(null), 3000);
        
        // Update waiting queues
        loadQueues();
      }

      if (data.type === 'service_completed') {
        setCsos(prev =>
          prev.map(cso =>
            cso.counter_number === data.counter_number
              ? { ...cso, current_queue: null }
              : cso
          )
        );
        
        // Update waiting queues
        loadQueues();
      }

      // Handle new queue additions
      if (data.type === 'queue_added' || data.type === 'queue_updated') {
        loadQueues();
      }
    });

    // ⏰ Clock
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    
    return () => {
      socket.disconnect();
      clearInterval(timer);
    };
  }, []);

  // Helper function to render queue items with overflow indicator
  const renderQueueList = (queues) => {
    const MAX_VISIBLE = 5;
    const visibleQueues = queues.slice(0, MAX_VISIBLE);
    const remainingCount = queues.length - MAX_VISIBLE;

    return (
      <>
        {visibleQueues.map((queue) => (
          <motion.div
            key={queue.id}
            className={styles.queueItem}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className={styles.queueItemNumber}>{queue.queue_number}</span>
            <span className={styles.queueItemService}>{queue.service_type}</span>
          </motion.div>
        ))}
        {remainingCount > 0 && (
          <motion.div
            className={styles.moreWaiting}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <span className={styles.moreWaitingText}>
              <span className={styles.moreWaitingCount}>+{remainingCount}</span>
              more waiting
            </span>
          </motion.div>
        )}
      </>
    );
  };

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

      {/* Main Content - Counters (75%) + Queues (25%) */}
      <div className={styles.mainContent}>
        {/* Counters Section */}
        <div className={styles.countersSection}>
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
        </div>

        {/* Waiting Queues Section - Right Sidebar */}
        <div className={styles.waitingSection}>
          <div className={styles.queueColumn}>
            <h2 className={styles.queueTitle}>
              <span className={styles.queueIcon}></span>
              Walk-In ({waitingQueues.length})
            </h2>
            <div className={styles.queueList}>
              {waitingQueues.length === 0 ? (
                <div className={styles.emptyQueue}>No customers waiting</div>
              ) : (
                renderQueueList(waitingQueues)
              )}
            </div>
          </div>

          <div className={styles.queueColumn}>
            <h2 className={styles.queueTitle}>
              <span className={styles.queueIcon}></span>
              Appointments ({appointments.length})
            </h2>
            <div className={styles.queueList}>
              {appointments.length === 0 ? (
                <div className={styles.emptyQueue}>No appointments scheduled</div>
              ) : (
                renderQueueList(appointments)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p>Please wait for your number to be called</p>
      </div>
    </div>
  );
};

export default DisplayPage;