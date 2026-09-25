import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import AlertsPage from './pages/AlertsPage';
import ConsumptionPage from './pages/ConsumptionPage';
import DashboardPage from './pages/DashboardPage';
import LiveCameraPage from './pages/LiveCameraPage';
import LoginPage from './pages/LoginPage';
import PortCallsPage from './pages/PortCallsPage';
import SettingsPage from './pages/SettingsPage';
import VesselsPage from './pages/VesselsPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/vessels" element={<VesselsPage />} />
        <Route path="/port-calls" element={<PortCallsPage />} />
        <Route path="/consumption" element={<ConsumptionPage />} />
        <Route path="/live-camera" element={<LiveCameraPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

export default App;