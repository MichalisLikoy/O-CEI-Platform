import {
  Anchor,
  BarChart3,
  Bell,
  Camera,
  LayoutDashboard,
  LogOut,
  Settings,
  Ship,
  Waves,
} from 'lucide-react';
import {
  NavLink,
  useNavigate,
} from 'react-router-dom';

import logo from '../../assets/o-cei.png';
import logo2 from '../../assets/V-DETECT.png';

const menuItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    label: 'Vessels',
    icon: Ship,
    path: '/vessels',
  },
  {
    label: 'Port Calls',
    icon: Anchor,
    path: '/port-calls',
  },
  {
    label: 'Consumption',
    icon: BarChart3,
    path: '/consumption',
  },
  {
    label: 'Live Camera',
    icon: Camera,
    path: '/live-camera',
  },
  //  {
  //    label: 'Alerts',
  //    icon: Bell,
  //    path: '/alerts',
  //  },
  //  {
  //    label: 'Settings',
  //    icon: Settings,
  //    path: '/settings',
  //  },
];

function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('ocei_authenticated');
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-content">
          <img
            src={logo}
            alt="O-CEI"
            className="sidebar-logo"
          />

          <span>Malta FreePort</span>
        </div>
      </div>

      <nav className="sidebar-navigation">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? 'sidebar-menu-item sidebar-menu-item-active'
                  : 'sidebar-menu-item'
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-vdetect">
        <img
          src={logo2}
          alt="V-DETECT"
          className="sidebar-vdetect-logo"
        />
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">A</div>

          <div>
            <strong>admin</strong>
            <span>Administrator</span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;