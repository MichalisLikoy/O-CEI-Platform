const PORT_CALLS_API_URL =
  'https://agents.sammyacht.com/api/ocei/port_calls';

export async function getPortCalls(date = null) {
  const url = new URL(PORT_CALLS_API_URL);

  if (date) {
    url.searchParams.set('date', date);
  }

   const response = await fetch(url.toString(), {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error(
      `Failed to fetch port calls. Status: ${response.status}`,
    );
  }

  return response.json();
}



const ACTIVE_PORT_CALLS_API_URL =
  'https://agents.sammyacht.com/api/ocei/port_calls/active';

export async function getActivePortCalls() {
  const response = await fetch(
    ACTIVE_PORT_CALLS_API_URL,
    {
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch active port calls. Status: ${response.status}`,
    );
  }

  return response.json();
}



export async function createPortCall(portCallData) {
  const response = await fetch(PORT_CALLS_API_URL, {
    method: 'POST',

    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },

    body: JSON.stringify(portCallData),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `Failed to create port call. Status: ${response.status}`,
    );
  }

  return data;
}



export async function updatePortCallTimes(
  portCallId,
  times,
) {
  const response = await fetch(
    `${PORT_CALLS_API_URL}/${portCallId}`,
    {
      method: 'PUT',

      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        ata: times.ata || null,
        atd: times.atd || null,
      }),
    },
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `Failed to update port call. Status: ${response.status}`,
    );
  }

  return data;
}