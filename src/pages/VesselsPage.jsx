import {
  MapPin,
  RefreshCw,
  Search,
  Ship,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { getVessels } from '../services/vesselsService';
import VesselLocationModal from '../components/vessels/VesselLocationModal';
import { getVesselLocation } from '../services/vesselLocationService';

const PAGE_SIZE = 10;

function formatValue(value, suffix = '') {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  return `${value}${suffix}`;
}

function VesselsPage() {
  const [vessels, setVessels] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [mapVessel, setMapVessel] = useState(null);
  const [mapVesselIdentifier, setMapVesselIdentifier] =
    useState(null);

  const [mapLoading, setMapLoading] =
    useState(false);

  const [mapError, setMapError] =
    useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setSelectedVessel(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  async function loadVessels() {
    try {
      setLoading(true);
      setError('');

      const data = await getVessels();

      setVessels(Array.isArray(data) ? data : []);
    } catch (requestError) {
      console.error(requestError);
      setError('Unable to load vessels from the O-CEI API.');
    } finally {
      setLoading(false);
    }
  }



  async function openVesselOnMap(vessel) {
    const identifier =
      vessel.mmsi || vessel.imo;

    setMapVesselIdentifier(identifier);
    setMapVessel(null);
    setMapError('');

    if (!identifier) {
      setMapError(
        'This vessel has no MMSI or IMO.',
      );

      return;
    }

    try {
      setMapLoading(true);

      const location =
        await getVesselLocation(identifier);

      setMapVessel(location);
    } catch (requestError) {
      console.error(requestError);

      setMapError(
        requestError.message ||
        'Unable to load vessel position.',
      );
    } finally {
      setMapLoading(false);
    }
  }

  function closeVesselMap() {
    setMapVessel(null);
    setMapVesselIdentifier(null);
    setMapError('');
    setMapLoading(false);
  }

  function refreshVesselMap() {
    if (!mapVesselIdentifier) {
      return;
    }

    openVesselOnMap({
      mmsi: mapVesselIdentifier,
    });
  }




  useEffect(() => {
    loadVessels();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, sortOrder]);

  const vesselTypes = useMemo(() => {
    return [
      ...new Set(
        vessels
          .map((vessel) => vessel.vessel_type)
          .filter(Boolean),
      ),
    ].sort();
  }, [vessels]);

  const filteredVessels = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return vessels
      .filter((vessel) => {
        const vesselName =
          vessel.vessel_name?.toLowerCase() || '';

        const mmsi = String(vessel.mmsi || '');
        const imo = String(vessel.imo || '');

        const matchesSearch =
          vesselName.includes(normalizedSearch) ||
          mmsi.includes(normalizedSearch) ||
          imo.includes(normalizedSearch);

        const matchesType =
          typeFilter === 'All' ||
          vessel.vessel_type === typeFilter;

        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (sortOrder === 'name-asc') {
          return String(a.vessel_name || '').localeCompare(
            String(b.vessel_name || ''),
          );
        }

        if (sortOrder === 'name-desc') {
          return String(b.vessel_name || '').localeCompare(
            String(a.vessel_name || ''),
          );
        }

        if (sortOrder === 'gt-desc') {
          return Number(b.gt || 0) - Number(a.gt || 0);
        }

        if (sortOrder === 'dw-desc') {
          return Number(b.dw || 0) - Number(a.dw || 0);
        }

        if (sortOrder === 'length-desc') {
          return Number(b.length || 0) - Number(a.length || 0);
        }

        if (sortOrder === 'teu-desc') {
          return (
            Number(b.estimated_teu || 0) -
            Number(a.estimated_teu || 0)
          );
        }

        return 0;
      });
  }, [vessels, search, typeFilter, sortOrder]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredVessels.length / PAGE_SIZE),
  );

  const paginatedVessels = filteredVessels.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const summary = useMemo(() => {
    return {
      total: vessels.length,

      containers: vessels.filter(
        (vessel) => vessel.vessel_type === 'Container',
      ).length,

      tankers: vessels.filter(
        (vessel) => vessel.vessel_type === 'Tanker',
      ).length,

      cargo: vessels.filter(
        (vessel) => vessel.vessel_type === 'Cargo',
      ).length,

      other: vessels.filter(
        (vessel) => vessel.vessel_type === 'Other',
      ).length,
    };
  }, [vessels]);

  return (
    <div className="page-content">
      <div className="page-heading vessels-page-heading">
        <div>
          <span className="page-eyebrow">Fleet monitoring</span>
          {/* <h1>Vessels</h1> */}
          <p>
            View all vessels recorded by the O-CEI platform.
          </p>
        </div>

        <button
          type="button"
          className="page-refresh-button"
          onClick={loadVessels}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? 'button-icon-spin' : ''}
          />
          Refresh
        </button>
      </div>

      <section className="vessels-page-summary">
        <article>
          <span>Total vessels</span>
          <strong>{summary.total}</strong>
        </article>

        <article>
          <span>Container</span>
          <strong>{summary.containers}</strong>
        </article>

        <article>
          <span>Tanker</span>
          <strong>{summary.tankers}</strong>
        </article>

        <article>
          <span>Cargo</span>
          <strong>{summary.cargo}</strong>
        </article>

        <article>
          <span>Other</span>
          <strong>{summary.other}</strong>
        </article>
      </section>

      <section className="full-page-panel vessels-full-panel">
        <div className="vessels-page-toolbar">
          <div className="vessels-page-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search vessel name, MMSI or IMO..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value)
            }
          >
            <option value="All">All vessel types</option>

            {vesselTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(event.target.value)
            }
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="gt-desc">Highest GT</option>
            <option value="dw-desc">Highest DW</option>
            <option value="length-desc">Longest vessel</option>
            <option value="teu-desc">Highest TEU</option>
          </select>

          <button
            type="button"
            className="vessels-page-filter-button"
            aria-label="More filters"
          >
            <SlidersHorizontal size={17} />
          </button>
        </div>

        {loading && (
          <div className="full-page-state">
            <RefreshCw className="button-icon-spin" size={28} />
            <span>Loading vessels...</span>
          </div>
        )}

        {!loading && error && (
          <div className="full-page-state full-page-error">
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="full-table-wrapper">
              <table className="full-vessels-table">
                <thead>
                  <tr>
                    <th>Vessel</th>
                    <th>Type</th>
                    <th>Dimensions</th>
                    <th>GT</th>
                    <th>DW</th>
                    <th>TEU</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {paginatedVessels.map((vessel) => (
                    <tr key={vessel.id}>
                      <td>
                        <div className="vessel-name-cell">
                          <div className="vessel-icon-cell">
                            <Ship size={17} />
                          </div>

                          <div>
                            <strong>
                              {vessel.vessel_name ||
                                'Unknown vessel'}
                            </strong>

                            <span>
                              MMSI: {formatValue(vessel.mmsi)} ·
                              IMO: {formatValue(vessel.imo)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>
                          {formatValue(vessel.vessel_type)}
                        </strong>
                        <span>
                          {formatValue(vessel.vessel_subtype)}
                        </span>
                      </td>

                      <td>
                        {formatValue(vessel.length, ' m')} ×{' '}
                        {formatValue(vessel.beam, ' m')}
                      </td>


                      <td>{formatValue(vessel.gt)}</td>
                      <td>{formatValue(vessel.dw)}</td>
                      <td>{formatValue(vessel.estimated_teu)}</td>


                      <td>
                        <div className="vessel-table-actions">
                          <button
                            type="button"
                            className="table-map-button"
                            onClick={() =>
                              openVesselOnMap(vessel)
                            }
                          >
                            <MapPin size={14} />
                            On map
                          </button>

                          <button
                            type="button"
                            className="table-view-button"
                            onClick={() =>
                              setSelectedVessel(vessel)
                            }
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {paginatedVessels.length === 0 && (
                    <tr>
                      <td colSpan="7" className="full-table-empty">
                        No vessels found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-pagination">
              <span>
                Showing{' '}
                {filteredVessels.length === 0
                  ? 0
                  : (currentPage - 1) * PAGE_SIZE + 1}
                –
                {Math.min(
                  currentPage * PAGE_SIZE,
                  filteredVessels.length,
                )}{' '}
                of {filteredVessels.length}
              </span>

              <div>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => page - 1)
                  }
                >
                  Previous
                </button>

                <span>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) => page + 1)
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {selectedVessel && (
        <>
          <button
            type="button"
            className="drawer-backdrop"
            aria-label="Close vessel details"
            onClick={() => setSelectedVessel(null)}
          />

          <aside className="vessel-drawer">
            <div className="vessel-drawer-header">
              <div>
                <span>Vessel details</span>
                <h2>
                  {selectedVessel.vessel_name || 'Unknown vessel'}
                </h2>
              </div>

              <button
                type="button"
                className="drawer-close-button"
                aria-label="Close vessel details"
                onClick={() => setSelectedVessel(null)}
              >
                <X size={19} />
              </button>
            </div>

            <div className="vessel-drawer-identity">
              <div className="vessel-drawer-icon">
                <Ship size={28} />
              </div>

              <div>
                <strong>
                  {formatValue(selectedVessel.vessel_type)}
                </strong>

                <span>
                  {formatValue(selectedVessel.vessel_subtype)}
                </span>
              </div>
            </div>

            <div className="vessel-drawer-section">
              <h3>Identification</h3>

              <div className="vessel-details-grid">
                <div>
                  <span>MMSI</span>
                  <strong>
                    {formatValue(selectedVessel.mmsi)}
                  </strong>
                </div>

                <div>
                  <span>IMO</span>
                  <strong>
                    {formatValue(selectedVessel.imo)}
                  </strong>
                </div>

                <div>
                  <span>Database ID</span>
                  <strong>
                    {formatValue(selectedVessel.id)}
                  </strong>
                </div>

              </div>
            </div>

            <div className="vessel-drawer-section">
              <h3>Dimensions</h3>

              <div className="vessel-details-grid">
                <div>
                  <span>Length</span>
                  <strong>
                    {formatValue(selectedVessel.length, ' m')}
                  </strong>
                </div>

                <div>
                  <span>Beam</span>
                  <strong>
                    {formatValue(selectedVessel.beam, ' m')}
                  </strong>
                </div>


              </div>
            </div>

            <div className="vessel-drawer-section">
              <h3>Capacity</h3>

              <div className="vessel-details-grid">
                <div>
                  <span>Gross tonnage</span>
                  <strong>
                    {formatValue(selectedVessel.gt)}
                  </strong>
                </div>

                <div>
                  <span>Deadweight</span>
                  <strong>
                    {formatValue(selectedVessel.dw)}
                  </strong>
                </div>

                <div>
                  <span>Estimated TEU</span>
                  <strong>
                    {formatValue(selectedVessel.estimated_teu)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="vessel-drawer-footer">
              <button
                type="button"
                className="drawer-secondary-button"
                onClick={() => setSelectedVessel(null)}
              >
                Close
              </button>

              <button
                type="button"
                className="drawer-primary-button"
                disabled
              >
                View activity
              </button>
            </div>
          </aside>
        </>
      )}
      {(
        mapLoading ||
        mapError ||
        mapVessel
      ) && (
          <VesselLocationModal
            vessel={mapVessel}
            loading={mapLoading}
            error={mapError}
            onClose={closeVesselMap}
            onRefresh={refreshVesselMap}
          />
        )}
    </div>
  );
}

export default VesselsPage;