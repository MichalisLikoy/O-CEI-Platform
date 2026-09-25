import { AlertCircle, LoaderCircle, LocateFixed, RefreshCw, Ship } from 'lucide-react';
import L from 'leaflet';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useEffect, useMemo, useState } from 'react';

import { getVesselsByArea } from '../../services/vesselsByAreaService';

const FREEPORT_CENTER = {
  latitude: 35.822,
  longitude: 14.526,
};

const SEARCH_RADIUS_KM = 2;

/*
|--------------------------------------------------------------------------
| Vessel Marker
|--------------------------------------------------------------------------
*/

function createShipIcon(vessel) {
  const heading = Number(vessel.heading);
  const course = Number(vessel.course);
  const direction = Number.isFinite(heading) ? heading : Number.isFinite(course) ? course : 0;
  const speed = Number(vessel.speed || 0);

  const vesselType = String(vessel.typeSpecific || '').toLowerCase();

  const isMoving = speed > 1;
  const isCargo =
    vesselType.includes('container') ||
    vesselType.includes('cargo');

  let statusClass = 'freeport-vessel-marker-default';

  if (isMoving) {
    statusClass = 'freeport-vessel-marker-moving';
  } else if (isCargo) {
    statusClass = 'freeport-vessel-marker-cargo';
  }

  return L.divIcon({
    className: 'freeport-vessel-div-icon',
    html: `
      <div class="freeport-vessel-marker ${statusClass}" title="${vessel.name || 'Unknown vessel'}">
        <div class="freeport-vessel-marker-rotation" style="transform: rotate(${direction}deg)">
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
              class="freeport-vessel-marker-body"
              d="M16 2 L22 9 L24.5 23 L19.5 29 L16 30 L12.5 29 L7.5 23 L10 9 Z"
            />
            <path
              class="freeport-vessel-marker-deck"
              d="M12 10 L20 10 L20 18 L12 18 Z"
            />
            <path class="freeport-vessel-marker-line" d="M16 3 L16 28" />
            <path class="freeport-vessel-marker-line" d="M9 22 L23 22" />
          </svg>
        </div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -22],
  });
}

/*
|--------------------------------------------------------------------------
| Map Controller
|--------------------------------------------------------------------------
*/

function MapController({ center, vessels }) {
  const map = useMap();

  useEffect(() => {
    if (vessels.length === 0) {
      map.setView([center.latitude, center.longitude], 14);
      return;
    }

    const bounds = L.latLngBounds(
      vessels.map((vessel) => [vessel.latitude, vessel.longitude]),
    );

    bounds.extend([center.latitude, center.longitude]);

    map.fitBounds(bounds, {
      padding: [45, 45],
      maxZoom: 15,
    });
  }, [map, center, vessels]);

  return null;
}

/*
|--------------------------------------------------------------------------
| Formatting
|--------------------------------------------------------------------------
*/

function formatSpeed(value) {
  const speed = Number(value);
  return Number.isFinite(speed) ? `${speed.toFixed(1)} kn` : '—';
}

function formatDirection(value) {
  const direction = Number(value);
  return Number.isFinite(direction) ? `${direction.toFixed(0)}°` : '—';
}

function formatLastUpdated(date) {
  if (!date) return '—';

  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

function FreeportVesselsMap() {
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  async function loadVessels({ background = false } = {}) {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const data = await getVesselsByArea();
      const rawVessels = Array.isArray(data?.vessels) ? data.vessels : [];

      const normalizedVessels = rawVessels
        .map((vessel) => ({
          ...vessel,
          latitude: Number(vessel.latitude),
          longitude: Number(vessel.longitude),
          speed: vessel.speed !== null && vessel.speed !== undefined ? Number(vessel.speed) : null,
          course: vessel.course !== null && vessel.course !== undefined ? Number(vessel.course) : null,
          heading: vessel.heading !== null && vessel.heading !== undefined ? Number(vessel.heading) : null,
        }))
        .filter((vessel) => Number.isFinite(vessel.latitude) && Number.isFinite(vessel.longitude));

      setVessels(normalizedVessels);

      if (data?.snapshotTime) {
        const snapshotDate = new Date(data.snapshotTime);

        if (!Number.isNaN(snapshotDate.getTime())) {
          setLastUpdated(snapshotDate);
        }
      }
    } catch (requestError) {
      console.error(requestError);
      setError(requestError?.message || 'Unable to load vessel positions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

    useEffect(() => {
    loadVessels();
    }, []);

  const movingVessels = useMemo(
    () => vessels.filter((vessel) => Number(vessel.speed || 0) > 1).length,
    [vessels],
  );

  const stationaryVessels = vessels.length - movingVessels;

  return (
    <section className="full-page-panel freeport-map-panel">
      <div className="freeport-map-header">
        <div>
          <span className="page-eyebrow">Latest AIS positions</span>
          <h2>Vessels inside Malta Freeport</h2>
          <p>Latest vessel positions within a {SEARCH_RADIUS_KM} km radius of Malta Freeport.</p>
        </div>

        <button
          type="button"
          className="page-refresh-button"
          onClick={() => loadVessels({ background: true })}
          disabled={loading || refreshing}
        >
          <RefreshCw size={16} className={loading || refreshing ? 'button-icon-spin' : ''} />
          Refresh positions
        </button>
      </div>

      <div className="freeport-map-summary">
        <article>
          <Ship size={18} />
          <div>
            <span>Vessels detected</span>
            <strong>{vessels.length}</strong>
          </div>
        </article>

        <article>
          <LocateFixed size={18} />
          <div>
            <span>Stationary</span>
            <strong>{stationaryVessels}</strong>
          </div>
        </article>

        <article>
          <LocateFixed size={18} />
          <div>
            <span>Moving</span>
            <strong>{movingVessels}</strong>
          </div>
        </article>

        <article>
          <RefreshCw size={18} />
          <div>
            <span>Snapshot time</span>
            <strong>{formatLastUpdated(lastUpdated)}</strong>
          </div>
        </article>
      </div>

      {loading && (
        <div className="freeport-map-state">
          <LoaderCircle className="button-icon-spin" size={30} />
          <span>Loading vessel positions...</span>
        </div>
      )}

      {!loading && error && (
        <div className="freeport-map-state freeport-map-error">
          <AlertCircle size={30} />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="freeport-map-wrapper">
          <MapContainer
            center={[FREEPORT_CENTER.latitude, FREEPORT_CENTER.longitude]}
            zoom={14}
            scrollWheelZoom
            className="freeport-map"
          >
            <div className="freeport-map-legend">
            <div>
                <span className="freeport-map-legend-marker freeport-map-legend-cargo" />
                <span>Container / Cargo</span>
            </div>

            <div>
                <span className="freeport-map-legend-marker freeport-map-legend-default" />
                <span>Other vessel</span>
            </div>

            <div>
                <span className="freeport-map-legend-marker freeport-map-legend-moving" />
                <span>Moving vessel</span>
            </div>
            </div>
           <TileLayer
            attribution="&copy; Stadia Maps &copy; OpenMapTiles &copy; OpenStreetMap contributors"
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            maxZoom={20}
            />

            <Circle
              center={[FREEPORT_CENTER.latitude, FREEPORT_CENTER.longitude]}
              radius={SEARCH_RADIUS_KM * 1000}
              pathOptions={{
                color: '#60a5fa',
                fillColor: '#2563eb',
                fillOpacity: 0.05,
                weight: 1,
              }}
            />

           {vessels.map((vessel) => (
            <Marker
                key={`${vessel.mmsi}-${vessel.latitude}-${vessel.longitude}`}
                position={[vessel.latitude, vessel.longitude]}
                icon={createShipIcon(vessel)}
                eventHandlers={{
                click: (event) => {
                    console.log('VESSEL CLICK:', vessel.name, vessel.mmsi);
                    event.target.openPopup();
                },
                }}
            >
                <Popup
                autoPan
                closeButton
                className="freeport-vessel-leaflet-popup"
                >
                <div className="freeport-vessel-popup">
                    <strong>{vessel.name || 'Unknown vessel'}</strong>
                    <span>{vessel.typeSpecific || 'Unknown type'}</span>

                    <dl>
                    <div>
                        <dt>MMSI</dt>
                        <dd>{vessel.mmsi || '—'}</dd>
                    </div>

                    <div>
                        <dt>Speed</dt>
                        <dd>{formatSpeed(vessel.speed)}</dd>
                    </div>

                    <div>
                        <dt>Course</dt>
                        <dd>{formatDirection(vessel.course)}</dd>
                    </div>

                    <div>
                        <dt>Heading</dt>
                        <dd>{formatDirection(vessel.heading)}</dd>
                    </div>
                    </dl>
                </div>
                </Popup>
            </Marker>
            ))}

            <MapController center={FREEPORT_CENTER} vessels={vessels} />
          </MapContainer>

          {vessels.length === 0 && (
            <div className="freeport-map-empty">
              No vessels were detected in the latest snapshot.
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default FreeportVesselsMap;