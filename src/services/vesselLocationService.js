const VESSEL_LOCATION_API_URL =
  'https://datadocked.com/api/vessels_operations/get-vessel-location';

function toNullableNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function normalizeVesselLocation(data) {
  return {
    name: data?.name || 'Unknown vessel',
    imo: data?.imo ? String(data.imo) : null,
    mmsi: data?.mmsi ? String(data.mmsi) : null,

    latitude: toNullableNumber(data?.latitude),
    longitude: toNullableNumber(data?.longitude),

    course: toNullableNumber(data?.course),
    heading: toNullableNumber(data?.heading),
    speed: toNullableNumber(data?.speed),

    etaUtc: data?.etaUtc || null,
    atdUtc: data?.atdUtc || null,
    draught: data?.draught || null,
    navigationalStatus:
      data?.navigationalStatus || null,

    destination: data?.destination || null,
    lastPort: data?.lastPort || null,
    callsign: data?.callsign || null,

    positionReceived:
      data?.positionReceived || null,

    updateTime: data?.updateTime || null,

    typeSpecific: data?.typeSpecific || null,
    dataSource: data?.dataSource || null,
  };
}

export async function getVesselLocation(
  imoOrMmsi,
) {
  if (!imoOrMmsi) {
    throw new Error(
      'IMO or MMSI is required.',
    );
  }

  const apiKey =
    import.meta.env.VITE_DATA_DOCKED_API_KEY;

  if (!apiKey) {
    throw new Error(
      'VITE_DATA_DOCKED_API_KEY is missing.',
    );
  }

  const query = new URLSearchParams({
    imo_or_mmsi: String(imoOrMmsi),
  });

  const response = await fetch(
    `${VESSEL_LOCATION_API_URL}?${query.toString()}`,
    {
      headers: {
        Accept: 'application/json',
        'x-api-key': apiKey,
      },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch vessel location. Status: ${response.status}`,
    );
  }

  const data = await response.json();
  const normalizedData =
    normalizeVesselLocation(data);

  if (
    normalizedData.latitude === null ||
    normalizedData.longitude === null
  ) {
    throw new Error(
      'The API did not return valid vessel coordinates.',
    );
  }

  return normalizedData;
}