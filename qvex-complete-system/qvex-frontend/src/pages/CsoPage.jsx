// CsoPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, PhoneCall, CheckCircle, Clock, User } from 'lucide-react';
import { useAppStore, useCsoStore } from '../store';
import { queueApi, csoApi } from '../services/api';
import { format } from 'date-fns';
import styles from './CsoPage.module.css';

const CsoPage = () => {
  // ====== Hooks ======
  const { csoId } = useParams();
  const csoIdNum = Number(csoId);
  const navigate = useNavigate();
  const { addNotification } = useAppStore();

  const {
  
    startService,
    updateDuration,
    completeService,
    getCurrentQueue,
    getServiceDuration,
  } = useCsoStore();

  const [csoInfo, setCsoInfo] = useState(null);
  const [waitingQueues, setWaitingQueues] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [selectedType, setSelectedType] = useState('walk-in');

  const currentQueue = getCurrentQueue(csoIdNum);

  // ====== useEffect: Load CSO info & recover queue ======
useEffect(() => {
  let isMounted = true;

  const load = async () => {
    try {
      //  Load CSO info (required)
      const csoData = await csoApi.getById(csoIdNum);
      if (!isMounted) return;
      setCsoInfo(csoData);

      // 2️ ALWAYS trust backend for current serving
      const queue = await queueApi.getCurrent(csoIdNum);

      if (queue && queue.status === 'serving') {
        const elapsedSeconds = queue.called_at
  ? Math.floor((Date.now() - new Date(queue.called_at).getTime()) / 1000)
  : 0;

startService(csoIdNum, queue, elapsedSeconds); // pass elapsed time to store

      }

      // 3️⃣ Load counts (waiting / appointment)
      await loadQueues();
    } catch (err) {
      console.error('Failed to load CSO info', err);
    }
  };

  load();

  // ⏱ Duration updater (safe even if no queue)
  const durationTimer = setInterval(() => {
    updateDuration(csoIdNum);
  }, 1000);

  // 🕒 Clock
  const clockTimer = setInterval(() => {
    setCurrentDateTime(new Date());
  }, 1000);

  return () => {
    isMounted = false;
    clearInterval(durationTimer);
    clearInterval(clockTimer);
  };
}, [csoIdNum]);


  // ====== loadQueues: fetch waiting and appointment queues ======
  const loadQueues = async () => {
    try {
      const waiting = await queueApi.getWaiting();
      const appts = await queueApi.getByAppointment();

      setWaitingQueues(waiting.filter((q) => q.queue_type === 'walk-in'));
      setAppointments(appts.filter((q) => q.queue_type === 'appointment'));
    } catch (err) {
      console.error('Failed to load queues', err);
    }
  };

  // ====== handleCallNext ======
  const handleCallNext = async () => {
    try {
      const queue = await queueApi.callNext({
        csoId: csoIdNum,
        customerType: selectedType,
      });

      if (queue) {
        startService(csoIdNum, queue); // assign queue per-CSO
        await loadQueues(); // update counts
      }

      addNotification({
        type: 'success',
        message: `Called ${queue.queue_number}`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: error.response?.data?.message || 'No customers in queue',
      });
    }
  };

  // ====== handleComplete ======
  const handleComplete = async () => {
  if (!currentQueue) return;

  try {
    const duration = getServiceDuration(csoIdNum) || 0; // ✅ get per-CSO duration
    await queueApi.complete(currentQueue.id, duration);
    await csoApi.updateStatus(csoIdNum, { current_queue_id: null });

    completeService(csoIdNum); // reset per-CSO
    await loadQueues();

    addNotification({
      type: 'success',
      message: `Service completed for ${currentQueue.queue_number}`,
    });
  } catch (err) {
    addNotification({
      type: 'error',
      message: 'Failed to complete service',
    });
  }
};



  // ====== formatDuration helper ======
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!csoInfo) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // ====== Render ======
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <ArrowLeft size={20} /> Back
        </button>
        <div className={styles.counterInfo}>
          <h1>Counter {csoInfo.counter_number}</h1>
          <p>{csoInfo.name}</p>
        </div>
        <div className={styles.datetime}>
          <div className={styles.time}>{format(currentDateTime, 'HH:mm:ss')}</div>
          <div className={styles.date}>{format(currentDateTime, 'MMM dd, yyyy')}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Current Service Section */}
        <div className={styles.currentSection}>
          <h2>Current Service</h2>
          {currentQueue ? (
            <motion.div className={styles.currentCard} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <div className={styles.queueNumberLarge}>{currentQueue.queue_number}</div>
              <div className={styles.serviceInfo}>
                <div className={styles.serviceType}>{currentQueue.service_type}</div>
                <div className={styles.customerType}>
                  {currentQueue.queue_type === 'walk-in' ? 'Walk-In Customer' : 'Appointment'}
                </div>
              </div>
              <div className={styles.timer}>
                <Clock size={32} />
                <div className={styles.duration}>{formatDuration(getServiceDuration(csoIdNum))}</div>
              </div>
              <motion.button
                className={styles.completeBtn}
                onClick={handleComplete}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCircle size={24} />
                Complete Service
              </motion.button>
            </motion.div>
          ) : (
            <div className={styles.noService}>
              <User size={64} />
              <p>No customer currently being served</p>
              <p className={styles.hint}>Click "Call Next" to serve a customer</p>
            </div>
          )}
        </div>

        {/* Call Next Section */}
        <div className={styles.callSection}>
          <div className={styles.typeSelector}>
            <button
              className={selectedType === 'walk-in' ? styles.active : ''}
              onClick={() => setSelectedType('walk-in')}
            >
              Walk-In ({waitingQueues.length})
            </button>
            <button
              className={selectedType === 'appointment' ? styles.active : ''}
              onClick={() => setSelectedType('appointment')}
            >
              Appointment ({appointments.length})
            </button>
          </div>

          <motion.button
            className={styles.callNextBtn}
            onClick={handleCallNext}
            disabled={!!currentQueue}
            whileHover={!currentQueue ? { scale: 1.02 } : {}}
            whileTap={!currentQueue ? { scale: 0.98 } : {}}
          >
            <PhoneCall size={32} />
            Call Next Customer
          </motion.button>

          {/* Queue Preview */}
          <div className={styles.queuePreview}>
            <h3>Waiting Queue</h3>
            <div className={styles.previewList}>
              {(selectedType === 'walk-in' ? waitingQueues : appointments).slice(0, 5).map((queue) => (
                <div key={queue.id} className={styles.previewItem}>
                  <span className={styles.previewNumber}>{queue.queue_number}</span>
                  <span className={styles.previewService}>{queue.service_type}</span>
                </div>
              ))}
              {(selectedType === 'walk-in' ? waitingQueues : appointments).length === 0 && (
                <div className={styles.emptyQueue}>No customers waiting</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CsoPage;