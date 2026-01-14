import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  Award,
  Activity,
  BarChart3,
  PieChart
} from 'lucide-react';
import styles from './StatisticsPage.module.css';

const StatisticsPage = ({ onBack }) => {
  const [dateRange, setDateRange] = useState('today');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState(null);
  const [csoStats, setCsoStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:8000/api';

  useEffect(() => {
    loadStatistics();
  }, [dateRange, startDate, endDate]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const [dailyRes, waitTimeRes, csoCompRes] = await Promise.all([
        fetch(`${API_URL}/statistics/daily?start_date=${startDate}&end_date=${endDate}`),
        fetch(`${API_URL}/statistics/average-wait-time`),
        fetch(`${API_URL}/statistics/cso-comparison?start_date=${startDate}&end_date=${endDate}`)
      ]);

      const [dailyData, waitTimeData, csoCompData] = await Promise.all([
        dailyRes.json(),
        waitTimeRes.json(),
        csoCompRes.json()
      ]);

      setStats({
        ...dailyData,
        wait_time: waitTimeData
      });
      setCsoStats(csoCompData);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const subDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    const today = new Date();
    
    switch (range) {
      case 'today':
        setStartDate(formatDate(today));
        setEndDate(formatDate(today));
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setStartDate(formatDate(yesterday));
        setEndDate(formatDate(yesterday));
        break;
      case 'week':
        setStartDate(formatDate(subDays(today, 7)));
        setEndDate(formatDate(today));
        break;
      case 'month':
        setStartDate(formatDate(subDays(today, 30)));
        setEndDate(formatDate(today));
        break;
      default:
        break;
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Activity size={48} className={styles.spinner} />
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Admin
        </button>
        <h1>Queue Statistics & Analytics</h1>
      </div>

      {/* Date Range Filter */}
      <div className={styles.filterSection}>
        <div className={styles.dateRangeButtons}>
          <button
            className={dateRange === 'today' ? styles.active : ''}
            onClick={() => handleDateRangeChange('today')}
          >
            Today
          </button>
          <button
            className={dateRange === 'yesterday' ? styles.active : ''}
            onClick={() => handleDateRangeChange('yesterday')}
          >
            Yesterday
          </button>
          <button
            className={dateRange === 'week' ? styles.active : ''}
            onClick={() => handleDateRangeChange('week')}
          >
            Last 7 Days
          </button>
          <button
            className={dateRange === 'month' ? styles.active : ''}
            onClick={() => handleDateRangeChange('month')}
          >
            Last 30 Days
          </button>
          <button
            className={dateRange === 'custom' ? styles.active : ''}
            onClick={() => setDateRange('custom')}
          >
            Custom
          </button>
        </div>

        {dateRange === 'custom' && (
          <div className={styles.customDateInputs}>
            <div className={styles.dateInput}>
              <Calendar size={18} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <span>to</span>
            <div className={styles.dateInput}>
              <Calendar size={18} />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button className={styles.applyBtn} onClick={loadStatistics}>
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Overview Stats */}
      <div className={styles.statsGrid}>
        <motion.div
          className={styles.statCard}
          style={{ '--card-color': 'var(--electric-blue)' }}
          whileHover={{ y: -4 }}
        >
          <div className={styles.statIcon}>
            <Users size={32} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats?.total_queues || 0}</div>
            <div className={styles.statLabel}>Total Queues</div>
          </div>
        </motion.div>

        <motion.div
          className={styles.statCard}
          style={{ '--card-color': 'var(--success)' }}
          whileHover={{ y: -4 }}
        >
          <div className={styles.statIcon}>
            <TrendingUp size={32} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats?.completed || 0}</div>
            <div className={styles.statLabel}>Completed</div>
            <div className={styles.statPercentage}>
              {stats?.total_queues > 0 
                ? `${Math.round((stats.completed / stats.total_queues) * 100)}%`
                : '0%'}
            </div>
          </div>
        </motion.div>

        <motion.div
          className={styles.statCard}
          style={{ '--card-color': 'var(--warning)' }}
          whileHover={{ y: -4 }}
        >
          <div className={styles.statIcon}>
            <Clock size={32} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {formatDuration(stats?.average_service_time)}
            </div>
            <div className={styles.statLabel}>Avg Service Time</div>
          </div>
        </motion.div>

        <motion.div
          className={styles.statCard}
          style={{ '--card-color': 'var(--danger)' }}
          whileHover={{ y: -4 }}
        >
          <div className={styles.statIcon}>
            <Activity size={32} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {formatDuration(stats?.wait_time?.average_wait_time)}
            </div>
            <div className={styles.statLabel}>Avg Wait Time</div>
          </div>
        </motion.div>
      </div>

      {/* Queue Type Breakdown */}
      <div className={styles.section}>
        <h2>
          <PieChart size={24} />
          Queue Type Distribution
        </h2>
        <div className={styles.breakdownGrid}>
          <div className={styles.breakdownCard}>
            <div className={styles.breakdownLabel}>Walk-In</div>
            <div className={styles.breakdownValue}>{stats?.walk_in || 0}</div>
            <div className={styles.breakdownBar}>
              <div
                className={styles.breakdownFill}
                style={{
                  width: stats?.total_queues > 0
                    ? `${(stats.walk_in / stats.total_queues) * 100}%`
                    : '0%',
                  background: 'var(--success)'
                }}
              />
            </div>
          </div>

          <div className={styles.breakdownCard}>
            <div className={styles.breakdownLabel}>Appointment</div>
            <div className={styles.breakdownValue}>{stats?.appointment || 0}</div>
            <div className={styles.breakdownBar}>
              <div
                className={styles.breakdownFill}
                style={{
                  width: stats?.total_queues > 0
                    ? `${(stats.appointment / stats.total_queues) * 100}%`
                    : '0%',
                  background: 'var(--warning)'
                }}
              />
            </div>
          </div>

          <div className={styles.breakdownCard}>
            <div className={styles.breakdownLabel}>Cancelled</div>
            <div className={styles.breakdownValue}>{stats?.cancelled || 0}</div>
            <div className={styles.breakdownBar}>
              <div
                className={styles.breakdownFill}
                style={{
                  width: stats?.total_queues > 0
                    ? `${(stats.cancelled / stats.total_queues) * 100}%`
                    : '0%',
                  background: 'var(--danger)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Service Type Breakdown */}
      {stats?.service_type_breakdown && stats.service_type_breakdown.length > 0 && (
        <div className={styles.section}>
          <h2>
            <BarChart3 size={24} />
            Service Type Performance
          </h2>
          <div className={styles.serviceTypeTable}>
            <div className={styles.tableHeader}>
              <div>Service Type</div>
              <div>Total</div>
              <div>Avg Duration</div>
            </div>
            {stats.service_type_breakdown.map((service, idx) => (
              <div key={idx} className={styles.tableRow}>
                <div className={styles.serviceTypeName}>{service.service_type}</div>
                <div className={styles.serviceTypeCount}>{service.total}</div>
                <div className={styles.serviceTypeDuration}>
                  {formatDuration(service.avg_duration)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSO Performance */}
      <div className={styles.section}>
        <h2>
          <Award size={24} />
          CSO Performance
        </h2>
        <div className={styles.csoTable}>
          <div className={styles.tableHeader}>
            <div>CSO Name</div>
            <div>Counter</div>
            <div>Served</div>
            <div>Avg Time</div>
            <div>Total Time</div>
          </div>
          {csoStats.length > 0 ? (
            csoStats
              .sort((a, b) => b.total_served - a.total_served)
              .map((cso) => (
                <motion.div
                  key={cso.id}
                  className={styles.tableRow}
                  whileHover={{ backgroundColor: 'rgba(45, 212, 191, 0.05)' }}
                >
                  <div className={styles.csoName}>
                    {cso.cso_name || cso.name}
                  </div>
                  <div className={styles.csoCounter}>Counter {cso.counter_number}</div>
                  <div className={styles.csoServed}>
                    <span className={styles.badge}>{cso.total_served}</span>
                  </div>
                  <div className={styles.csoAvgTime}>
                    {formatDuration(cso.average_service_time)}
                  </div>
                  <div className={styles.csoTotalTime}>
                    {formatDuration(cso.total_service_time)}
                  </div>
                </motion.div>
              ))
          ) : (
            <div className={styles.emptyState}>
              <Users size={48} />
              <p>No CSO data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Hourly Breakdown */}
      {stats?.hourly_breakdown && stats.hourly_breakdown.length > 0 && (
        <div className={styles.section}>
          <h2>
            <Clock size={24} />
            Hourly Distribution
          </h2>
          <div className={styles.hourlyChart}>
            {stats.hourly_breakdown.map((hour) => (
              <div key={hour.hour} className={styles.hourlyBar}>
                <div
                  className={styles.hourlyFill}
                  style={{
                    height: `${(hour.total / Math.max(...stats.hourly_breakdown.map(h => h.total))) * 100}%`
                  }}
                  title={`${hour.total} queues`}
                />
                <div className={styles.hourlyLabel}>
                  {hour.hour}:00
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;