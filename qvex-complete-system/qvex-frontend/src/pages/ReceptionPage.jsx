import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Clock, X, Plus } from 'lucide-react';
import { useAppStore } from '../store';
import { queueApi } from '../services/api';
import { format } from 'date-fns';
import styles from './ReceptionPage.module.css';
// import { printQueueNumber } from '../services/printerService'; // keep commented if unused

const ReceptionPage = () => {
  const navigate = useNavigate();
  const { queues, setQueues, addQueue, removeQueue, addNotification, settings } = useAppStore();
  const [customerType, setCustomerType] = useState('walk-in');
  const [serviceType, setServiceType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [manualQueueNumber, setManualQueueNumber] = useState('');

  // Initial load only
  useEffect(() => {
    loadQueues();
  }, []);

  const loadQueues = async () => {
    try {
      const data = await queueApi.getWaiting();
      setQueues(data);
    } catch (error) {
      console.error('Failed to load queues:', error);
    }
  };

  const generateQueueNumber = () => {
    const prefix = customerType === 'appointment' ? 'A' : 'W';
    const activeNumbers = queues
      .filter(q => q.queue_number.startsWith(prefix) && ['waiting', 'serving'].includes(q.status))
      .map(q => parseInt(q.queue_number.replace(prefix, ''), 10));

    let nextNumber = 1;
    while (activeNumbers.includes(nextNumber)) {
      nextNumber++;
    }

    return prefix + String(nextNumber).padStart(prefix === 'A' ? 3 : 4, '0');
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!serviceType) {
    addNotification({ type: 'error', message: 'Please select a service type' });
    return;
  }

  try {
    const queueNumber =
      customerType === 'walk-in' && manualQueueNumber
        ? manualQueueNumber
        : generateQueueNumber();

    const queueType = customerType.toLowerCase();

    const newQueue = await queueApi.create({
      queue_number: queueNumber,
      queue_type: queueType,
      service_type: serviceType,
      status: 'waiting',
    });

    addQueue(newQueue);
    addNotification({ type: 'success', message: `Queue ${newQueue.queue_number} added` });

    setShowForm(false);
    setServiceType('');
    setManualQueueNumber('');
  } catch (error) {
    console.error('Queue creation error:', error.response?.data);
    
    // ✅ Handle specific error for active queue numbers
    const errorData = error.response?.data;
    let errorMessage = 'Failed to create queue';
    
    if (errorData?.error === 'QUEUE_NUMBER_ACTIVE') {
      errorMessage = 'This queue number is currently active. Please use a different number.';
    } else if (errorData?.message) {
      errorMessage = errorData.message;
    }
    
    addNotification({ type: 'error', message: errorMessage });
  }
};

  const handleCancel = async (queueId) => {
    if (!window.confirm('Are you sure you want to cancel this queue?')) return;

    try {
      await queueApi.cancel(queueId);
      removeQueue(queueId);
      addNotification({ type: 'success', message: 'Queue cancelled successfully' });
    } catch (error) {
      console.error('Cancel error:', error.response?.data || error);
      addNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to cancel queue',
      });
    }
  };

  const waitingQueues = queues.filter(q => q.status === 'waiting');
  const walkInCount = waitingQueues.filter(q => q.queue_type === 'walk-in').length;
  const appointmentCount = waitingQueues.filter(q => q.queue_type === 'appointment').length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Reception Desk</h1>
        <div className={styles.datetime}>
          <div className={styles.time}>{format(currentDateTime, 'HH:mm:ss')}</div>
          <div className={styles.date}>{format(currentDateTime, 'MMM dd, yyyy')}</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <motion.div
          className={styles.statCard}
          style={{ '--stat-color': 'var(--electric-blue)' }}
          whileHover={{ y: -4 }}
        >
          <div className={styles.statIcon}>
            <Users size={32} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{waitingQueues.length}</div>
            <div className={styles.statLabel}>Total Waiting</div>
          </div>
        </motion.div>

        <motion.div
          className={styles.statCard}
          style={{ '--stat-color': 'var(--success)' }}
          whileHover={{ y: -4 }}
        >
          <div className={styles.statIcon}>
            <Clock size={32} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{walkInCount}</div>
            <div className={styles.statLabel}>Walk-In</div>
          </div>
        </motion.div>

        <motion.div
          className={styles.statCard}
          style={{ '--stat-color': 'var(--warning)' }}
          whileHover={{ y: -4 }}
        >
          <div className={styles.statIcon}>
            <Clock size={32} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{appointmentCount}</div>
            <div className={styles.statLabel}>Appointment</div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <motion.button
          className={styles.newQueueBtn}
          onClick={() => setShowForm(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={24} />
          New Customer
        </motion.button>

        <div className={styles.queueSection}>
          <h2>Waiting Queue</h2>
          <div className={styles.queueList}>
            <AnimatePresence>
              {waitingQueues.length === 0 ? (
                <motion.div
                  className={styles.emptyState}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Users size={64} />
                  <p>No customers in queue</p>
                </motion.div>
              ) : (
                waitingQueues.map((queue, index) => (
                  <motion.div
                    key={queue.id}
                    className={styles.queueItem}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className={styles.queueNumber}>{queue.queue_number}</div>
                    <div className={styles.queueInfo}>
                      <div className={styles.serviceType}>{queue.service_type}</div>
                      <div className={styles.queueMeta}>
                        <span className={`${styles.badge} ${styles[queue.queue_type]}`}>
                          {queue.queue_type === 'walk-in' ? 'Walk-in' : 'Appointment'}
                        </span>
                        <span className={styles.time}>
                          {format(new Date(queue.created_at), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                    <button
                      className={styles.cancelBtn}
                      onClick={() => handleCancel(queue.id)}
                    >
                      <X size={20} />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* New Queue Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className={styles.modalHeader}>
                <h3>New Customer Queue</h3>
                <button onClick={() => setShowForm(false)}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label>Customer Type</label>
                  <div className={styles.typeToggle}>
                    <button
                      type="button"
                      className={customerType === 'walk-in' ? styles.active : ''}
                      onClick={() => setCustomerType('walk-in')}
                    >
                      Walk-In
                    </button>
                    <button
                      type="button"
                      className={customerType === 'appointment' ? styles.active : ''}
                      onClick={() => setCustomerType('appointment')}
                    >
                      Appointment
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Service Type</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    required
                  >
                    <option value="">Select service...</option>
                    {settings.serviceTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Queue Number</label>
                  <input
                    type="text"
                    className={styles.manualInput}
                    placeholder="Enter queue number"
                    value={manualQueueNumber}
                    onChange={(e) => setManualQueueNumber(e.target.value)}
                    disabled={customerType !== 'walk-in'}
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.btnPrimary}>
                    Submit
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReceptionPage;
