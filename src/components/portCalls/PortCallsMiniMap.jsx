import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useEffect, useMemo, useState } from 'react';

import { getVesselsByArea } from '../../services/vesselsByAreaService';

const FREEPORT_CENTER = [35.822, 14.526];

function createShipIcon(vessel) {
  const heading = Number(vessel.heading);
  const course = Number(vessel.course);
  const direction = Number.isFinite(heading) ? heading : Number.isFinite(course) ? course : 0;

  const speed = Number(vessel.speed || 0);
  const vesselType = String(vessel.typeSpecific || '').toLowerCase();

  const isMoving = speed > 1;
  const isCargo = vesselType.includes('container') || vesselType.includes('cargo');

  let markerClass = 'port-calls-mini-marker-default';

  if (isMoving) {
    markerClass = 'port-calls-mini-marker-moving';
  } else if (isCargo) {
    markerClass = 'port-calls-mini-marker-cargo';
  }

  return L.divIcon({
    className: 'port-calls-mini-marker-wrapper',
    html: `
      <div class="port-calls-mini-marker ${markerClass}">
        <div class="port-calls-mini-marker-ship" style="transform: rotate(${direction}deg)">
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2 L22 9 L24 23 L19 29 L16 30 L13 29 L8 23 L10 9 Z" />
            <path d="M12 11H20V19H12Z" />
            <path d="M16 3V28" />
          </svg>
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

function MapBoundsController({ vessels }) {
  const map = useMap();

  useEffect(() => {
    if (vessels.length === 0) {
      map.setView(FREEPORT_CENTER, 14);
      return;
    }

    const bounds = L.latLngBounds(
      vessels.map((vessel) => [vessel.latitude, vessel.longitude]),
    );

    map.fitBounds(bounds, {
      padding: [22, 22],
      maxZoom: 14,
    });
  }, [map, vessels]);

  return null;
}

function PortCallsMiniMap() {
  const [vessels, setVessels] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadVessels() {
      try {
        setError('');

        const data = await getVesselsByArea();
        const rawVessels = Array.isArray(data?.vessels) ? data.vessels : [];

        const normalizedVessels = rawVessels
          .map((vessel) => ({
            ...vessel,
            latitude: Number(vessel.latitude),
            longitude: Number(vessel.longitude),
          }))
          .filter((vessel) => (
            Number.isFinite(vessel.latitude) &&
            Number.isFinite(vessel.longitude)
          ));

        setVessels(normalizedVessels);
      } catch (requestError) {
        console.error(requestError);
        setError('Map unavailable');
      }
    }

    loadVessels();
  }, []);

  const movingVessels = useMemo(
    () => vessels.filter((vessel) => Number(vessel.speed || 0) > 1).length,
    [vessels],
  );

  return (
    <div className="port-calls-mini-map-section">
      <div className="port-calls-mini-map-header">
        <div>
          <strong>Latest Freeport positions</strong>
          <span>{vessels.length} vessels · {movingVessels} moving</span>
        </div>
      </div>

      <div className="port-calls-mini-map-wrapper">
        {error ? (
          <div className="port-calls-mini-map-error">
            {error}
          </div>
        ) : (
          <>
            <MapContainer
              center={FREEPORT_CENTER}
              zoom={14}
              zoomControl={false}
              scrollWheelZoom={false}
              dragging
              attributionControl={false}
              className="port-calls-mini-map"
            >
              <TileLayer
                attribution="&copy; Stadia Maps &copy; OpenMapTiles &copy; OpenStreetMap contributors"
                url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                maxZoom={20}
              />

              {vessels.map((vessel) => (
                <Marker
                  key={`${vessel.mmsi}-${vessel.latitude}-${vessel.longitude}`}
                  position={[vessel.latitude, vessel.longitude]}
                  icon={createShipIcon(vessel)}
                  eventHandlers={{
                    click: (event) => {
                      event.target.openPopup();
                    },
                  }}
                >
                  <Popup>
                    <div className="port-calls-mini-popup">
                      <strong>{vessel.name || 'Unknown vessel'}</strong>
                      <span>{vessel.typeSpecific || 'Unknown type'}</span>
                      <small>MMSI: {vessel.mmsi || '—'}</small>
                    </div>
                  </Popup>
                </Marker>
              ))}

              <MapBoundsController vessels={vessels} />
            </MapContainer>

            <div className="port-calls-mini-map-legend">
              <div>
                <i className="port-calls-mini-legend-dot port-calls-mini-legend-cargo" />
                <span>Container / Cargo</span>
              </div>

              <div>
                <i className="port-calls-mini-legend-dot port-calls-mini-legend-default" />
                <span>Other vessel</span>
              </div>

              <div>
                <i className="port-calls-mini-legend-dot port-calls-mini-legend-moving" />
                <span>Moving</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PortCallsMiniMap;