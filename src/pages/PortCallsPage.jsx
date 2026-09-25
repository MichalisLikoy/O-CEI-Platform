import {
  Anchor,
  Plus,
  CheckCircle2,
  LoaderCircle,
  Save,
  RefreshCw,
  Search,
  Ship,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  getPortCalls,
  getActivePortCalls,
  updatePortCallTimes,
} from '../services/portCallsService';

import FreeportVesselsMap from '../components/portCalls/FreeportVesselMap';
import AddPortCallModal from '../components/portCalls/AddPortCallModal';

const PAGE_SIZE = 10;
const MALTA_TIME_ZONE = 'Europe/Malta';

const PORT_CALL_TABS = [
  'Active',
  'Expected',
  'Arrived',
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

function getMaltaDateKey(value) {
  const date =
    value instanceof Date
      ? value
      : parseDate(value);

  if (!date) {
    return null;
  }

  const parts = new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone: MALTA_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
  ).formatToParts(date);

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
  const valueDateKey =
    getMaltaDateKey(value);

  const todayDateKey =
    getMaltaDateKey(new Date());

  return Boolean(
    valueDateKey &&
      todayDateKey &&
      valueDateKey === todayDateKey,
  );
}

function formatDateTime(value) {
  const date = parseDate(value);

  if (!date) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'en-GB',
    {
      timeZone: MALTA_TIME_ZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
}

/*
|--------------------------------------------------------------------------
| Today's port-call categories
|--------------------------------------------------------------------------
*/

function isExpectedPortCall(portCall) {
  return (
    isTodayInMalta(portCall.eta) &&
    !hasDateValue(portCall.ata) &&
    !hasDateValue(portCall.etd) &&
    !hasDateValue(portCall.atd)
  );
}

function isArrivedPortCall(portCall) {
  return (
    isTodayInMalta(portCall.eta) &&
    hasDateValue(portCall.ata)
  );
}

function isDepartedPortCall(portCall) {
  return (
    isTodayInMalta(portCall.eta) &&
    hasDateValue(portCall.etd)
  );
}

/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

function getPortCallStatus(portCall) {
  /*
   * IMPORTANT:
   * Departed must be checked before Arrived.
   *
   * A departed vessel can also have ATA,
   * therefore checking Arrived first would
   * incorrectly display "Arrived".
   */
  if (isDepartedPortCall(portCall)) {
    return 'Departed';
  }

  if (isArrivedPortCall(portCall)) {
    return 'Arrived';
  }

  if (isExpectedPortCall(portCall)) {
    return 'Expected';
  }

  return 'Other';
}

function matchesSelectedTab(
  portCall,
  selectedTab,
) {
  if (selectedTab === 'Expected') {
    return isExpectedPortCall(portCall);
  }

  if (selectedTab === 'Arrived') {
    return isArrivedPortCall(portCall);
  }

  if (selectedTab === 'Departed') {
    return isDepartedPortCall(portCall);
  }

  return false;
}

function getStatusClass(status) {
  if (status === 'Active') {
    return 'port-call-status port-call-status-active';
  }

  if (status === 'Arrived') {
    return 'port-call-status port-call-status-arrived';
  }

  if (status === 'Departed') {
    return 'port-call-status port-call-status-current';
  }

  if (status === 'Expected') {
    return 'port-call-status port-call-status-expected';
  }

  return 'port-call-status port-call-status-current';
}

/*
|--------------------------------------------------------------------------
| Sorting
|--------------------------------------------------------------------------
*/

function getSortTimestamp(
  portCall,
  selectedTab,
) {
  let candidateValue;

  if (selectedTab === 'Departed') {
    candidateValue =
      portCall.atd ||
      portCall.etd ||
      portCall.ata ||
      portCall.eta;
  } else if (selectedTab === 'Arrived') {
    candidateValue =
      portCall.ata ||
      portCall.eta;
  } else if (selectedTab === 'Expected') {
    candidateValue =
      portCall.eta;
  } else if (selectedTab === 'Active') {
    candidateValue =
      portCall.ata ||
      portCall.eta;
  } else {
    candidateValue =
      portCall.eta ||
      portCall.ata ||
      portCall.etd ||
      portCall.atd;
  }

  const date = parseDate(candidateValue);

  return date
    ? date.getTime()
    : 0;
}

/*
|--------------------------------------------------------------------------
| Date-time inputs
|--------------------------------------------------------------------------
*/

function toDateTimeLocalValue(value) {
  if (!hasDateValue(value)) {
    return '';
  }

  const stringValue =
    String(value).trim();

  const mysqlDateTimeMatch =
    stringValue.match(
      /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/,
    );

  if (mysqlDateTimeMatch) {
    return `${mysqlDateTimeMatch[1]}T${mysqlDateTimeMatch[2]}`;
  }

  const date = parseDate(value);

  if (!date) {
    return '';
  }

  const parts =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone: MALTA_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      },
    ).formatToParts(date);

  const getPart = (type) =>
    parts.find(
      (part) => part.type === type,
    )?.value;

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');

  if (
    !year ||
    !month ||
    !day ||
    !hour ||
    !minute
  ) {
    return '';
  }

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function toMysqlDateTime(value) {
  if (!value) {
    return null;
  }

  const normalizedValue =
    value.replace('T', ' ');

  return normalizedValue.length === 16
    ? `${normalizedValue}:00`
    : normalizedValue;
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

function PortCallsPage() {
  /*
   * General port calls:
   * Expected / Arrived / Departed
   */
  const [portCalls, setPortCalls] =
    useState([]);

  /*
   * Active port calls come ONLY from:
   * /api/ocei/port_calls/active
   */
  const [
    activePortCalls,
    setActivePortCalls,
  ] = useState([]);

  const [activeTab, setActiveTab] =
    useState('Expected');

  const [search, setSearch] =
    useState('');

  const [currentPage, setCurrentPage] =
    useState(1);

  const [
    selectedPortCall,
    setSelectedPortCall,
  ] = useState(null);

  const [
    showAddPortCall,
    setShowAddPortCall,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const [
    portCallTimes,
    setPortCallTimes,
  ] = useState({
    ata: '',
    atd: '',
  });

  const [
    updatingPortCall,
    setUpdatingPortCall,
  ] = useState(false);

  const [
    updatePortCallError,
    setUpdatePortCallError,
  ] = useState('');

  const [
    updatePortCallSuccess,
    setUpdatePortCallSuccess,
  ] = useState('');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /*
  |--------------------------------------------------------------------------
  | Load data
  |--------------------------------------------------------------------------
  */

  async function loadPortCalls() {
    try {
      setLoading(true);
      setError('');

      const [
        portCallsData,
        activePortCallsData,
      ] = await Promise.all([
        getPortCalls(),
        getActivePortCalls(),
      ]);

      setPortCalls(
        Array.isArray(portCallsData)
          ? portCallsData
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
        'Unable to load port calls from the O-CEI API.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePortCallCreated(
    response,
  ) {
    setShowAddPortCall(false);

    setSuccessMessage(
      response?.vessel_created
        ? 'New vessel and port call created successfully.'
        : 'Port call created successfully.',
    );

    await loadPortCalls();

    window.setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  }

  useEffect(() => {
    loadPortCalls();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setSelectedPortCall(null);
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
  | Counts
  |--------------------------------------------------------------------------
  */

  const counts = useMemo(() => {
    return {
      /*
       * ACTIVE:
       * Count comes directly from active API.
       */
      Active: activePortCalls.length,

      Expected: portCalls.filter(
        isExpectedPortCall,
      ).length,

      Arrived: portCalls.filter(
        isArrivedPortCall,
      ).length,

      Departed: portCalls.filter(
        isDepartedPortCall,
      ).length,
    };
  }, [
    portCalls,
    activePortCalls,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Filtering
  |--------------------------------------------------------------------------
  */

  const filteredPortCalls =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      /*
       * Active tab:
       * use ONLY active API response.
       *
       * Other tabs:
       * use general port calls API.
       */
      const sourcePortCalls =
        activeTab === 'Active'
          ? activePortCalls
          : portCalls.filter(
              (portCall) =>
                matchesSelectedTab(
                  portCall,
                  activeTab,
                ),
            );

      return sourcePortCalls
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

          return searchableValues.some(
            (value) =>
              String(value ?? '')
                .toLowerCase()
                .includes(
                  normalizedSearch,
                ),
          );
        })
        .sort(
          (
            firstPortCall,
            secondPortCall,
          ) => {
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

            /*
             * Departed:
             * newest departures first.
             */
            if (
              activeTab === 'Departed'
            ) {
              return (
                secondTimestamp -
                firstTimestamp
              );
            }

            /*
             * Other tabs:
             * earliest event first.
             */
            return (
              firstTimestamp -
              secondTimestamp
            );
          },
        );
    }, [
      portCalls,
      activePortCalls,
      activeTab,
      search,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredPortCalls.length /
        PAGE_SIZE,
    ),
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages,
  );

  const paginatedPortCalls =
    filteredPortCalls.slice(
      (safeCurrentPage - 1) *
        PAGE_SIZE,
      safeCurrentPage * PAGE_SIZE,
    );

  function handleTabChange(tab) {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedPortCall(null);
  }

  /*
  |--------------------------------------------------------------------------
  | Drawer
  |--------------------------------------------------------------------------
  */

  function handleOpenPortCall(
    portCall,
  ) {
    setSelectedPortCall(portCall);

    setPortCallTimes({
      ata: toDateTimeLocalValue(
        portCall.ata,
      ),

      atd: toDateTimeLocalValue(
        portCall.atd,
      ),
    });

    setUpdatePortCallError('');
    setUpdatePortCallSuccess('');
  }

  function handlePortCallTimeChange(
    event,
  ) {
    const {
      name,
      value,
    } = event.target;

    setPortCallTimes(
      (currentPortCallTimes) => ({
        ...currentPortCallTimes,
        [name]: value,
      }),
    );

    setUpdatePortCallError('');
    setUpdatePortCallSuccess('');
  }

  /*
  |--------------------------------------------------------------------------
  | Update ATA / ATD
  |--------------------------------------------------------------------------
  */

  async function handleUpdatePortCallTimes() {
    if (!selectedPortCall?.id) {
      setUpdatePortCallError(
        'Port call ID is missing.',
      );

      return;
    }

    if (
      portCallTimes.ata &&
      portCallTimes.atd &&
      new Date(portCallTimes.atd) <
        new Date(portCallTimes.ata)
    ) {
      setUpdatePortCallError(
        'ATD cannot be earlier than ATA.',
      );

      return;
    }

    try {
      setUpdatingPortCall(true);
      setUpdatePortCallError('');
      setUpdatePortCallSuccess('');

      const payload = {
        ata: toMysqlDateTime(
          portCallTimes.ata,
        ),

        atd: toMysqlDateTime(
          portCallTimes.atd,
        ),
      };

      const response =
        await updatePortCallTimes(
          selectedPortCall.id,
          payload,
        );

      const updatedPortCall =
        response?.port_call;

      if (!updatedPortCall) {
        throw new Error(
          'The API did not return the updated port call.',
        );
      }

      setSelectedPortCall(
        updatedPortCall,
      );

      setPortCallTimes({
        ata: toDateTimeLocalValue(
          updatedPortCall.ata,
        ),

        atd: toDateTimeLocalValue(
          updatedPortCall.atd,
        ),
      });

      /*
       * Reload BOTH APIs.
       *
       * This is important because changing
       * ATA / ATD may also change whether
       * the vessel is active.
       */
      await loadPortCalls();

      setUpdatePortCallSuccess(
        'ATA and ATD updated successfully.',
      );
    } catch (requestError) {
      console.error(
        'Unable to update port call:',
        requestError,
      );

      setUpdatePortCallError(
        requestError.message ||
          'Unable to update port call.',
      );
    } finally {
      setUpdatingPortCall(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="page-content">
      <div className="page-heading port-calls-page-heading">
        <div>
          <span className="page-eyebrow">
            Port operations
          </span>

          <p>
            Monitor active, expected,
            arrived and departed vessels
            in Malta port.
          </p>
        </div>

        <div className="port-calls-header-actions">
          <button
            type="button"
            className="add-port-call-button"
            onClick={() =>
              setShowAddPortCall(true)
            }
          >
            <Plus size={16} />
            Add Port Call
          </button>

          <button
            type="button"
            className="page-refresh-button"
            onClick={loadPortCalls}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? 'button-icon-spin'
                  : ''
              }
            />

            Refresh
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="port-call-success-message">
          <CheckCircle2 size={17} />
          {successMessage}
        </div>
      )}

      {/* Summary */}

      <section className="port-calls-page-summary">
        <article>
          <span>Active Vessels</span>
          <strong>
            {counts.Active}
          </strong>
        </article>

        <article>
          <span>Expected</span>
          <strong>
            {counts.Expected}
          </strong>
        </article>

        <article>
          <span>Arrived</span>
          <strong>
            {counts.Arrived}
          </strong>
        </article>

        <article>
          <span>Departed</span>
          <strong>
            {counts.Departed}
          </strong>
        </article>
      </section>

      <FreeportVesselsMap />

      <section className="full-page-panel port-calls-full-panel">
        {/* Tabs */}

        <div className="port-calls-page-tabs">
          {PORT_CALL_TABS.map(
            (tab) => (
              <button
                key={tab}
                type="button"
                className={
                  activeTab === tab
                    ? 'port-calls-page-tab port-calls-page-tab-active'
                    : 'port-calls-page-tab'
                }
                onClick={() =>
                  handleTabChange(tab)
                }
              >
                {tab}

                <span>
                  {counts[tab]}
                </span>
              </button>
            ),
          )}
        </div>

        {/* Search */}

        <div className="port-calls-page-toolbar">
          <div className="port-calls-page-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search vessel, MMSI, IMO, terminal or berth..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />
          </div>
        </div>

        {/* Loading */}

        {loading && (
          <div className="full-page-state">
            <RefreshCw
              className="button-icon-spin"
              size={28}
            />

            <span>
              Loading port calls...
            </span>
          </div>
        )}

        {/* Error */}

        {!loading && error && (
          <div className="full-page-state full-page-error">
            <span>{error}</span>
          </div>
        )}

        {/* Table */}

        {!loading && !error && (
          <>
            <div className="full-table-wrapper">
              <table className="full-port-calls-table">
                <thead>
                  <tr>
                    <th>Vessel</th>
                    <th>
                      Terminal / Berth
                    </th>
                    <th>ETA</th>
                    <th>ATA</th>
                    <th>ETD</th>
                    <th>ATD</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>

                <tbody key={activeTab}>
                  {paginatedPortCalls.map(
                    (portCall) => {
                      /*
                       * If this row came from
                       * the Active API, status
                       * is always Active.
                       */
                      const status =
                        activeTab ===
                        'Active'
                          ? 'Active'
                          : getPortCallStatus(
                              portCall,
                            );

                      return (
                        <tr
                          key={`${activeTab}-${portCall.id}`}
                        >
                          <td>
                            <div className="port-call-vessel-cell">
                              <div className="port-call-icon-cell">
                                <Ship
                                  size={17}
                                />
                              </div>

                              <div>
                                <strong>
                                  {portCall.vessel_name ||
                                    'Unknown vessel'}
                                </strong>

                                <span>
                                  MMSI:{' '}
                                  {portCall.mmsi ||
                                    '—'}{' '}
                                  · IMO:{' '}
                                  {portCall.imo ||
                                    '—'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <strong className="port-call-terminal-full">
                              {portCall.term ||
                                '—'}
                            </strong>

                            <span className="port-call-berth-full">
                              {portCall.port ||
                                '—'}{' '}
                              · Berth{' '}
                              {portCall.berth ||
                                '—'}
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
                            <button
                              type="button"
                              className="table-view-button"
                              onClick={() =>
                                handleOpenPortCall(
                                  portCall,
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

                  {paginatedPortCalls.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan="8"
                        className="full-table-empty"
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

            {/* Pagination */}

            <div className="table-pagination">
              <span>
                Showing{' '}
                {filteredPortCalls.length ===
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
                  filteredPortCalls.length,
                )}{' '}
                of{' '}
                {
                  filteredPortCalls.length
                }
              </span>

              <div>
                <button
                  type="button"
                  disabled={
                    safeCurrentPage === 1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        page - 1,
                    )
                  }
                >
                  Previous
                </button>

                <span>
                  Page{' '}
                  {safeCurrentPage} of{' '}
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
                      (page) =>
                        page + 1,
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

      {selectedPortCall && (
        <>
          <button
            type="button"
            className="drawer-backdrop"
            aria-label="Close port call details"
            onClick={() =>
              setSelectedPortCall(null)
            }
          />

          <aside className="vessel-drawer">
            <div className="vessel-drawer-header">
              <div>
                <span>
                  Port call details
                </span>

                <h2>
                  {selectedPortCall.vessel_name ||
                    'Unknown vessel'}
                </h2>
              </div>

              <button
                type="button"
                className="drawer-close-button"
                aria-label="Close port call details"
                onClick={() =>
                  setSelectedPortCall(
                    null,
                  )
                }
              >
                <X size={19} />
              </button>
            </div>

            <div className="vessel-drawer-identity">
              <div className="vessel-drawer-icon">
                <Anchor size={28} />
              </div>

              <div>
                <strong>
                  {activeTab === 'Active'
                    ? 'Active'
                    : getPortCallStatus(
                        selectedPortCall,
                      )}
                </strong>

                <span>
                  {selectedPortCall.port ||
                    '—'}{' '}
                  ·{' '}
                  {selectedPortCall.term ||
                    '—'}
                </span>
              </div>
            </div>

            {/* Port call */}

            <div className="vessel-drawer-section">
              <h3>Port call</h3>

              <div className="vessel-details-grid">
                <div>
                  <span>
                    Port call ID
                  </span>

                  <strong>
                    {selectedPortCall.id ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>Port</span>

                  <strong>
                    {selectedPortCall.port ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>Terminal</span>

                  <strong>
                    {selectedPortCall.term ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>Berth</span>

                  <strong>
                    {selectedPortCall.berth ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>TEU</span>

                  <strong>
                    {selectedPortCall.teu ??
                      '—'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Timeline */}

            <div className="vessel-drawer-section">
              <h3>Timeline</h3>

              <div className="vessel-details-grid">
                <div>
                  <span>ETA</span>

                  <strong>
                    {formatDateTime(
                      selectedPortCall.eta,
                    )}
                  </strong>
                </div>

                <div className="port-call-edit-field">
                  <label htmlFor="edit-port-call-ata">
                    ATA
                  </label>

                  <input
                    id="edit-port-call-ata"
                    type="datetime-local"
                    name="ata"
                    value={
                      portCallTimes.ata
                    }
                    onChange={
                      handlePortCallTimeChange
                    }
                    disabled={
                      updatingPortCall
                    }
                  />
                </div>

                <div>
                  <span>ETD</span>

                  <strong>
                    {formatDateTime(
                      selectedPortCall.etd,
                    )}
                  </strong>
                </div>

                <div className="port-call-edit-field">
                  <label htmlFor="edit-port-call-atd">
                    ATD
                  </label>

                  <input
                    id="edit-port-call-atd"
                    type="datetime-local"
                    name="atd"
                    value={
                      portCallTimes.atd
                    }
                    onChange={
                      handlePortCallTimeChange
                    }
                    disabled={
                      updatingPortCall
                    }
                  />
                </div>
              </div>

              {updatePortCallError && (
                <div className="port-call-update-message port-call-update-error">
                  {
                    updatePortCallError
                  }
                </div>
              )}

              {updatePortCallSuccess && (
                <div className="port-call-update-message port-call-update-success">
                  {
                    updatePortCallSuccess
                  }
                </div>
              )}
            </div>

            {/* Vessel */}

            <div className="vessel-drawer-section">
              <h3>Vessel</h3>

              <div className="vessel-details-grid">
                <div>
                  <span>MMSI</span>

                  <strong>
                    {selectedPortCall.mmsi ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>IMO</span>

                  <strong>
                    {selectedPortCall.imo ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>Type</span>

                  <strong>
                    {selectedPortCall.vessel_type ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>Subtype</span>

                  <strong>
                    {selectedPortCall.vessel_subtype ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>Length</span>

                  <strong>
                    {selectedPortCall.length
                      ? `${selectedPortCall.length} m`
                      : '—'}
                  </strong>
                </div>

                <div>
                  <span>Beam</span>

                  <strong>
                    {selectedPortCall.beam
                      ? `${selectedPortCall.beam} m`
                      : '—'}
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
                  setSelectedPortCall(
                    null,
                  )
                }
                disabled={
                  updatingPortCall
                }
              >
                Close
              </button>

              <button
                type="button"
                className="drawer-primary-button"
                onClick={
                  handleUpdatePortCallTimes
                }
                disabled={
                  updatingPortCall
                }
              >
                {updatingPortCall ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="button-icon-spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save ATA / ATD
                  </>
                )}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Add Port Call */}

      {showAddPortCall && (
        <AddPortCallModal
          onClose={() =>
            setShowAddPortCall(false)
          }
          onCreated={
            handlePortCallCreated
          }
        />
      )}
    </div>
  );
}

export default PortCallsPage;