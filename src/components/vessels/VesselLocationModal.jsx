import {
  Anchor,
  LoaderCircle,
  MapPin,
  Navigation,
  RefreshCw,
  Ship,
  X,
} from 'lucide-react';
import L from 'leaflet';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { useEffect } from 'react';

function createVesselIcon(vessel) {
  const direction =
    Number.isFinite(vessel.heading)
      ? vessel.heading
      : Number.isFinite(vessel.course)
        ? vessel.course
        : 0;

  return L.divIcon({
    className: 'vessel-location-marker-wrapper',

    html: `
      <div class="vessel-location-marker">
        <div
          class="vessel-location-marker-rotation"
          style="transform: rotate(${direction}deg)"
        >
          <svg
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              class="vessel-location-marker-body"
              d="
                M16 2
                L22 9
                L24.5 23
                L19.5 29
                L16 30
                L12.5 29
                L7.5 23
                L10 9
                Z
              "
            />

            <path
              class="vessel-location-marker-deck"
              d="M12 10H20V18H12Z"
            />

            <path
              class="vessel-location-marker-line"
              d="M16 3V28"
            />

            <path
              class="vessel-location-marker-line"
              d="M9 22H23"
            />
          </svg>
        </div>
      </div>
    `,

    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -24],
  });
}

function VesselMapController({
  latitude,
  longitude,
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(
      [latitude, longitude],
      11,
      {
        animate: true,
      },
    );
  }, [map, latitude, longitude]);

  return null;
}

function formatCoordinate(value) {
  return Number(value).toFixed(6);
}

function formatSpeed(value) {
  return Number.isFinite(value)
    ? `${value.toFixed(1)} kn`
    : '—';
}

function formatDirection(value) {
  return Number.isFinite(value)
    ? `${value.toFixed(0)}°`
    : '—';
}

function VesselLocationModal({
  vessel,
  loading,
  error,
  onClose,
  onRefresh,
}) {
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener(
      'keydown',
      handleEscape,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        className="vessel-location-backdrop"
        aria-label="Close vessel map"
        onClick={onClose}
      />

      <section
        className="vessel-location-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Vessel location"
      >
        <header className="vessel-location-modal-header">
          <div>
            <span>Live vessel position</span>

            <h2>
              {vessel?.name || 'Vessel location'}
            </h2>
          </div>

          <div className="vessel-location-header-actions">
            <button
              type="button"
              aria-label="Refresh vessel position"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw
                size={18}
                className={
                  loading
                    ? 'button-icon-spin'
                    : ''
                }
              />
            </button>

            <button
              type="button"
              aria-label="Close vessel map"
              onClick={onClose}
            >
              <X size={19} />
            </button>
          </div>
        </header>

        {loading && (
          <div className="vessel-location-state">
            <LoaderCircle
              size={34}
              className="button-icon-spin"
            />

            <span>
              Loading vessel position...
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="vessel-location-state vessel-location-error">
            <MapPin size={34} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && vessel && (
          <>
            <div className="vessel-location-summary">
              <article>
                <Ship size={18} />

                <div>
                  <span>Vessel</span>
                  <strong>{vessel.name}</strong>
                </div>
              </article>

              <article>
                <Navigation size={18} />

                <div>
                  <span>Status</span>
                  <strong>
                    {vessel.navigationalStatus ||
                      '—'}
                  </strong>
                </div>
              </article>

              <article>
                <Anchor size={18} />

                <div>
                  <span>Speed</span>
                  <strong>
                    {formatSpeed(vessel.speed)}
                  </strong>
                </div>
              </article>

              <article>
                <Navigation size={18} />

                <div>
                  <span>Heading</span>
                  <strong>
                    {formatDirection(
                      vessel.heading ??
                        vessel.course,
                    )}
                  </strong>
                </div>
              </article>
            </div>

            <div className="vessel-location-map-wrapper">
              <MapContainer
                center={[
                  vessel.latitude,
                  vessel.longitude,
                ]}
                zoom={11}
                scrollWheelZoom
                className="vessel-location-map"
              >
                <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                
              />

                <Marker
                  position={[
                    vessel.latitude,
                    vessel.longitude,
                  ]}
                  icon={createVesselIcon(vessel)}
                >
                  <Popup>
                    <div className="vessel-location-popup">
                      <strong>{vessel.name}</strong>

                      <span>
                        {vessel.typeSpecific ||
                          'Unknown type'}
                      </span>

                      <dl>
                        <div>
                          <dt>MMSI</dt>
                          <dd>
                            {vessel.mmsi || '—'}
                          </dd>
                        </div>

                        <div>
                          <dt>IMO</dt>
                          <dd>
                            {vessel.imo || '—'}
                          </dd>
                        </div>

                        <div>
                          <dt>Speed</dt>
                          <dd>
                            {formatSpeed(
                              vessel.speed,
                            )}
                          </dd>
                        </div>

                        <div>
                          <dt>Heading</dt>
                          <dd>
                            {formatDirection(
                              vessel.heading,
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </Popup>
                </Marker>

                <VesselMapController
                  latitude={vessel.latitude}
                  longitude={vessel.longitude}
                />
              </MapContainer>
            </div>

            <div className="vessel-location-details">
              <article>
                <span>Coordinates</span>
                <strong>
                  {formatCoordinate(
                    vessel.latitude,
                  )}
                  ,{' '}
                  {formatCoordinate(
                    vessel.longitude,
                  )}
                </strong>
              </article>

              <article>
                <span>Destination</span>
                <strong>
                  {vessel.destination || '—'}
                </strong>
              </article>

              <article>
                <span>Last port</span>
                <strong>
                  {vessel.lastPort || '—'}
                </strong>
              </article>

              <article>
                <span>Position received</span>
                <strong>
                  {vessel.positionReceived || '—'}
                </strong>
              </article>

              <article>
                <span>Data source</span>
                <strong>
                  {vessel.dataSource || '—'}
                </strong>
              </article>

              <article>
                <span>Callsign</span>
                <strong>
                  {vessel.callsign || '—'}
                </strong>
              </article>
            </div>
          </>
        )}
      </section>
    </>
  );
}

export default VesselLocationModal;