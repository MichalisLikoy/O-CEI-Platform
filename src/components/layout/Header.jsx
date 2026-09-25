import { useEffect, useState } from 'react';
import { Bell, CalendarDays, Clock3 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

function Header() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const location = useLocation();

  const pageTitles = {
  '/dashboard': 'Dashboard',
  '/vessels': 'Vessels',
  '/port-calls': 'Port Calls',
  '/consumption': 'Consumption',
  '/live-camera': 'Live Camera',
  '/alerts': 'Alerts',
  '/settings': 'Settings',
};

const pageTitle = pageTitles[location.pathname] || 'Dashboard';

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = currentDateTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="dashboard-header">
      <div>
        <p className="dashboard-header-eyebrow">
          Energy demand / prediction system
        </p>

        <h2>{pageTitle}</h2>
      </div>

      <div className="dashboard-header-actions">
        <div className="header-info">
          <CalendarDays size={17} />
          <span>{formattedDate}</span>
        </div>

        <div className="header-info">
          <Clock3 size={17} />
          <span>{formattedTime}</span>
        </div>
        {/*
        <button
          type="button"
          className="header-icon-button"
          aria-label="Notifications"
        >
          
          <Bell size={19} />
          <span className="notification-dot" />
          
        </button>
        */}
      </div>
    </header>
  );
}

export default Header;