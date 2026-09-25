import {
  AlertCircle,
  LoaderCircle,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getVessels } from '../../services/vesselsService';

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

function VesselsPanel() {
  const [vessels, setVessels] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadVessels() {
      try {
        setLoading(true);
        setError('');

        const data = await getVessels();

        setVessels(Array.isArray(data) ? data : []);
      } catch (requestError) {
        console.error(requestError);

        setError(
          'Unable to load vessels from the O-CEI API.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadVessels();
  }, []);

  const vesselTypes = useMemo(() => {
    const types = vessels
      .map((vessel) => vessel.vessel_type)
      .filter(Boolean);

    return [...new Set(types)].sort();
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
        const firstName = a.vessel_name || '';
        const secondName = b.vessel_name || '';

        if (sortOrder === 'name-asc') {
          return firstName.localeCompare(secondName);
        }

        if (sortOrder === 'name-desc') {
          return secondName.localeCompare(firstName);
        }

        if (sortOrder === 'gt-desc') {
          return Number(b.gt || 0) - Number(a.gt || 0);
        }

        if (sortOrder === 'length-desc') {
          return (
            Number(b.length || 0) -
            Number(a.length || 0)
          );
        }

        return 0;
      });
  }, [vessels, search, typeFilter, sortOrder]);

  function openVesselsPage() {
    navigate('/vessels');
  }

  if (loading) {
    return (
      <div className="vessels-state">
        <LoaderCircle
          className="vessels-loading-icon"
          size={30}
        />
        <span>Loading vessels...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vessels-state vessels-error">
        <AlertCircle size={30} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="vessels-panel-content">
      <div className="vessels-toolbar">
        <div className="vessels-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search name, MMSI or IMO..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value)
          }
        >
          <option value="All">All types</option>

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
          <option value="length-desc">
            Longest vessel
          </option>
        </select>

        <button
          type="button"
          className="vessels-filter-button"
          aria-label="More filters"
        >
          <SlidersHorizontal size={17} />
        </button>
      </div>

      <div className="vessels-table-wrapper">
        <table className="vessels-table">
          <thead>
            <tr>
              <th>Vessel</th>
              <th>Type</th>
              <th>Dimensions</th>
              <th>GT / DW</th>
              <th>TEU</th>
            </tr>
          </thead>

          <tbody>
            {filteredVessels.slice(0, 5).map((vessel) => (
              <tr key={vessel.id}>
                <td>
                  <strong>
                    {vessel.vessel_name || 'Unknown vessel'}
                  </strong>

                  <span>
                    MMSI: {formatValue(vessel.mmsi)} · IMO:{' '}
                    {formatValue(vessel.imo)}
                  </span>
                </td>

                <td>
                  <strong className="vessel-type">
                    {formatValue(vessel.vessel_type)}
                  </strong>

                  <span className="vessel-subtype">
                    {formatValue(vessel.vessel_subtype)}
                  </span>
                </td>

                <td>
                  {formatValue(vessel.length, ' m')} ×{' '}
                  {formatValue(vessel.beam, ' m')}
                </td>

                <td>
                  <div className="metric-stack">
                    <span>
                      GT: {formatValue(vessel.gt)}
                    </span>
                    <span>
                      DW: {formatValue(vessel.dw)}
                    </span>
                  </div>
                </td>

                <td>
                  {formatValue(vessel.estimated_teu)}
                </td>
              </tr>
            ))}

            {filteredVessels.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="vessels-empty"
                >
                  No vessels found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="vessels-panel-footer">
        <span>
          Showing {Math.min(filteredVessels.length, 5)} of{' '}
          {filteredVessels.length} vessels
        </span>

        <button type="button" onClick={openVesselsPage}>
          View all vessels
          <span>→</span>
        </button>
      </div>
    </div>
  );
}

export default VesselsPanel;