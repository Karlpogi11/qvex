import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from './store';
import HomePage from './pages/HomePage';
import ReceptionPage from './pages/ReceptionPage';
import CsoPage from './pages/CsoPage';
import DisplayPage from './pages/DisplayPage';
import AdminPage from './pages/AdminPage';
import NotificationContainer from './components/common/NotificationContainer';
import './styles/global.css';



//initPrinter(); // init once on app start

function App() {
  const { theme, setTheme } = useAppStore();

  useEffect(() => {
    // Initialize theme
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/reception" element={<ReceptionPage />} />
          <Route path="/cso/:csoId" element={<CsoPage />} />
          <Route path="/display" element={<DisplayPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
        <NotificationContainer />
      </div>
    </Router>
  );
}

export default App;
