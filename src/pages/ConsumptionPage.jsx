import {
  BarChart3,
  BrainCircuit,
  CalendarDays,
  Cloud,
  Gauge,
  LoaderCircle,
  RefreshCw,
  Save,
  Search,
  Ship,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  getConsumption,
  updateRealConsumption,
} from '../services/consumptionService';

import {
  getActivePortCalls,
} from '../services/portCallsService';

const PAGE_SIZE = 10;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function hasValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
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

function formatEnergy(value) {
  if (!hasValue(value)) {
    return '—';
  }

  const number = toNumber(value);

  if (number >= 1000000) {
    return `${(
      number / 1000000
    ).toFixed(2)} GWh`;
  }

  if (number >= 1000) {
    return `${(
      number / 1000
    ).toFixed(2)} MWh`;
  }

  return `${number.toFixed(2)} kWh`;
}

function formatEnergyExact(value) {
  if (!hasValue(value)) {
    return '—';
  }

  return `${toNumber(
    value,
  ).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} kWh`;
}

function normalizeRealConsumptionInput(value) {
  // Επιτρέπουμε digits και μία τελεία για decimals.
  // Τα commas θεωρούνται thousands separators.
  const cleaned = String(value)
    .replace(/,/g, '')
    .replace(/[^\d.]/g, '');

  const parts = cleaned.split('.');

  if (parts.length <= 1) {
    return parts[0];
  }

  return `${parts[0]}.${parts.slice(1).join('')}`;
}

function formatDurationHours(value) {
  if (!hasValue(value)) {
    return '—';
  }

  const totalMinutes = Math.max(
    0,
    Math.round(
      toNumber(value),
    ),
  );

  const hours =
    Math.floor(
      totalMinutes / 60,
    );

  const minutes =
    totalMinutes % 60;

  return `${hours} h ${minutes} min`;
}

function formatCo2(value) {
  if (!hasValue(value)) {
    return '—';
  }

  return `${toNumber(
    value,
  ).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })} t`;
}

