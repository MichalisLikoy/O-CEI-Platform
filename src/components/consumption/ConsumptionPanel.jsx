import {
  AlertCircle,
  BarChart3,
  Cloud,
  Gauge,
  LoaderCircle,
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
} from '../../services/consumptionService';

import {
  getActivePortCalls,
} from '../../services/portCallsService';

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

function formatCo2(value) {
  const number = toNumber(value);

  return `${number.toLocaleString(
    'en-US',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )} t`;
}

function formatAxisEnergy(value) {
  const number = toNumber(value);

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

/*
|--------------------------------------------------------------------------
| Chart Tooltip
|--------------------------------------------------------------------------
|
| Το chart πλέον έχει μόνο Estimated Consumption.
|
| Το CO₂ δεν σχεδιάζεται σαν δεύτερη γραμμή,
| επειδή έχει διαφορετική μονάδα μέτρησης.
|
| Εμφανίζεται όμως στο tooltip για κάθε vessel.
|--------------------------------------------------------------------------
*/

function CustomTooltip({
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

  const chartRow =
    payload[0]?.payload;

  if (!chartRow) {
    return null;
  }

  return (
    <div className="consumption-chart-tooltip">

      <strong>
        {label}
      </strong>

      <div>
        <span>
          Estimated
        </span>

        <strong>
          {formatEnergy(
            chartRow.estimated,
          )}
        </strong>
      </div>

      <div>
        <span>
          CO₂
        </span>

        <strong>
          {formatCo2(
            chartRow.co2,
          )}
        </strong>
      </div>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Consumption Panel
|--------------------------------------------------------------------------
*/

function ConsumptionPanel() {
  /*
   * Consumption API data
   */
  const [
    consumptionRows,
    setConsumptionRows,
  ] = useState([]);

  /*
   * Active Port Calls API data
   */
  const [
    activePortCalls,
    setActivePortCalls,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  /*
  |--------------------------------------------------------------------------
  | Load Data
  |--------------------------------------------------------------------------
  |
  | Load:
  |
  | 1. Consumption records
  | 2. Active port calls
  |
  | Active port calls are the source of truth
  | for vessels currently in port.
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError('');

        const [
          consumptionData,
          activePortCallsData,
        ] = await Promise.all([
          getConsumption(),
          getActivePortCalls(),
        ]);

        setConsumptionRows(
          Array.isArray(
            consumptionData,
          )
            ? consumptionData
            : [],
        );

        setActivePortCalls(
          Array.isArray(
            activePortCallsData,
          )
            ? activePortCallsData
            : [],
        );
      } catch (
        requestError
      ) {
        console.error(
          requestError,
        );

        setError(
          'Unable to load consumption data from the O-CEI API.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Active Port Call IDs
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | Active API:
  | id = 120
  | id = 125
  |
  | Consumption:
  | port_call_id = 120
  | port_call_id = 125
  |
  | These are the records displayed by the panel.
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
  | Currently In Port Consumption Records
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | We do NOT calculate active status using ATA / ATD here.
  |
  | We use exactly the same Active Port Calls API
  | used elsewhere in O-CEI.
  |--------------------------------------------------------------------------
  */

  const activeRows =
    useMemo(() => {
      return consumptionRows.filter(
        (row) => {
          if (
            !hasValue(
              row.port_call_id,
            )
          ) {
            return false;
          }

          return activePortCallIds.has(
            String(
              row.port_call_id,
            ),
          );
        },
      );
    }, [
      consumptionRows,
      activePortCallIds,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Totals
  |--------------------------------------------------------------------------
  |
  | Totals are calculated ONLY from
  | vessels currently in port.
  |--------------------------------------------------------------------------
  */

  const totals = useMemo(() => {
    return activeRows.reduce(
      (result, row) => {
        const estimated =
          toNumber(
            row.est_consumption,
          );

        /*
         * Total Consumption:
         *
         * If administrator has submitted
         * real consumption -> use real.
         *
         * Otherwise -> use estimated.
         */
        const totalConsumption =
          hasValue(
            row.real_consumption,
          )
            ? toNumber(
                row.real_consumption,
              )
            : estimated;

        result.totalConsumption +=
          totalConsumption;

        result.estimated +=
          estimated;

        result.co2 +=
          toNumber(
            row.co2,
          );

        return result;
      },
      {
        totalConsumption: 0,
        estimated: 0,
        co2: 0,
      },
    );
  }, [activeRows]);

  /*
  |--------------------------------------------------------------------------
  | Chart Data
  |--------------------------------------------------------------------------
  |
  | ML Prediction has been removed.
  |
  | Chart contains:
  |
  | - Estimated consumption
  |
  | Tooltip contains:
  |
  | - Estimated consumption
  | - CO₂
  |--------------------------------------------------------------------------
  */

  const chartData = useMemo(() => {
    return activeRows.map(
      (row) => ({
        id: row.id,

        vesselName:
          row.vessel_name ||
          `MMSI ${
            row.mmsi ||
            'Unknown'
          }`,

        vesselType:
          row.vessel_type,

        estimated:
          toNumber(
            row.est_consumption,
          ),

        co2:
          toNumber(
            row.co2,
          ),

        realConsumption:
          hasValue(
            row.real_consumption,
          )
            ? toNumber(
                row.real_consumption,
              )
            : null,

        eta: row.eta,

        ata: row.ata,

        etd: row.etd,

        atd: row.atd,

        portCallId:
          row.port_call_id,
      }),
    );
  }, [activeRows]);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="consumption-state">

        <LoaderCircle
          className="consumption-loading-icon"
          size={30}
        />

        <span>
          Loading consumption data...
        </span>

      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <div className="consumption-state consumption-error">

        <AlertCircle
          size={30}
        />

        <span>
          {error}
        </span>

      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="consumption-panel-content">

      {/* Header */}

      <div className="consumption-panel-topbar">

        <div>
          <span className="consumption-panel-subtitle">
            Currently in port energy overview
          </span>
        </div>

        <span className="consumption-chart-records">
          {activeRows.length}{' '}

          {activeRows.length === 1
            ? 'vessel'
            : 'vessels'}{' '}

          in port
        </span>

      </div>

      {/* Summary Cards */}

      <div className="consumption-summary-grid">

        {/* Total Consumption */}

        <article className="consumption-summary-card">

          <div className="consumption-summary-icon">
            <BarChart3
              size={18}
            />
          </div>

          <div>
            <span>
              Total Consumption
            </span>

            <strong>
              {formatEnergy(
                totals.totalConsumption,
              )}
            </strong>
          </div>

        </article>

        {/* Estimated */}

        <article className="consumption-summary-card">

          <div className="consumption-summary-icon">
            <Gauge
              size={18}
            />
          </div>

          <div>
            <span>
              Estimated
            </span>

            <strong>
              {formatEnergy(
                totals.estimated,
              )}
            </strong>
          </div>

        </article>

        {/* CO2 */}

        <article className="consumption-summary-card">

          <div className="consumption-summary-icon">
            <Cloud
              size={18}
            />
          </div>

          <div>
            <span>
              Total CO₂
            </span>

            <strong>
              {formatCo2(
                totals.co2,
              )}
            </strong>
          </div>

        </article>

      </div>

      {/* Chart */}

      <div className="consumption-chart-container">

        <div className="consumption-chart-header">

          <div>
            <span>
              Vessels currently in port
            </span>

            <strong>
              Estimated Consumption
            </strong>
          </div>

          <span className="consumption-chart-records">
            {chartData.length}{' '}

            {chartData.length === 1
              ? 'vessel'
              : 'vessels'}
          </span>

        </div>

        {chartData.length === 0 ? (
          <div className="consumption-chart-empty">
            No consumption data available
            for vessels currently in port.
          </div>
        ) : (
          <div className="consumption-chart">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 12,
                  bottom: 0,
                  left: 0,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(125, 150, 180, 0.12)"
                  vertical={false}
                />

                <XAxis
                  dataKey="vesselName"
                  stroke="#71849d"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  minTickGap={20}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={70}
                />

                <YAxis
                  yAxisId="energy"
                  stroke="#71849d"
                  tickLine={false}
                  axisLine={false}
                  fontSize={9}
                  tickFormatter={
                    formatAxisEnergy
                  }
                  width={45}
                />

                <Tooltip
                  content={
                    <CustomTooltip />
                  }
                />

                {/* Estimated Consumption Only */}

                <Line
                  yAxisId="energy"
                  type="monotone"
                  dataKey="estimated"
                  name="Estimated"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>
        )}

      </div>

    </div>
  );
}

export default ConsumptionPanel;