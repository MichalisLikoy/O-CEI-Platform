import {
  AlertCircle,
  Eye,
  LoaderCircle,
  MoreHorizontal,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getPortCalls } from '../../services/portCallsService';
import PortCallsMiniMap from './PortCallsMiniMap';

const MALTA_TIME_ZONE = 'Europe/Malta';

const PORT_CALL_TABS = [
  'Current',
  'Active',
  'Expected',
  'Departed',
];

/*
|--------------------------------------------------------------------------
| Date helpers
|--------------------------------------------------------------------------
*/

function hasDateValue(value) {
  if (value === null || value === undefined) {
    return false;
  }

  const normalizedValue = String(value)
    .trim()
    .toLowerCase();

  return (
    normalizedValue !== '' &&
    normalizedValue !== 'null' &&
    normalizedValue !== 'undefined' &&
    normalizedValue !== '0000-00-00' &&
    normalizedValue !== '0000-00-00 00:00:00'
  );
}

function parseDate(value) {
  if (!hasDateValue(value)) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDateTime(value) {
  const date = parseDate(value);

  if (!date) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: MALTA_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getMaltaDateKey(value) {
  const date =
    value instanceof Date
      ? value
      : parseDate(value);

  if (!date) {
    return null;
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MALTA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find(
    (part) => part.type === 'year',
  )?.value;

  const month = parts.find(
    (part) => part.type === 'month',
  )?.value;

  const day = parts.find(
    (part) => part.type === 'day',
  )?.value;

  if (!year || !month || !day) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

function isTodayInMalta(value) {
  const valueDateKey = getMaltaDateKey(value);
  const todayDateKey = getMaltaDateKey(new Date());

  return Boolean(
    valueDateKey &&
      todayDateKey &&
      valueDateKey === todayDateKey,
  );
}

/*
|--------------------------------------------------------------------------
| Status logic
|--------------------------------------------------------------------------
*/

function getPortCallStatus(portCall) {
  const hasAta = hasDateValue(portCall.ata);
  const hasAtd = hasDateValue(portCall.atd);

  if (hasAtd) {
    return 'Departed';
  }

  if (hasAta && !hasAtd) {
    return 'Active';
  }

  return 'Expected';
}

function isCurrentPortCall(portCall) {
  return (
    isTodayInMalta(portCall.eta) ||
    isTodayInMalta(portCall.ata) ||
    isTodayInMalta(portCall.etd) ||
    isTodayInMalta(portCall.atd)
  );
}

function matchesSelectedTab(portCall, selectedTab) {
  if (selectedTab === 'Current') {
    return isCurrentPortCall(portCall);
  }

  return getPortCallStatus(portCall) === selectedTab;
}

function getStatusClass(status) {
  if (status === 'Active') {
    return 'port-call-status port-call-status-active';
  }

  if (status === 'Departed') {
    return 'port-call-status port-call-status-departed';
  }

  return 'port-call-status port-call-status-expected';
}

function getSortTimestamp(portCall, activeTab) {
  let value;

  if (activeTab === 'Departed') {
    value =
      portCall.atd ||
      portCall.etd ||
      portCall.ata ||
      portCall.eta;
  } else if (activeTab === 'Active') {
    value =
      portCall.ata ||
      portCall.eta ||
      portCall.etd;
  } else {
    value =
      portCall.eta ||
      portCall.ata ||
      portCall.etd ||
      portCall.atd;
  }

  const date = parseDate(value);

  return date ? date.getTime() : 0;
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

function PortCallsPanel() {
  const navigate = useNavigate();

  const [portCalls, setPortCalls] = useState([]);
  const [activeTab, setActiveTab] =
    useState('Current');

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPortCalls() {
      try {
        setLoading(true);
        setError('');

        const data = await getPortCalls();

        setPortCalls(
          Array.isArray(data) ? data : [],
        );
      } catch (requestError) {
        console.error(requestError);

        setError(
          'Unable to load port calls from the O-CEI API.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadPortCalls();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Counts
  |--------------------------------------------------------------------------
  */

  const counts = useMemo(() => {
    return {
      Current: portCalls.filter(
        isCurrentPortCall,
      ).length,

      Active: portCalls.filter(
        (portCall) =>
          getPortCallStatus(portCall) ===
          'Active',
      ).length,

      Expected: portCalls.filter(
        (portCall) =>
          getPortCallStatus(portCall) ===
          'Expected',
      ).length,

      Departed: portCalls.filter(
        (portCall) =>
          getPortCallStatus(portCall) ===
          'Departed',
      ).length,
    };
  }, [portCalls]);

  /*
  |--------------------------------------------------------------------------
  | Filtering
  |--------------------------------------------------------------------------
  */

  const filteredPortCalls = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    const tabPortCalls = portCalls.filter(
      (portCall) =>
        matchesSelectedTab(
          portCall,
          activeTab,
        ),
    );

    return tabPortCalls
      .filter((portCall) => {
        if (!normalizedSearch) {
          return true;
        }

        const searchableValues = [
          portCall.vessel_name,
          portCall.mmsi,
          portCall.imo,
          portCall.term,
          portCall.berth,
          portCall.port,
        ];

        return searchableValues.some((value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(normalizedSearch),
        );
      })
      .sort((firstPortCall, secondPortCall) => {
        const firstTimestamp =
          getSortTimestamp(
            firstPortCall,
            activeTab,
          );

        const secondTimestamp =
          getSortTimestamp(
            secondPortCall,
            activeTab,
          );

        if (activeTab === 'Departed') {
          return (
            secondTimestamp - firstTimestamp
          );
        }

        return firstTimestamp - secondTimestamp;
      });
  }, [portCalls, activeTab, search]);

  function handleTabChange(tab) {
    setActiveTab(tab);
    setSearch('');
  }

  function openPortCallsPage() {
    navigate('/port-calls');
  }

  if (loading) {
    return (
      <div className="port-calls-state">
        <LoaderCircle
          className="port-calls-loading-icon"
          size={30}
        />

        <span>Loading port calls...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="port-calls-state port-calls-error">
        <AlertCircle size={30} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="port-calls-panel-content">
      {/*
      <div className="port-calls-tabs">
        {PORT_CALL_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={
              activeTab === tab
                ? 'port-calls-tab port-calls-tab-active'
                : 'port-calls-tab'
            }
            onClick={() =>
              handleTabChange(tab)
            }
          >
            {tab}
            <span>{counts[tab]}</span>
          </button>
        ))}
      </div>
      */}

      <PortCallsMiniMap />

      {/*

      <div className="port-calls-search">
        <Search size={16} />

        <input
          type="text"
          placeholder="Search vessel, MMSI, terminal or berth..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />
      </div>

      <div className="port-calls-table-wrapper">
        <table className="port-calls-table">
          <thead>
            <tr>
              <th>Vessel</th>
              <th>Terminal / Berth</th>
              <th>ETA</th>
              <th>ATA</th>
              <th>ETD</th>
              <th>ATD</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>

          <tbody key={activeTab}>
            {filteredPortCalls
              .slice(0, 5)
              .map((portCall) => {
                const status =
                  getPortCallStatus(portCall);

                return (
                  <tr
                    key={`${activeTab}-${portCall.id}`}
                  >
                    <td>
                      <strong>
                        {portCall.vessel_name ||
                          'Unknown vessel'}
                      </strong>

                      <span>
                        MMSI:{' '}
                        {portCall.mmsi || '—'}
                      </span>
                    </td>

                    <td>
                      <strong className="port-call-terminal">
                        {portCall.term || '—'}
                      </strong>

                      <span className="port-call-berth">
                        {portCall.port || '—'} ·
                        Berth{' '}
                        {portCall.berth || '—'}
                      </span>
                    </td>

                    <td>
                      {formatDateTime(
                        portCall.eta,
                      )}
                    </td>

                    <td>
                      {formatDateTime(
                        portCall.ata,
                      )}
                    </td>

                    <td>
                      {formatDateTime(
                        portCall.etd,
                      )}
                    </td>

                    <td>
                      {formatDateTime(
                        portCall.atd,
                      )}
                    </td>

                    <td>
                      <span
                        className={getStatusClass(
                          status,
                        )}
                      >
                        {status}
                      </span>
                    </td>

                    <td>
                      <div className="port-call-actions">
                        <button
                          type="button"
                          aria-label="View port call"
                          onClick={openPortCallsPage}
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          type="button"
                          aria-label="More actions"
                          onClick={openPortCallsPage}
                        >
                          <MoreHorizontal
                            size={15}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {filteredPortCalls.length === 0 && (
              <tr key={`${activeTab}-empty`}>
                <td
                  colSpan="8"
                  className="port-calls-empty"
                >
                  No{' '}
                  {activeTab.toLowerCase()}{' '}
                  port calls found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="port-calls-panel-footer">
        <span>
          Showing{' '}
          {Math.min(
            filteredPortCalls.length,
            5,
          )}{' '}
          of {filteredPortCalls.length}{' '}
          {activeTab.toLowerCase()} port calls
        </span>

        <button
          type="button"
          onClick={openPortCallsPage}
        >
          View all port calls
          <span>→</span>
        </button>
      </div>
      */}
      <div className="port-calls-panel-footer">
        <span>
         
        </span>

        <button
          type="button"
          onClick={openPortCallsPage}
        >
          View all port calls
          <span>→</span>
        </button>
      </div>
    </div>
    
  );
}

export default PortCallsPanel;