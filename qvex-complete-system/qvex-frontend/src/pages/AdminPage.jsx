import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, X, Save } from 'lucide-react';
import { useAppStore } from '../store';
import { csoApi, settingsApi } from '../services/api';
import styles from './AdminPage.module.css';
import { BarChart3 } from 'lucide-react';

const AdminPage = () => {




  
  const navigate = useNavigate();
  const { theme, setTheme, settings, updateSettings, addNotification } = useAppStore();
  const [csos, setCsos] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [newCsoName, setNewCsoName] = useState('');
  const [newServiceType, setNewServiceType] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const csoData = await csoApi.getAll();
      setCsos(csoData);
      
      const serviceData = await settingsApi.getServiceTypes();
      setServiceTypes(serviceData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleAddCso = async () => {
    if (!newCsoName.trim()) return;

    try {
      const counterNumber = csos.length + 1;
      await csoApi.create({ name: newCsoName, counter_number: counterNumber });
      addNotification({ type: 'success', message: 'CSO added successfully' });
      setNewCsoName('');
      loadData();
    } catch (error) {
      addNotification({ type: 'error', message: 'Failed to add CSO' });
    }
  };

  const handleRemoveCso = async (id) => {
    if (!confirm('Are you sure you want to remove this CSO?')) return;

    try {
      await csoApi.delete(id);
      addNotification({ type: 'success', message: 'CSO removed successfully' });
      loadData();
    } catch (error) {
      addNotification({ type: 'error', message: 'Failed to remove CSO' });
    }
  };

  const handleAddServiceType = () => {
    if (!newServiceType.trim() || serviceTypes.includes(newServiceType)) return;
    setServiceTypes([...serviceTypes, newServiceType]);
    setNewServiceType('');
  };

  const handleRemoveServiceType = (type) => {
    setServiceTypes(serviceTypes.filter(t => t !== type));
  };

const handleSaveSettings = async () => {
  try {
    await settingsApi.updateServiceTypes(serviceTypes);
    updateSettings({ serviceTypes });
    
    // ✅ Reload settings from backend to confirm save
    await useAppStore.getState().loadSettings();
    
    addNotification({ type: 'success', message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Save error:', error);
    addNotification({ type: 'error', message: 'Failed to save settings' });
  }
};

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Settings & Configuration</h1>
      </div>



      <div className={styles.content}>
        Theme Settings

        {/* ?\Hindi pa naayos contrast */}
        {/* <div className={styles.section}>
          <h2>Appearance</h2>
          <div className={styles.themeToggle}>
            <button
              className={theme === 'dark' ? styles.active : ''}
              onClick={() => setTheme('dark')}
            >
              Dark Mode
            </button>
            <button
              className={theme === 'light' ? styles.active : ''}
              onClick={() => setTheme('light')}
            >
              Light Mode
            </button>

         
          </div>

        </div> */}

      <button 
        className={styles.statsBtn}
        onClick={() => navigate('/statistics')}
      >
        <BarChart3 size={20} />
        View Statistics
      </button>
        {/* CSO Management */}
        <div className={styles.section}>
          <h2>Customer Service Officers</h2>
          <div className={styles.addForm}>
            <input
              type="text"
              placeholder="Enter CSO name..."
              value={newCsoName}
              onChange={(e) => setNewCsoName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCso()}
            />
            <button onClick={handleAddCso}>
              <Plus size={20} />
              Add CSO
            </button>

            
          </div>
          <div className={styles.itemList}>
            {csos.map((cso) => (
              <div key={cso.id} className={styles.item}>
                <div>
                  <strong>Counter {cso.counter_number}</strong>
                  <span>{cso.name}</span>
                </div>
                <button onClick={() => handleRemoveCso(cso.id)}>
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>




        {/* Service Types */}
        <div className={styles.section}>
          <h2>Service Types</h2>
          <div className={styles.addForm}>
            <input
              type="text"
              placeholder="Enter service type..."
              value={newServiceType}
              onChange={(e) => setNewServiceType(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddServiceType()}
            />
            <button onClick={handleAddServiceType}>
              <Plus size={20} />
              Add Type
            </button>
          </div>
          <div className={styles.itemList}>
            {serviceTypes.map((type) => (
              <div key={type} className={styles.item}>
                <span>{type}</span>
                <button onClick={() => handleRemoveServiceType(type)}>
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
          <motion.button
            className={styles.saveBtn}
            onClick={handleSaveSettings}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Save size={20} />
            Save Settings
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
