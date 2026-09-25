import {
  Activity,
  Anchor,
  BarChart3,
  Camera,
  Ship,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import ConsumptionPanel from '../components/consumption/ConsumptionPanel';
import LiveCameraPanel from '../components/liveCamera/LiveCameraPanel';
import PortCallsPanel from '../components/portCalls/PortCallsPanel';
import VesselsPanel from '../components/vessels/VesselsPanel';

import { getConsumption } from '../services/consumptionService';
import {
  getActivePortCalls,
  getPortCalls,
} from '../services/portCallsService';

const MALTA_TIME_ZONE = 'Europe/Malta';

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function hasValue(value) {
  if (value === null || value === undefined) {
    return false;
  }

  const normalizedValue = String(value)
    .trim()
    .toLowerCase();

  return (
    normalizedValue !== '' &&
    normalizedValue !== 'null' &&
    normalizedValue !== 'undefined'
  );
}

function parseDate(value) {
  if (!hasValue(value)) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
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
| Port Calls Today
|--------------------------------------------------------------------------
*/

function isExpectedPortCall(portCall) {
  return (
    isTodayInMalta(portCall.eta) &&
    !hasValue(portCall.ata) &&
    !hasValue(portCall.etd) &&
    !hasValue(portCall.atd)
  );
}

function isArrivedPortCall(portCall) {
  return (
    isTodayInMalta(portCall.eta) &&
    hasValue(portCall.ata)
  );
}

function isDepartedPortCall(portCall) {
  return (
    isTodayInMalta(portCall.eta) &&
    hasValue(portCall.etd)
  );
}

/*
|--------------------------------------------------------------------------
| Consumption Today
|--------------------------------------------------------------------------
*/

function isCurrentlyInPortConsumption(row) {
  return (
    hasValue(row.ata) &&
    !hasValue(row.atd)
  );
}
function formatEnergy(value) {
  const number = toNumber(value);

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(2)} GWh`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(2)} MWh`;
  }

  return `${number.toFixed(2)} kWh`;
}

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

function DashboardPage() {
  const [portCalls, setPortCalls] = useState([]);

  const [activePortCalls, setActivePortCalls] =
    useState([]);

  const [consumptionRows, setConsumptionRows] =
    useState([]);

  const [detectedVessels] = useState(0);

  const [summaryLoading, setSummaryLoading] =
    useState(true);

  const [summaryError, setSummaryError] =
    useState('');

  /*
  |--------------------------------------------------------------------------
  | Load Dashboard Data
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    async function loadSummaryData() {
      try {
        setSummaryLoading(true);
        setSummaryError('');

        const [
          portCallsResponse,
          activePortCallsResponse,
          consumptionResponse,
        ] = await Promise.all([
          getPortCalls(),
          getActivePortCalls(),
          getConsumption(),
        ]);

        setPortCalls(
          Array.isArray(portCallsResponse)
            ? portCallsResponse
            : [],
        );

        setActivePortCalls(
          Array.isArray(activePortCallsResponse)
            ? activePortCallsResponse
            : [],
        );

        setConsumptionRows(
          Array.isArray(consumptionResponse)
            ? consumptionResponse
            : [],
        );
      } catch (error) {
        console.error(
          'Unable to load dashboard summary:',
          error,
        );

        setSummaryError(
          'Unable to load dashboard summary.',
        );
      } finally {
        setSummaryLoading(false);
      }
    }

    loadSummaryData();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Dashboard Summary
  |--------------------------------------------------------------------------
  */

  const summary = useMemo(() => {
    /*
     * Port Calls Today
     */

    const expectedPortCalls = portCalls.filter(
      isExpectedPortCall,
    );

    const arrivedPortCalls = portCalls.filter(
      isArrivedPortCall,
    );

    const departedPortCalls = portCalls.filter(
      isDepartedPortCall,
    );

    const todayPortCallsCount =
      expectedPortCalls.length +
      arrivedPortCalls.length +
      departedPortCalls.length;

    /*
 * In-Port Estimated Energy
 *
 * Κρατάμε μόνο τα πλοία που έχουν φτάσει
 * και δεν έχουν ακόμη πραγματική αναχώρηση.
 */

    const inPortConsumptionRows =
      consumptionRows.filter(
        isCurrentlyInPortConsumption,
      );

    const inPortEstimatedEnergy =
      inPortConsumptionRows.reduce(
        (total, row) => {
          return (
            total +
            toNumber(row.est_consumption)
          );
        },
        0,
      );
    /*
     * Summary
     */

    return {
      activeVessels: activePortCalls.length,
      portCallsToday: todayPortCallsCount,
      inPortEstimatedEnergy,
      detectedVessels,
    };
  }, [
    portCalls,
    activePortCalls,
    consumptionRows,
    detectedVessels,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Summary Cards
  |--------------------------------------------------------------------------
  */

  const summaryItems = [
    {
      label: 'Active Vessels',
      value: summaryLoading
        ? '—'
        : String(summary.activeVessels),
      icon: Ship,
    },
    {
      label: 'Port Calls Today',
      value: summaryLoading
        ? '—'
        : String(summary.portCallsToday),
      icon: Anchor,
    },
    {
      label: 'In-Port Estimated Energy',
      value: summaryLoading
        ? '—'
        : formatEnergy(
          summary.inPortEstimatedEnergy,
        ),
      icon: BarChart3,
    },
    {
      label: 'Detected Vessels',
      value: summaryLoading
        ? '—'
        : String(summary.detectedVessels),
      icon: Activity,
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="dashboard-page">
      {summaryError && (
        <div className="dashboard-summary-error">
          {summaryError}
        </div>
      )}

      <section className="summary-grid">
        {summaryItems.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.label}
              className="summary-card"
            >
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>

              <div className="summary-card-icon">
                <Icon size={23} />
              </div>
            </article>
          );
        })}
      </section>

      <section className="dashboard-grid">

        {/* Consumption */}
        <article className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="panel-number">
                01
              </span>

              <h3>Consumption</h3>
            </div>

            <BarChart3 size={22} />
          </div>

          <ConsumptionPanel />
        </article>

        {/* Port Calls */}
        <article className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="panel-number">
                02
              </span>

              <h3>Port Calls</h3>
            </div>

            <Anchor size={22} />
          </div>

          <PortCallsPanel />
        </article>

        {/* Vessels */}
        <article className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="panel-number">
                03
              </span>

              <h3>Vessels in Malta Port</h3>
            </div>

            <Ship size={22} />
          </div>

          <VesselsPanel />
        </article>

        {/* Live Camera */}
        <article className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="panel-number">
                04
              </span>

              <h3>
                Live Camera & Classification
              </h3>
            </div>

            <Camera size={22} />
          </div>

          <LiveCameraPanel />
        </article>

      </section>
    </div>
  );
}

export default DashboardPage;