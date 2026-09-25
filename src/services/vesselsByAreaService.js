const VESSELS_MAP_API_URL =
  'https://agents.sammyacht.com/api/ocei/vessels/map';

function toNullableNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function normalizeVessel(vessel) {
  return {
    mmsi:
      vessel.mmsi !== null &&
      vessel.mmsi !== undefined
        ? String(vessel.mmsi)
        : null,

    name:
      vessel.name ||
      'Unknown vessel',

    latitude:
      toNullableNumber(
        vessel.latitude,
      ),

    longitude:
      toNullableNumber(
        vessel.longitude,
      ),

    speed:
      toNullableNumber(
        vessel.speed,
      ),

    course:
      toNullableNumber(
        vessel.course,
      ),

    heading:
      toNullableNumber(
        vessel.heading,
      ),

    typeSpecific:
      vessel.typeSpecific ||
      'Unknown',
  };
}

function normalizeAndDeduplicateVessels(
  vessels,
) {
  const vesselsByMmsi =
    new Map();

  vessels.forEach(
    (vessel, index) => {
      const normalizedVessel =
        normalizeVessel(vessel);

      if (
        normalizedVessel.latitude === null ||
        normalizedVessel.longitude === null
      ) {
        return;
      }

      const key =
        normalizedVessel.mmsi ||
        `unknown-${index}`;

      vesselsByMmsi.set(
        key,
        normalizedVessel,
      );
    },
  );

  return Array.from(
    vesselsByMmsi.values(),
  );
}

export async function getVesselsByArea() {
  const response =
    await fetch(
      VESSELS_MAP_API_URL,
      {
        method: 'GET',
        cache: 'no-store',
      },
    );

  if (!response.ok) {
    let message =
      `Failed to fetch vessel positions: ${response.status}`;

    try {
      const errorData =
        await response.json();

      if (errorData?.error) {
        message =
          errorData.error;
      }
    } catch {
      // Response was not JSON.
    }

    throw new Error(message);
  }

  const data =
    await response.json();

  const vessels =
    Array.isArray(data?.vessels)
      ? data.vessels
      : [];

  return {
    source: 'ocei-snapshot',

    snapshot:
      data?.snapshot || null,

    snapshotTime:
      data?.snapshotTime || null,

    totalVessels:
      data?.totalVessels ??
      vessels.length,

    vessels:
      normalizeAndDeduplicateVessels(
        vessels,
      ),
  };
}