function formatDateTime(value) {
  if (!hasValue(value)) {
    return '—';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'en-GB',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
}

function formatAxisEnergy(value) {
  const number =
    toNumber(value);

  if (number >= 1000000) {
    return `${(
      number / 1000000
    ).toFixed(1)}G`;
  }

  if (number >= 1000) {
    return `${(
      number / 1000
    ).toFixed(0)}k`;
  }

  return number.toFixed(0);
}

function formatAxisCo2(value) {
  const number = toNumber(value);

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}k`;
  }

  if (number >= 100) return number.toFixed(0);
  if (number >= 10) return number.toFixed(1);

  return number.toFixed(2);
}

function getTodayDateInput() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Malta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function getRowDate(row) {
  if (!hasValue(row?.date)) return null;
  return String(row.date).slice(0, 10);
}

function formatSelectedDate(value) {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function addDaysToDateKey(dateKey, days) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getDateKeysInRange(from, to) {
  if (!from || !to || from > to) return [];

  const result = [];
  let current = from;

  while (current <= to && result.length < 366) {
    result.push(current);
    current = addDaysToDateKey(current, 1);
  }

  return result;
}

function isRowInPortOnSnapshotDate(row) {
  const snapshotDate = getRowDate(row);
  if (!snapshotDate || !hasValue(row.ata)) return false;

  const start = new Date(`${snapshotDate}T00:00:00.000Z`);
  const end = new Date(`${snapshotDate}T23:59:59.999Z`);
  const ata = new Date(row.ata);

  if (Number.isNaN(ata.getTime()) || ata > end) return false;
  if (!hasValue(row.atd)) return true;

  const atd = new Date(row.atd);
  return !Number.isNaN(atd.getTime()) && atd >= start;
}

function isCompletedOnSnapshotDate(row) {
  const snapshotDate = getRowDate(row);
  if (!snapshotDate || !hasValue(row.atd)) return false;
  return String(row.atd).slice(0, 10) === snapshotDate;
}

function calculateDifference(
  reference,
  actual,
) {
  if (
    !hasValue(reference) ||
    !hasValue(actual)
  ) {
    return null;
  }

  const referenceValue =
    toNumber(reference);

  const actualValue =
    toNumber(actual);

  if (referenceValue === 0) {
    return null;
  }

  return (
    ((actualValue -
      referenceValue) /
      referenceValue) *
    100
  );
}

function getDifferenceClass(value) {
  if (value === null) {
    return '';
  }

  if (
    Math.abs(value) <= 10
  ) {
    return 'consumption-difference consumption-difference-good';
  }

  return 'consumption-difference consumption-difference-warning';
}

/*
|--------------------------------------------------------------------------
| Completed
|--------------------------------------------------------------------------
|
| Completed:
| ATA exists
| ATD exists
|--------------------------------------------------------------------------
*/

function isCompletedConsumption(row) {
  return (
    hasValue(row.ata) &&
    hasValue(row.atd)
  );
}

/*
|--------------------------------------------------------------------------
| Actual Port Stay
|--------------------------------------------------------------------------
*/

function calculateActualStayMinutes(
  row,
) {
  if (
    !hasValue(row.ata) ||
    !hasValue(row.atd)
  ) {
    return null;
  }

  const start =
    new Date(row.ata);

  const end =
    new Date(row.atd);

  if (
    Number.isNaN(
      start.getTime(),
    ) ||
    Number.isNaN(
      end.getTime(),
    )
  ) {
    return null;
  }

  const minutes =
    (end.getTime() -
      start.getTime()) /
    (1000 * 60);

  return Math.max(
    0,
    Math.round(minutes),
  );
}

/*
|--------------------------------------------------------------------------
| Chart Tooltip
|--------------------------------------------------------------------------
*/

function ConsumptionChartTooltip({
  active,
  payload,
  label,
}) {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  return (
    <div className="consumption-chart-tooltip">
      <strong>
        {label}
      </strong>

      {payload.map(
        (item) => (
          <div
            key={
              item.dataKey
            }
          >
            <span>
              {item.name}
            </span>

            <strong>
              {formatEnergyExact(
                item.value,
              )}
            </strong>
          </div>
        ),
      )}
    </div>
  );
}

function Co2ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="consumption-chart-tooltip">
      <strong>{label}</strong>

      {payload.map((item) => (
        <div key={item.dataKey}>
          <span>{item.name}</span>
          <strong>{formatCo2(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Consumption Page
|--------------------------------------------------------------------------
*/

function ConsumptionPage() {
  /*
   * Consumption records
   */
  const [
    rows,
    setRows,
  ] = useState([]);

  /*
   * Active port calls from:
   * /api/ocei/port_calls/active
   */
  const [
    activePortCalls,
    setActivePortCalls,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    sortOrder,
    setSortOrder,
  ] = useState(
    'estimated-desc',
  );

  /*
   * Default view:
   * Currently in port
   */
  const [
    statusFilter,
    setStatusFilter,
  ] = useState('in-port');

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    selectedRow,
    setSelectedRow,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    realConsumptionValue,
    setRealConsumptionValue,
  ] = useState('');

  const [
    updatingRealConsumption,
    setUpdatingRealConsumption,
  ] = useState(false);

  const [
    realConsumptionError,
    setRealConsumptionError,
  ] = useState('');

  const [
    realConsumptionSuccess,
    setRealConsumptionSuccess,
  ] = useState('');

  const today = getTodayDateInput();

  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  const tomorrow = addDaysToDateKey(today, 1);

  const [forecastOpen, setForecastOpen] = useState(false);
  const [forecastFrom, setForecastFrom] = useState(tomorrow);
  const [forecastTo, setForecastTo] = useState(tomorrow);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState('');
  const [forecastResult, setForecastResult] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Load Data
  |--------------------------------------------------------------------------
  |
  | Load:
  |
  | 1. Consumption
  | 2. Active Port Calls
  |
  | at the same time.
  |--------------------------------------------------------------------------
  */

  async function loadConsumption(
    from = dateFrom,
    to = dateTo,
  ) {
    try {
      setLoading(true);
      setError('');

      const isTodayOnly =
        from === today && to === today;

      const consumptionRequest =
        from === to
          ? getConsumption({ date: from })
          : getConsumption({ from, to });

      const [
        consumptionData,
        activePortCallsData,
      ] = await Promise.all([
        consumptionRequest,
        isTodayOnly
          ? getActivePortCalls()
          : Promise.resolve([]),
      ]);

      setRows(
        Array.isArray(consumptionData)
          ? consumptionData
          : [],
      );

      setActivePortCalls(
        Array.isArray(activePortCallsData)
          ? activePortCallsData
          : [],
      );
    } catch (requestError) {
      console.error(requestError);

      setError(
        'Unable to load consumption data for the selected period.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConsumption(today, today);
  }, []);

  async function generateEnergyForecast() {
    if (!forecastFrom || !forecastTo || forecastFrom > forecastTo) {
      setForecastError('Select a valid future date range.');
      return;
    }

    try {
      setForecastLoading(true);
      setForecastError('');

      // Use the previous 30 complete days as the historical reference window.
      const historyTo = addDaysToDateKey(today, -1);
      const historyFrom = addDaysToDateKey(historyTo, -29);

      const historicalData = await getConsumption({
        from: historyFrom,
        to: historyTo,
      });

      const historicalRows = Array.isArray(historicalData)
        ? historicalData
        : [];

      const byDay = new Map();

      historicalRows.forEach((row) => {
        const day = getRowDate(row);
        if (!day || !isRowInPortOnSnapshotDate(row)) return;

        if (!byDay.has(day)) {
          byDay.set(day, {
            date: day,
            vessels: new Set(),
            mlConsumption: 0,
          });
        }

        const item = byDay.get(day);
        const vesselKey = hasValue(row.port_call_id)
          ? `pc-${row.port_call_id}`
          : hasValue(row.mmsi)
            ? `mmsi-${row.mmsi}`
            : `row-${row.id}`;

        item.vessels.add(vesselKey);
        item.mlConsumption += toNumber(row.ml_est_consumption);
      });

      const allHistoricalDays = Array.from(byDay.values())
        .map((item) => ({
          date: item.date,
          vessels: item.vessels.size,
          mlConsumption: item.mlConsumption,
        }))
        .filter((item) => item.mlConsumption > 0);

      // Preferred scenario: approximately 7 vessels in port (6–8).
      let comparableDays = allHistoricalDays.filter(
        (item) => item.vessels >= 6 && item.vessels <= 8,
      );

      // Fallback: if the 30-day window has no 6–8 vessel day, use the
      // closest occupancy days to 7 so the forecast can still be produced.
      if (comparableDays.length === 0 && allHistoricalDays.length > 0) {
        const minimumDistance = Math.min(
          ...allHistoricalDays.map((item) =>
            Math.abs(item.vessels - 7),
          ),
        );

        comparableDays = allHistoricalDays.filter(
          (item) => Math.abs(item.vessels - 7) === minimumDistance,
        );
      }

      if (comparableDays.length === 0) {
        throw new Error(
          'No historical ML consumption data is available for the forecast.',
        );
      }

      const averageDailyMl =
        comparableDays.reduce(
          (sum, item) => sum + item.mlConsumption,
          0,
        ) / comparableDays.length;

      const averageVessels =
        comparableDays.reduce(
          (sum, item) => sum + item.vessels,
          0,
        ) / comparableDays.length;

      const futureDays = getDateKeysInRange(forecastFrom, forecastTo);

      // Preserve the real variation found in comparable historical days.
      // Each future day uses the daily SUM(ml_est_consumption) of a real
      // historical reference day with similar port occupancy.
      const historicalPattern = [...comparableDays].sort(
        (a, b) => a.date.localeCompare(b.date),
      );

      /*
       * Build a non-repeating deterministic forecast curve.
       *
       * We do NOT generate random consumption values.
       * Every future value stays inside the range observed in the
       * comparable historical ML days. The historical values are used
       * as anchors and we interpolate between different anchor pairs.
       *
       * This removes the obvious A-B-C-D-E repetition on long ranges,
       * while keeping the forecast tied to the real ml_est_consumption
       * values already recorded by the system.
       */
      const historicalValues = historicalPattern.map(
        (item) => item.mlConsumption,
      );

      const minHistoricalMl = Math.min(...historicalValues);
      const maxHistoricalMl = Math.max(...historicalValues);

      const chartData = futureDays.map((date, index) => {
        const patternLength = historicalValues.length;

        if (patternLength === 1) {
          return {
            date,
            label: formatSelectedDate(date),
            mlPrediction: historicalValues[0],
          };
        }

        // Two different deterministic positions through the historical set.
        // Because the steps differ, long forecast ranges do not repeat the
        // same short visible cycle.
        const firstPosition =
          (index * 1.61803398875) % patternLength;
        const secondPosition =
          (index * 2.41421356237 + 1) % patternLength;

        const firstIndex = Math.floor(firstPosition);
        const secondIndex = Math.floor(secondPosition);

        const nextFirstIndex =
          (firstIndex + 1) % patternLength;
        const nextSecondIndex =
          (secondIndex + 1) % patternLength;

        const firstFraction =
          firstPosition - firstIndex;
        const secondFraction =
          secondPosition - secondIndex;

        const firstInterpolated =
          historicalValues[firstIndex] +
          (
            historicalValues[nextFirstIndex] -
            historicalValues[firstIndex]
          ) *
          firstFraction;

        const secondInterpolated =
          historicalValues[secondIndex] +
          (
            historicalValues[nextSecondIndex] -
            historicalValues[secondIndex]
          ) *
          secondFraction;

        // Blend both historical trajectories. A small deterministic weight
        // movement prevents a mechanical repeated wave without introducing
        // random values.
        const blendWeight =
          0.35 +
          0.3 *
          (
            0.5 +
            0.5 * Math.sin(index * 0.73)
          );

        let mlPrediction =
          firstInterpolated * blendWeight +
          secondInterpolated * (1 - blendWeight);

        // Keep every forecast point inside the real historical range.
        mlPrediction = Math.max(
          minHistoricalMl,
          Math.min(maxHistoricalMl, mlPrediction),
        );

        return {
          date,
          label: formatSelectedDate(date),
          mlPrediction,
        };
      });

      const totalPrediction = chartData.reduce(
        (sum, item) => sum + item.mlPrediction,
        0,
      );

      const predictedDailyAverage =
        chartData.length > 0
          ? totalPrediction / chartData.length
          : 0;

      setForecastResult({
        comparableDays,
        averageDailyMl: predictedDailyAverage,
        averageVessels: Math.round(averageVessels),
        totalPrediction,
        futureDays: futureDays.length,
        chartData,
      });
    } catch (requestError) {
      console.error(requestError);
      setForecastResult(null);
      setForecastError(
        requestError?.message || 'Unable to generate energy forecast.',
      );
    } finally {
      setForecastLoading(false);
    }
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    sortOrder,
    statusFilter,
  ]);

  useEffect(() => {
    function handleKeyDown(
      event,
    ) {
      if (
        event.key ===
        'Escape'
      ) {
        setSelectedRow(
          null,
        );
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Active Port Call IDs
  |--------------------------------------------------------------------------
  |
  | This is the important part.
  |
  | If active API returns:
  |
  | id = 120
  | id = 125
  |
  | then only consumption rows with:
  |
  | port_call_id = 120
  | port_call_id = 125
  |
  | are considered "Currently in port".
  |--------------------------------------------------------------------------
  */

  const activePortCallIds =
    useMemo(() => {
      return new Set(
        activePortCalls
          .filter(
            (portCall) =>
              hasValue(
                portCall.id,
              ),
          )
          .map(
            (portCall) =>
              String(
                portCall.id,
              ),
          ),
      );
    }, [
      activePortCalls,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Currently In Port
  |--------------------------------------------------------------------------
  |
  | Source of truth:
  | ACTIVE PORT CALLS API
  |--------------------------------------------------------------------------
  */

  const isTodaySelection =
    dateFrom === today &&
    dateTo === today;

  const inPortRows =
    useMemo(() => {
      if (isTodaySelection) {
        return rows.filter((row) => {
          if (!hasValue(row.port_call_id)) {
            return false;
          }

          return activePortCallIds.has(
            String(row.port_call_id),
          );
        });
      }

      return rows.filter(
        isRowInPortOnSnapshotDate,
      );
    }, [
      rows,
      activePortCallIds,
      isTodaySelection,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Completed
  |--------------------------------------------------------------------------
  */

  const completedRows =
    useMemo(() => {
      if (isTodaySelection) {
        return rows.filter(
          isCompletedConsumption,
        );
      }

      return rows.filter(
        isCompletedOnSnapshotDate,
      );
    }, [rows, isTodaySelection]);

  /*
  |--------------------------------------------------------------------------
  | Status Counts
  |--------------------------------------------------------------------------
  | For a date range each daily snapshot contributes to the total.
  |--------------------------------------------------------------------------
  */

  const statusCounts =
    useMemo(() => ({
      'in-port': inPortRows.length,
      completed: completedRows.length,
    }), [inPortRows, completedRows]);

  /*
  |--------------------------------------------------------------------------
  | Status Filter
  |--------------------------------------------------------------------------
  */

  const statusFilteredRows =
    useMemo(() => {
      /*
       * ALL CONSUMPTION RECORDS
       *
       * Επιστρέφουμε ΟΛΑ τα records
       * ακριβώς όπως ήρθαν από:
       *
       * getConsumption()
       */
      if (statusFilter === 'all') {
        return rows;
      }

      /*
       * CURRENTLY IN PORT
       *
       * Μόνο τα port calls που υπάρχουν
       * στο Active Port Calls API.
       */
      if (statusFilter === 'in-port') {
        return inPortRows;
      }

      /*
       * COMPLETED
       *
       * ATA exists + ATD exists.
       */
      if (statusFilter === 'completed') {
        return completedRows;
      }

      return rows;
    }, [
      statusFilter,
      rows,
      inPortRows,
      completedRows,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Get Status
  |--------------------------------------------------------------------------
  */

  function getConsumptionStatus(
    row,
  ) {
    if (isTodaySelection) {
      if (
        hasValue(row.port_call_id) &&
        activePortCallIds.has(
          String(row.port_call_id),
        )
      ) {
        return 'in-port';
      }

      if (isCompletedConsumption(row)) {
        return 'completed';
      }

      return null;
    }

    if (isCompletedOnSnapshotDate(row)) {
      return 'completed';
    }

    if (isRowInPortOnSnapshotDate(row)) {
      return 'in-port';
    }

    return null;
  }

  function getConsumptionStatusLabel(
    row,
  ) {
    const status =
      getConsumptionStatus(
        row,
      );

    if (
      status === 'in-port'
    ) {
      return 'In Port';
    }

    if (
      status === 'completed'
    ) {
      return 'Completed';
    }

    return '—';
  }

  /*
  |--------------------------------------------------------------------------
  | Save Real Consumption
  |--------------------------------------------------------------------------
  */

  async function handleSaveRealConsumption() {
    if (
      !selectedRow?.id
    ) {
      setRealConsumptionError(
        'Consumption ID is missing.',
      );

      return;
    }

    if (
      realConsumptionValue ===
      null ||
      realConsumptionValue ===
      undefined ||
      String(
        realConsumptionValue,
      ).trim() === ''
    ) {
      setRealConsumptionError(
        'Real consumption is required.',
      );

      return;
    }

    const numericValue =
      Number(
        realConsumptionValue,
      );

    if (
      !Number.isFinite(
        numericValue,
      ) ||
      numericValue < 0
    ) {
      setRealConsumptionError(
        'Enter a valid non-negative consumption value.',
      );

      return;
    }

    try {
      setUpdatingRealConsumption(
        true,
      );

      setRealConsumptionError(
        '',
      );

      setRealConsumptionSuccess(
        '',
      );

      const response =
        await updateRealConsumption(
          selectedRow.id,
          numericValue,
        );

      const updatedConsumption =
        response?.consumption;

      if (
        !updatedConsumption
      ) {
        throw new Error(
          'The API did not return the updated record.',
        );
      }

      setSelectedRow(
        updatedConsumption,
      );

      setRows(
        (currentRows) =>
          currentRows.map(
            (row) =>
              String(
                row.id,
              ) ===
                String(
                  updatedConsumption.id,
                )
                ? updatedConsumption
                : row,
          ),
      );

      setRealConsumptionValue(
        String(
          updatedConsumption.real_consumption ??
          '',
        ),
      );

      setRealConsumptionSuccess(
        'Real consumption updated successfully.',
      );
    } catch (
    requestError
    ) {
      console.error(
        'Unable to update real consumption:',
        requestError,
      );

      setRealConsumptionError(
        requestError.message ||
        'Unable to update real consumption.',
      );
    } finally {
      setUpdatingRealConsumption(
        false,
      );
    }
  }

  function handleOpenConsumption(
    row,
  ) {
    setSelectedRow(row);

    setRealConsumptionValue(
      hasValue(
        row.real_consumption,
      )
        ? String(
          row.real_consumption,
        )
        : '',
    );

    setRealConsumptionError(
      '',
    );

    setRealConsumptionSuccess(
      '',
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Totals
  |--------------------------------------------------------------------------
  */

  const totals =
    useMemo(() => {
      return statusFilteredRows.reduce(
        (
          result,
          row,
        ) => {
          result.estimated +=
            toNumber(
              row.est_consumption,
            );

          result.co2 +=
            toNumber(
              row.co2,
            );

          return result;
        },
        {
          estimated: 0,
          co2: 0,
        },
      );
    }, [
      statusFilteredRows,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Chart
  |--------------------------------------------------------------------------
  */

  const chartData =
    useMemo(() => {
      if (dateFrom === dateTo) {
        return statusFilteredRows.map(
          (row) => ({
            id: row.id,
            label:
              row.vessel_name ||
              `MMSI ${row.mmsi || 'Unknown'}`,
            estimated:
              toNumber(row.est_consumption),
            co2:
              toNumber(row.co2),
            real: hasValue(row.real_consumption)
              ? toNumber(row.real_consumption)
              : null,
            status:
              getConsumptionStatus(row),
          }),
        );
      }

      const grouped = new Map();

      statusFilteredRows.forEach((row) => {
        const date = getRowDate(row);
        if (!date) return;

        if (!grouped.has(date)) {
          grouped.set(date, {
            id: date,
            date,
            label: formatSelectedDate(date),
            estimated: 0,
            co2: 0,
            records: 0,
          });
        }

        const day = grouped.get(date);
        day.estimated +=
          toNumber(row.est_consumption);
        day.co2 += toNumber(row.co2);
        day.records += 1;
      });

      return Array.from(grouped.values()).sort(
        (a, b) => a.date.localeCompare(b.date),
      );
    }, [
      statusFilteredRows,
      dateFrom,
      dateTo,
      activePortCallIds,
      isTodaySelection,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Search + Sorting
  |--------------------------------------------------------------------------
  */

  const filteredRows =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return statusFilteredRows
        .filter((row) => {
          const vesselName =
            row.vessel_name
              ?.toLowerCase() ||
            '';

          const vesselType =
            row.vessel_type
              ?.toLowerCase() ||
            '';

          const vesselSubtype =
            row.vessel_subtype
              ?.toLowerCase() ||
            '';

          const mmsi =
            String(
              row.mmsi ||
              '',
            );

          const imo =
            String(
              row.imo ||
              '',
            );

          const port =
            String(
              row.port ||
              '',
            ).toLowerCase();

          const terminal =
            String(
              row.term ||
              '',
            ).toLowerCase();

          return (
            vesselName.includes(
              normalizedSearch,
            ) ||
            vesselType.includes(
              normalizedSearch,
            ) ||
            vesselSubtype.includes(
              normalizedSearch,
            ) ||
            mmsi.includes(
              normalizedSearch,
            ) ||
            imo.includes(
              normalizedSearch,
            ) ||
            port.includes(
              normalizedSearch,
            ) ||
            terminal.includes(
              normalizedSearch,
            )
          );
        })
        .sort((a, b) => {
          if (
            sortOrder ===
            'estimated-desc'
          ) {
            return (
              toNumber(
                b.est_consumption,
              ) -
              toNumber(
                a.est_consumption,
              )
            );
          }

          if (
            sortOrder ===
            'ml-desc'
          ) {
            return (
              toNumber(
                b.ml_est_consumption,
              ) -
              toNumber(
                a.ml_est_consumption,
              )
            );
          }

          if (
            sortOrder ===
            'real-desc'
          ) {
            return (
              toNumber(
                b.real_consumption,
              ) -
              toNumber(
                a.real_consumption,
              )
            );
          }

          if (
            sortOrder ===
            'co2-desc'
          ) {
            return (
              toNumber(
                b.co2,
              ) -
              toNumber(
                a.co2,
              )
            );
          }

          if (
            sortOrder ===
            'duration-desc'
          ) {
            return (
              toNumber(
                b.duration_time,
              ) -
              toNumber(
                a.duration_time,
              )
            );
          }

          return String(
            a.vessel_name ||
            '',
          ).localeCompare(
            String(
              b.vessel_name ||
              '',
            ),
          );
        });
    }, [
      statusFilteredRows,
      search,
      sortOrder,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredRows.length /
        PAGE_SIZE,
      ),
    );

  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages,
    );

  const paginatedRows =
    filteredRows.slice(
      (safeCurrentPage -
        1) *
      PAGE_SIZE,

      safeCurrentPage *
      PAGE_SIZE,
    );

  /*
  |--------------------------------------------------------------------------
  | Filter Label
  |--------------------------------------------------------------------------
  */

  const selectedFilterLabel =
    {
      all:
        'All consumption records',

      'in-port':
        'Vessels currently in port',

      completed:
        'Completed port calls',
    }[statusFilter];

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="page-content">

      {/* Heading */}

      <div className="page-heading consumption-page-heading">
        <div>
          <span className="page-eyebrow">
            Energy monitoring
          </span>

          <p>
            Monitor energy
            consumption for vessels
            currently in port and
            completed port calls.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              border: '1px solid rgba(125, 150, 180, 0.18)',
              borderRadius: '10px',
              background: 'rgba(15, 30, 50, 0.55)',
            }}
          >
            <CalendarDays size={17} />

            <input
              aria-label="From date"
              type="date"
              value={dateFrom}
              max={today}
              onChange={(event) => {
                const value = event.target.value;
                setDateFrom(value);

                if (dateTo < value) {
                  setDateTo(value);
                }
              }}
              style={{
                border: 0,
                outline: 0,
                background: 'transparent',
                color: '#dbeafe',
                colorScheme: 'dark',
              }}
            />

            <span style={{ color: '#71849d' }}>→</span>

            <input
              aria-label="To date"
              type="date"
              value={dateTo}
              min={dateFrom}
              max={today}
              onChange={(event) =>
                setDateTo(event.target.value)
              }
              style={{
                border: 0,
                outline: 0,
                background: 'transparent',
                color: '#dbeafe',
                colorScheme: 'dark',
              }}
            />

            <button
              type="button"
              className="page-refresh-button"
              onClick={() =>
                loadConsumption(dateFrom, dateTo)
              }
              disabled={loading || !dateFrom || !dateTo}
            >
              Apply
            </button>
          </div>

          <button
            type="button"
            className="page-refresh-button"
            onClick={() => {
              setForecastOpen(true);
              setForecastError('');
            }}
          >
            <BrainCircuit size={16} />
            Energy Forecast
          </button>

          <button
            type="button"
            className="page-refresh-button"
            onClick={() =>
              loadConsumption(dateFrom, dateTo)
            }
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={
                loading ? 'button-icon-spin' : ''
              }
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Period */}

      <div className="consumption-page-period-bar">
        <span>
          Port call energy overview · {formatSelectedDate(dateFrom)}
          {dateFrom !== dateTo
            ? ` → ${formatSelectedDate(dateTo)}`
            : ''}
        </span>
      </div>

      {forecastOpen && (
        <section
          className="full-page-panel"
          style={{
            marginBottom: '18px',
            padding: '18px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <span className="page-eyebrow">
                ML- Consumption forecast
              </span>
              <h2 style={{ margin: '4px 0 6px' }}>
                Predicted Energy Demand
              </h2>
            </div>

            <button
              type="button"
              className="drawer-close-button"
              aria-label="Close energy forecast"
              onClick={() => setForecastOpen(false)}
            >
              <X size={19} />
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              marginTop: '18px',
              padding: '12px',
              border: '1px solid rgba(125, 150, 180, 0.18)',
              borderRadius: '10px',
              background: 'rgba(15, 30, 50, 0.45)',
            }}
          >
            <CalendarDays size={17} />

            <input
              aria-label="Forecast from date"
              type="date"
              value={forecastFrom}
              min={tomorrow}
              onChange={(event) => {
                const value = event.target.value;
                setForecastFrom(value);
                if (forecastTo < value) setForecastTo(value);
              }}
              style={{
                border: 0,
                outline: 0,
                background: 'transparent',
                color: '#dbeafe',
                colorScheme: 'dark',
              }}
            />

            <span style={{ color: '#71849d' }}>→</span>

            <input
              aria-label="Forecast to date"
              type="date"
              value={forecastTo}
              min={forecastFrom || tomorrow}
              onChange={(event) => setForecastTo(event.target.value)}
              style={{
                border: 0,
                outline: 0,
                background: 'transparent',
                color: '#dbeafe',
                colorScheme: 'dark',
              }}
            />

            <button
              type="button"
              className="page-refresh-button"
              onClick={generateEnergyForecast}
              disabled={
                forecastLoading || !forecastFrom || !forecastTo
              }
            >
              {forecastLoading ? (
                <LoaderCircle size={16} className="button-icon-spin" />
              ) : (
                <BrainCircuit size={16} />
              )}
              Generate Forecast
            </button>
          </div>

          {forecastError && (
            <div className="full-page-state full-page-error" style={{ marginTop: '14px' }}>
              <span>{forecastError}</span>
            </div>
          )}

          {forecastResult && !forecastError && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  marginTop: '18px',
                }}
              >
                <article style={{ padding: '14px', border: '1px solid rgba(125,150,180,.14)', borderRadius: '10px' }}>
                  <span style={{ color: '#71849d', fontSize: '12px' }}>Predicted total energy</span>
                  <strong style={{ display: 'block', marginTop: '6px', fontSize: '20px' }}>
                    {formatEnergy(forecastResult.totalPrediction)}
                  </strong>
                </article>

                <article style={{ padding: '14px', border: '1px solid rgba(125,150,180,.14)', borderRadius: '10px' }}>
                  <span style={{ color: '#71849d', fontSize: '12px' }}>Predicted energy / day</span>
                  <strong style={{ display: 'block', marginTop: '6px', fontSize: '20px' }}>
                    {formatEnergy(forecastResult.averageDailyMl)}
                  </strong>
                </article>

                <article style={{ padding: '14px', border: '1px solid rgba(125,150,180,.14)', borderRadius: '10px' }}>
                  <span style={{ color: '#71849d', fontSize: '12px' }}>Days Selected</span>
                  <strong style={{ display: 'block', marginTop: '6px', fontSize: '20px' }}>
                    {forecastResult.futureDays}
                  </strong>
                </article>


              </div>

              <div className="consumption-page-chart-header" style={{ marginTop: '22px' }}>
                <div>
                  <span>Future selected period</span>
                  <h2>ML Predicted Consumption</h2>
                </div>
                <strong>
                  {forecastResult.futureDays} {forecastResult.futureDays === 1 ? 'day' : 'days'}
                </strong>
              </div>

              <div className="consumption-page-chart" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={forecastResult.chartData}
                    margin={{ top: 12, right: 20, bottom: 4, left: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(125, 150, 180, 0.12)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      stroke="#71849d"
                      tickLine={false}
                      axisLine={false}
                      fontSize={10}
                      minTickGap={18}
                    />
                    <YAxis
                      stroke="#71849d"
                      tickLine={false}
                      axisLine={false}
                      fontSize={10}
                      tickFormatter={formatAxisEnergy}
                      width={55}
                    />
                    <Tooltip content={<ConsumptionChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="mlPrediction"
                      name="ML Prediction"
                      stroke="#fbbf24"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

            </>
          )}
        </section>
      )}

      {/* Summary */}

      <section className="consumption-page-summary">

        <article>
          <div className="consumption-page-summary-icon">
            <Gauge
              size={20}
            />
          </div>

          <div>
            <span>
              Currently in port
            </span>

            <strong>
              {
                statusCounts[
                'in-port'
                ]
              }
            </strong>
          </div>
        </article>

        <article>
          <div className="consumption-page-summary-icon">
            <BarChart3
              size={20}
            />
          </div>

          <div>
            <span>
              Completed calls
            </span>

            <strong>
              {
                statusCounts.completed
              }
            </strong>
          </div>
        </article>

        <article>
          <div className="consumption-page-summary-icon">
            <Zap
              size={20}
            />
          </div>

          <div>
            <span>
              Estimated energy
            </span>

            <strong>
              {formatEnergy(
                totals.estimated,
              )}
            </strong>
          </div>
        </article>

        <article>
          <div className="consumption-page-summary-icon">
            <Cloud size={20} />
          </div>

          <div>
            <span>Total CO₂</span>
            <strong>{formatCo2(totals.co2)}</strong>
          </div>
        </article>

      </section>

      {/* Estimated Consumption Chart */}

      <section className="full-page-panel consumption-page-chart-panel">
        <div className="consumption-page-chart-header">
          <div>
            <span>{selectedFilterLabel}</span>
            <h2>Estimated Consumption</h2>
          </div>

          <strong>
            {chartData.length}{' '}
            {dateFrom === dateTo ? 'records' : 'days'}
          </strong>
        </div>

        {loading ? (
          <div className="consumption-page-chart-empty">
            Loading chart data...
          </div>
        ) : chartData.length === 0 ? (
          <div className="consumption-page-chart-empty">
            No consumption data available for this period.
          </div>
        ) : (
          <div className="consumption-page-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 12, right: 20, bottom: 4, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(125, 150, 180, 0.12)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="#71849d"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  minTickGap={20}
                  interval={dateFrom === dateTo ? 0 : 'preserveStartEnd'}
                  angle={dateFrom === dateTo ? -20 : 0}
                  textAnchor={dateFrom === dateTo ? 'end' : 'middle'}
                  height={dateFrom === dateTo ? 70 : 35}
                />
                <YAxis
                  stroke="#71849d"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  tickFormatter={formatAxisEnergy}
                  width={55}
                />
                <Tooltip content={<ConsumptionChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="estimated"
                  name="Estimated"
                  stroke="#60a5fa"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* CO2 Chart */}

      <section className="full-page-panel consumption-page-chart-panel">
        <div className="consumption-page-chart-header">
          <div>
            <span>{selectedFilterLabel}</span>
            <h2>CO₂ Emissions</h2>
          </div>

          <strong>
            {chartData.length}{' '}
            {dateFrom === dateTo ? 'records' : 'days'}
          </strong>
        </div>

        {loading ? (
          <div className="consumption-page-chart-empty">
            Loading chart data...
          </div>
        ) : chartData.length === 0 ? (
          <div className="consumption-page-chart-empty">
            No CO₂ data available for this period.
          </div>
        ) : (
          <div className="consumption-page-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 12, right: 20, bottom: 4, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(125, 150, 180, 0.12)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="#71849d"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  minTickGap={20}
                  interval={dateFrom === dateTo ? 0 : 'preserveStartEnd'}
                  angle={dateFrom === dateTo ? -20 : 0}
                  textAnchor={dateFrom === dateTo ? 'end' : 'middle'}
                  height={dateFrom === dateTo ? 70 : 35}
                />
                <YAxis
                  stroke="#71849d"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  tickFormatter={formatAxisCo2}
                  width={55}
                />
                <Tooltip content={<Co2ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="co2"
                  name="CO₂"
                  stroke="#34d399"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Table */}

      <section className="full-page-panel consumption-full-panel">

        <div className="consumption-page-toolbar">

          <div className="consumption-page-search">
            <Search
              size={17}
            />

            <input
              type="text"
              placeholder="Search vessel, MMSI, IMO, type, port or terminal..."
              value={search}
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target
                    .value,
                )
              }
            />
          </div>

          {/* Status */}

          <select
            value={
              statusFilter
            }
            onChange={(
              event,
            ) =>
              setStatusFilter(
                event.target
                  .value,
              )
            }
          >
            <option value="all">
              All consumption
              records
            </option>

            <option value="in-port">
              Currently in port
            </option>

            <option value="completed">
              Completed
            </option>
          </select>

          {/* Sort */}

          <select
            value={
              sortOrder
            }
            onChange={(
              event,
            ) =>
              setSortOrder(
                event.target
                  .value,
              )
            }
          >
            <option value="estimated-desc">
              Highest calculated
              consumption
            </option>

            <option value="ml-desc">
              Highest ML prediction
            </option>

            <option value="real-desc">
              Highest real
              consumption
            </option>

            <option value="co2-desc">
              Highest CO₂
            </option>

            <option value="duration-desc">
              Longest duration
            </option>

            <option value="name-asc">
              Vessel A-Z
            </option>
          </select>

        </div>

        {loading && (
          <div className="full-page-state">
            <RefreshCw
              className="button-icon-spin"
              size={28}
            />

            <span>
              Loading consumption
              data...
            </span>
          </div>
        )}

        {!loading &&
          error && (
            <div className="full-page-state full-page-error">
              <span>
                {error}
              </span>
            </div>
          )}

        {!loading &&
          !error && (
            <>
              <div className="full-table-wrapper">

                <table className="full-consumption-table">

                  <thead>
                    <tr>
                      <th>
                        Vessel
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Port call
                      </th>

                      <th>
                        Duration
                      </th>

                      <th>
                        Calculated
                      </th>

                      <th>
                        ML prediction
                      </th>

                      <th>
                        Real
                      </th>

                      <th>
                        Real vs
                        calculated
                      </th>

                      <th>
                        CO₂
                      </th>

                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedRows.map(
                      (row) => {
                        const difference =
                          calculateDifference(
                            row.est_consumption,
                            row.real_consumption,
                          );

                        const status =
                          getConsumptionStatus(
                            row,
                          );

                        const actualStayMinutes =
                          calculateActualStayMinutes(
                            row,
                          );

                        const displayedDuration =
                          status ===
                            'completed' &&
                            actualStayMinutes !==
                            null
                            ? actualStayMinutes
                            : row.duration_time;

                        return (
                          <tr
                            key={
                              row.id
                            }
                          >

                            {/* Vessel */}

                            <td>
                              <div className="consumption-vessel-cell">

                                <div className="consumption-vessel-icon">
                                  <Ship
                                    size={
                                      17
                                    }
                                  />
                                </div>

                                <div>
                                  <strong>
                                    {row.vessel_name ||
                                      'Unknown vessel'}
                                  </strong>

                                  <span>
                                    {row.vessel_type ||
                                      '—'}{' '}
                                    · MMSI:{' '}
                                    {row.mmsi ||
                                      '—'}
                                  </span>
                                </div>

                              </div>
                            </td>

                            {/* Status */}

                            <td>
                              <span
                                className={`consumption-status consumption-status-${status}`}
                              >
                                {getConsumptionStatusLabel(
                                  row,
                                )}
                              </span>
                            </td>

                            {/* Port Call */}

                            <td>
                              <strong className="consumption-port-cell">
                                {row.term ||
                                  row.port ||
                                  '—'}
                              </strong>

                              <span className="consumption-port-subtext">
                                Port call
                                ID:{' '}
                                {row.port_call_id ||
                                  '—'}{' '}
                                · Berth{' '}
                                {row.berth ||
                                  '—'}
                              </span>
                            </td>

                            {/* Duration */}

                            <td>
                              <div>
                                {formatDurationHours(
                                  displayedDuration,
                                )}

                                {status ===
                                  'completed' && (
                                    <span className="consumption-port-subtext">
                                      Actual
                                      port
                                      stay
                                    </span>
                                  )}

                                {status ===
                                  'in-port' && (
                                    <span className="consumption-port-subtext">
                                      Vessel
                                      in port
                                    </span>
                                  )}
                              </div>
                            </td>

                            {/* Calculated */}

                            <td>
                              {formatEnergyExact(
                                row.est_consumption,
                              )}
                            </td>

                            {/* ML */}

                            <td>
                              {formatEnergyExact(
                                row.ml_est_consumption,
                              )}
                            </td>

                            {/* Real */}

                            <td>
                              {hasValue(
                                row.real_consumption,
                              ) ? (
                                formatEnergyExact(
                                  row.real_consumption,
                                )
                              ) : (
                                <span className="consumption-missing">
                                  Not
                                  submitted
                                </span>
                              )}
                            </td>

                            {/* Difference */}

                            <td>
                              {difference ===
                                null ? (
                                '—'
                              ) : (
                                <span
                                  className={getDifferenceClass(
                                    difference,
                                  )}
                                >
                                  {difference >
                                    0
                                    ? '+'
                                    : ''}

                                  {difference.toFixed(
                                    1,
                                  )}
                                  %
                                </span>
                              )}
                            </td>

                            {/* CO2 */}

                            <td>
                              {formatCo2(
                                row.co2,
                              )}
                            </td>

                            {/* View */}

                            <td>
                              <button
                                type="button"
                                className="table-view-button"
                                onClick={() =>
                                  handleOpenConsumption(
                                    row,
                                  )
                                }
                              >
                                View
                              </button>
                            </td>

                          </tr>
                        );
                      },
                    )}

                    {paginatedRows.length ===
                      0 && (
                        <tr>
                          <td
                            colSpan="10"
                            className="full-table-empty"
                          >
                            No
                            consumption
                            records
                            found.
                          </td>
                        </tr>
                      )}

                  </tbody>

                </table>

              </div>

              {/* Pagination */}

              <div className="table-pagination">

                <span>
                  Showing{' '}
                  {filteredRows.length ===
                    0
                    ? 0
                    : (safeCurrentPage -
                      1) *
                    PAGE_SIZE +
                    1}
                  –
                  {Math.min(
                    safeCurrentPage *
                    PAGE_SIZE,

                    filteredRows.length,
                  )}{' '}
                  of{' '}
                  {
                    filteredRows.length
                  }
                </span>

                <div>
                  <button
                    type="button"
                    disabled={
                      safeCurrentPage ===
                      1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (
                          page,
                        ) =>
                          page -
                          1,
                      )
                    }
                  >
                    Previous
                  </button>

                  <span>
                    Page{' '}
                    {
                      safeCurrentPage
                    }{' '}
                    of{' '}
                    {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      safeCurrentPage ===
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (
                          page,
                        ) =>
                          page +
                          1,
                      )
                    }
                  >
                    Next
                  </button>
                </div>

              </div>
            </>
          )}

      </section>

      {/* Drawer */}

      {selectedRow && (
        <>
          <button
            type="button"
            className="drawer-backdrop"
            aria-label="Close consumption details"
            onClick={() =>
              setSelectedRow(
                null,
              )
            }
          />

          <aside className="vessel-drawer">

            <div className="vessel-drawer-header">
              <div>
                <span>
                  Consumption
                  details
                </span>

                <h2>
                  {selectedRow.vessel_name ||
                    'Unknown vessel'}
                </h2>
              </div>

              <button
                type="button"
                className="drawer-close-button"
                aria-label="Close consumption details"
                onClick={() =>
                  setSelectedRow(
                    null,
                  )
                }
              >
                <X
                  size={19}
                />
              </button>
            </div>

            {/* Identity */}

            <div className="vessel-drawer-identity">

              <div className="vessel-drawer-icon">
                <Zap
                  size={28}
                />
              </div>

              <div>
                <strong>
                  {formatEnergyExact(
                    selectedRow.est_consumption,
                  )}
                </strong>

                <span>
                  Estimated energy
                  consumption
                </span>
              </div>

            </div>

            {/* Status */}

            <div className="vessel-drawer-section">

              <h3>
                Port call status
              </h3>

              <div className="vessel-details-grid">

                <div>
                  <span>
                    Status
                  </span>

                  <strong>
                    {getConsumptionStatusLabel(
                      selectedRow,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Duration
                  </span>

                  <strong>
                    {formatDurationHours(
                      getConsumptionStatus(
                        selectedRow,
                      ) ===
                        'completed'
                        ? calculateActualStayMinutes(
                          selectedRow,
                        )
                        : selectedRow.duration_time,
                    )}
                  </strong>
                </div>

              </div>

            </div>

            {/* Consumption */}

            <div className="vessel-drawer-section">

              <h3>
                Consumption
              </h3>

              <div className="vessel-details-grid">

                <div>
                  <span>
                    Calculated
                  </span>

                  <strong>
                    {formatEnergyExact(
                      selectedRow.est_consumption,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    ML prediction
                  </span>

                  <strong>
                    {formatEnergyExact(
                      selectedRow.ml_est_consumption,
                    )}
                  </strong>
                </div>

                <div className="real-consumption-edit-field">
                  <label htmlFor="real-consumption-input">
                    Real consumption (kWh)
                  </label>

                  <input
                    id="real-consumption-input"
                    type="text"
                    inputMode="decimal"
                    value={realConsumptionValue}
                    onChange={(event) => {
                      const normalizedValue =
                        normalizeRealConsumptionInput(event.target.value);

                      setRealConsumptionValue(normalizedValue);
                      setRealConsumptionError('');
                      setRealConsumptionSuccess('');
                    }}
                    placeholder="e.g. 15323.12"
                    disabled={updatingRealConsumption}
                  />

                  {realConsumptionValue !== '' &&
                    Number.isFinite(Number(realConsumptionValue)) && (
                      <span
                        style={{
                          display: 'block',
                          marginTop: '7px',
                          color: '#71849d',
                          fontSize: '12px',
                        }}
                      >
                       
                      </span>
                    )}
                </div>

                <div>
                  <span>
                    CO₂
                  </span>

                  <strong>
                    {formatCo2(
                      selectedRow.co2,
                    )}
                  </strong>
                </div>

              </div>

              {realConsumptionError && (
                <div className="real-consumption-message real-consumption-error">
                  {
                    realConsumptionError
                  }
                </div>
              )}

              {realConsumptionSuccess && (
                <div className="real-consumption-message real-consumption-success">
                  {
                    realConsumptionSuccess
                  }
                </div>
              )}

            </div>

            {/* Vessel */}

            <div className="vessel-drawer-section">

              <h3>
                Vessel
              </h3>

              <div className="vessel-details-grid">

                <div>
                  <span>
                    MMSI
                  </span>

                  <strong>
                    {selectedRow.mmsi ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>
                    IMO
                  </span>

                  <strong>
                    {selectedRow.imo ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>
                    Type
                  </span>

                  <strong>
                    {selectedRow.vessel_type ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>
                    Subtype
                  </span>

                  <strong>
                    {selectedRow.vessel_subtype ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>
                    Estimated TEU
                  </span>

                  <strong>
                    {selectedRow.estimated_teu ??
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>
                    GT
                  </span>

                  <strong>
                    {selectedRow.gt ??
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>
                    DW
                  </span>

                  <strong>
                    {selectedRow.dw ??
                      '—'}
                  </strong>
                </div>

              </div>

            </div>

            {/* Port Call */}

            <div className="vessel-drawer-section">

              <h3>
                Port call
              </h3>

              <div className="vessel-details-grid">

                <div>
                  <span>
                    Consumption ID
                  </span>

                  <strong>
                    {selectedRow.id ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>
                    Port call ID
                  </span>

                  <strong>
                    {selectedRow.port_call_id ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>
                    Port
                  </span>

                  <strong>
                    {selectedRow.port ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>
                    Terminal
                  </span>

                  <strong>
                    {selectedRow.term ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>
                    Berth
                  </span>

                  <strong>
                    {selectedRow.berth ||
                      '—'}
                  </strong>
                </div>

              </div>

            </div>

            {/* Timeline */}

            <div className="vessel-drawer-section">

              <h3>
                Timeline
              </h3>

              <div className="vessel-details-grid">

                <div>
                  <span>
                    ETA
                  </span>

                  <strong>
                    {formatDateTime(
                      selectedRow.eta,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    ATA
                  </span>

                  <strong>
                    {formatDateTime(
                      selectedRow.ata,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    ETD
                  </span>

                  <strong>
                    {formatDateTime(
                      selectedRow.etd,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    ATD
                  </span>

                  <strong>
                    {formatDateTime(
                      selectedRow.atd,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Estimate date
                  </span>

                  <strong>
                    {formatDateTime(
                      selectedRow.date,
                    )}
                  </strong>
                </div>

              </div>

            </div>

            {/* Footer */}

            <div className="vessel-drawer-footer">

              <button
                type="button"
                className="drawer-secondary-button"
                onClick={() =>
                  setSelectedRow(
                    null,
                  )
                }
                disabled={
                  updatingRealConsumption
                }
              >
                Close
              </button>

              <button
                type="button"
                className="drawer-primary-button"
                onClick={
                  handleSaveRealConsumption
                }
                disabled={
                  updatingRealConsumption
                }
              >
                {updatingRealConsumption ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="button-icon-spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Save
                      size={16}
                    />

                    Save real value
                  </>
                )}
              </button>

            </div>

          </aside>
        </>
      )}

    </div>
  );
}

export default ConsumptionPage;