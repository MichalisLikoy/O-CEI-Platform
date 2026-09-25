import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CircleAlert,
  Info,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const alerts = [
  {
    id: 1,
    title: 'High energy consumption detected',
    message:
      'The calculated energy consumption is significantly higher than the ML prediction.',
    severity: 'Critical',
    source: 'Consumption',
    vessel: 'MSC CARLOTTA',
    status: 'Open',
    timestamp: '14/07/2026 11:40',
  },
  {
    id: 2,
    title: 'Vessel classification confidence below threshold',
    message:
      'The vessel classification model returned a confidence score below 70%.',
    severity: 'Warning',
    source: 'Live Camera',
    vessel: 'Unknown vessel',
    status: 'Open',
    timestamp: '14/07/2026 11:32',
  },
  {
    id: 3,
    title: 'Port call departure detected',
    message:
      'The backend recorded an ATD value after the vessel left the port area.',
    severity: 'Info',
    source: 'Port Calls',
    vessel: 'ELAURA',
    status: 'Resolved',
    timestamp: '14/07/2026 11:15',
  },
  {
    id: 4,
    title: 'Missing real consumption value',
    message:
      'No administrator-submitted real consumption value exists for this vessel.',
    severity: 'Warning',
    source: 'Consumption',
    vessel: 'NEPTUNE GLORY',
    status: 'Open',
    timestamp: '14/07/2026 10:55',
  },
];

const severityOptions = ['All', 'Critical', 'Warning', 'Info'];

function getSeverityClass(severity) {
  if (severity === 'Critical') {
    return 'alert-severity alert-severity-critical';
  }

  if (severity === 'Warning') {
    return 'alert-severity alert-severity-warning';
  }

  return 'alert-severity alert-severity-info';
}

function getSeverityIcon(severity) {
  if (severity === 'Critical') {
    return ShieldAlert;
  }

  if (severity === 'Warning') {
    return AlertTriangle;
  }

  return Info;
}

function AlertsPage() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const counts = useMemo(() => {
    return {
      total: alerts.length,
      open: alerts.filter((alert) => alert.status === 'Open').length,
      critical: alerts.filter(
        (alert) => alert.severity === 'Critical',
      ).length,
      resolved: alerts.filter(
        (alert) => alert.status === 'Resolved',
      ).length,
    };
  }, []);

  const filteredAlerts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return alerts.filter((alert) => {
      const matchesSearch =
        alert.title.toLowerCase().includes(normalizedSearch) ||
        alert.message.toLowerCase().includes(normalizedSearch) ||
        alert.vessel.toLowerCase().includes(normalizedSearch) ||
        alert.source.toLowerCase().includes(normalizedSearch);

      const matchesSeverity =
        severityFilter === 'All' ||
        alert.severity === severityFilter;

      const matchesStatus =
        statusFilter === 'All' ||
        alert.status === statusFilter;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [search, severityFilter, statusFilter]);

  return (
    <div className="page-content">
      <div className="page-heading alerts-page-heading">
        <div>
          <span className="page-eyebrow">System monitoring</span>

          
          {/* <h1>Alerts</h1> */}

          <p>
            Review operational warnings, model events and system notifications.
          </p>
        </div>
      </div>

      <section className="alerts-page-summary">
        <article>
          <Bell size={21} />
          <div>
            <span>Total alerts</span>
            <strong>{counts.total}</strong>
          </div>
        </article>

        <article>
          <CircleAlert size={21} />
          <div>
            <span>Open alerts</span>
            <strong>{counts.open}</strong>
          </div>
        </article>

        <article>
          <ShieldAlert size={21} />
          <div>
            <span>Critical</span>
            <strong>{counts.critical}</strong>
          </div>
        </article>

        <article>
          <CheckCircle2 size={21} />
          <div>
            <span>Resolved</span>
            <strong>{counts.resolved}</strong>
          </div>
        </article>
      </section>

      <section className="full-page-panel alerts-full-panel">
        <div className="alerts-toolbar">
          <div className="alerts-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search alert, vessel or source..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={severityFilter}
            onChange={(event) =>
              setSeverityFilter(event.target.value)
            }
          >
            {severityOptions.map((severity) => (
              <option key={severity} value={severity}>
                {severity === 'All'
                  ? 'All severities'
                  : severity}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="All">All statuses</option>
            <option value="Open">Open</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div className="full-table-wrapper">
          <table className="full-alerts-table">
            <thead>
              <tr>
                <th>Alert</th>
                <th>Severity</th>
                <th>Source</th>
                <th>Vessel</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {filteredAlerts.map((alert) => {
                const SeverityIcon = getSeverityIcon(
                  alert.severity,
                );

                return (
                  <tr key={alert.id}>
                    <td>
                      <div className="alert-title-cell">
                        <div>
                          <SeverityIcon size={18} />
                        </div>

                        <div>
                          <strong>{alert.title}</strong>
                          <span>{alert.message}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={getSeverityClass(
                          alert.severity,
                        )}
                      >
                        {alert.severity}
                      </span>
                    </td>

                    <td>{alert.source}</td>
                    <td>{alert.vessel}</td>

                    <td>
                      <span
                        className={
                          alert.status === 'Resolved'
                            ? 'alert-status alert-status-resolved'
                            : 'alert-status alert-status-open'
                        }
                      >
                        {alert.status}
                      </span>
                    </td>

                    <td>{alert.timestamp}</td>

                    <td>
                      <button
                        type="button"
                        className="table-view-button"
                        onClick={() =>
                          setSelectedAlert(alert)
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredAlerts.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="full-table-empty"
                  >
                    No alerts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedAlert && (
        <>
          <button
            type="button"
            className="drawer-backdrop"
            aria-label="Close alert details"
            onClick={() => setSelectedAlert(null)}
          />

          <aside className="vessel-drawer">
            <div className="vessel-drawer-header">
              <div>
                <span>Alert details</span>
                <h2>{selectedAlert.title}</h2>
              </div>

              <button
                type="button"
                className="drawer-close-button"
                aria-label="Close alert details"
                onClick={() => setSelectedAlert(null)}
              >
                <X size={19} />
              </button>
            </div>

            <div className="vessel-drawer-identity">
              <div className="vessel-drawer-icon">
                <AlertTriangle size={28} />
              </div>

              <div>
                <strong>{selectedAlert.severity}</strong>
                <span>{selectedAlert.status}</span>
              </div>
            </div>

            <div className="vessel-drawer-section">
              <h3>Details</h3>

              <div className="alert-drawer-message">
                {selectedAlert.message}
              </div>
            </div>

            <div className="vessel-drawer-section">
              <h3>Context</h3>

              <div className="vessel-details-grid">
                <div>
                  <span>Source</span>
                  <strong>{selectedAlert.source}</strong>
                </div>

                <div>
                  <span>Vessel</span>
                  <strong>{selectedAlert.vessel}</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>{selectedAlert.status}</strong>
                </div>

                <div>
                  <span>Timestamp</span>
                  <strong>{selectedAlert.timestamp}</strong>
                </div>
              </div>
            </div>

            <div className="vessel-drawer-footer">
              <button
                type="button"
                className="drawer-secondary-button"
                onClick={() => setSelectedAlert(null)}
              >
                Close
              </button>

              <button
                type="button"
                className="drawer-primary-button"
                disabled
              >
                Mark as resolved
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

export default AlertsPage;