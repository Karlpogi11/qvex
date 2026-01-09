import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, PhoneCall, CheckCircle, Clock, User, NotebookTabsIcon } from 'lucide-react';
import { useAppStore, useCsoStore } from '../store';
import { queueApi, csoApi } from '../services/api';
import { format } from 'date-fns';
import { io } from 'socket.io-client';
import styles from './CsoPage.module.css';

//working
const CsoPage = () => {
  const { csoId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useAppStore();
  const {
    currentQueue,
    serviceStartTime,
    serviceDuration,
    startService,
    updateDuration,
    completeService,
  } = useCsoStore();

  const [csoInfo, setCsoInfo] = useState(null);
  const [waitingQueues, setWaitingQueues] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [selectedType, setSelectedType] = useState('walk-in');

  // ---------------------------
  // Fetch CSO info and current serving queue
const loadCsoInfo = async () => {
  try {
    const data = await csoApi.getById(csoId);
    setCsoInfo(data);

    // ✅ Get current serving queue
    const queue = await queueApi.getCurrent(csoId);
    if (queue && queue.status === 'serving') {
      startService(queue); // set currentQueue in store
    }
  } catch (error) {
    console.error(error);
  }
};



  // Fetch waiting and appointment queues
  const loadQueues = async () => {
    try {
      const waiting = await queueApi.getWaiting();
      const appts = await queueApi.getByAppointment();

      setWaitingQueues(waiting.filter(q => q.queue_type === 'walk-in'));
      setAppointments(appts.filter(q => q.queue_type === 'appointment'));
    } catch (error) {
      console.error('Failed to load queues:', error);
    }
  };

  // ---------------------------
  // Socket.IO: Listen for queue events in real-time
  useEffect(() => {
    // only connect socket after csoInfo is loaded
    if (!csoInfo) return;

    const socket = io('http://localhost:3001', {
      transports: ['websocket'],
      reconnection: true,
    });

    socket.on('connect', () => console.log('🟢 CSO page connected:', socket.id));
    socket.on('disconnect', () => console.log('🔴 CSO page disconnected'));

    socket.on('queue_event', (data) => {
      if (data.counter_number === csoInfo.counter_number) {
        if (data.type === 'customer_called') {
          startService({
            id: data.queue_id,
            queue_number: data.queue_number,
            queue_type: data.queue_type,
            service_type: data.service_type,
            status: 'serving',
          });
        } else if (data.type === 'service_completed') {
          completeService();
        }
      }
      loadQueues(); // refresh UI queues
    });

    return () => socket.disconnect();
  }, [csoInfo]); // only re-run if csoInfo changes

  // ---------------------------
  // Main useEffect for initial load & timers
  useEffect(() => {
    loadCsoInfo();
    loadQueues();

    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
      if (serviceStartTime) updateDuration();
    }, 1000);

    return () => clearInterval(timer);
  }, [csoId, serviceStartTime]);

  // ---------------------------
  // Call next customer
 const handleCallNext = async () => {
  try {
    const res = await queueApi.callNext({
      csoId: Number(csoId),
      customerType: selectedType,
    });

    if (!res.queue) throw new Error('No queue returned from backend');

    startService(res.queue); // ✅ this sets currentQueue correctly

    await csoApi.updateStatus(csoId, { current_queue_id: res.queue.id });

    addNotification({
      type: 'success',
      message: `Called ${res.queue.queue_number}`,
    });

    loadQueues();
  } catch (error) {
    console.error(error.response?.data || error.message);
    addNotification({
      type: 'error',
      message: error.response?.data?.message || 'No customers in queue',
    });
  }
};



  // ---------------------------
  // Complete current service
  const handleComplete = async () => {
  if (!currentQueue?.id) {
    console.warn('No current queue to complete');
    return;
  }

  try {
    await queueApi.complete(currentQueue.id, serviceDuration);
    await csoApi.updateStatus(csoId, { current_queue_id: null });

    addNotification({
      type: 'success',
      message: `Service completed for ${currentQueue.queue_number}`,
    });

    completeService(); // resets currentQueue
    loadQueues();
  } catch (error) {
    console.error(error.response?.data || error.message);
    addNotification({
      type: 'error',
      message: 'Failed to complete service',
    });
  }
};

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!csoInfo) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // ---------------------------
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
        {/* Current Service */}
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
                <div className={styles.duration}>{formatDuration(serviceDuration)}</div>
              </div>
              <motion.button
                className={styles.completeBtn}
                onClick={handleComplete}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCircle size={24} /> Complete Service
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
            disabled={!!currentQueue|| !csoInfo }
            whileHover={!currentQueue ? { scale: 1.02 } : {}}
            whileTap={!currentQueue ? { scale: 0.98 } : {}}
          >
            <PhoneCall size={32} /> Call Next Customer
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
