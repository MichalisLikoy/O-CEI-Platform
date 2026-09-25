const CONSUMPTION_API_URL =
  'https://agents.sammyacht.com/api/ocei/consumption';

export async function getConsumption({
  date = null,
  from = null,
  to = null,
} = {}) {
  const url = new URL(
    CONSUMPTION_API_URL,
  );

  if (date) {
    url.searchParams.set(
      'date',
      date,
    );
  } else if (from && to) {
    url.searchParams.set(
      'from',
      from,
    );

    url.searchParams.set(
      'to',
      to,
    );
  }

  const response = await fetch(
    url.toString(),
    {
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch consumption. Status: ${response.status}`,
    );
  }

  return response.json();
}

export async function updateRealConsumption(
  consumptionId,
  realConsumption,
) {
  const response = await fetch(
    `${CONSUMPTION_API_URL}/${consumptionId}`,
    {
      method: 'PUT',

      headers: {
        Accept: 'application/json',
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        real_consumption:
          realConsumption,
      }),
    },
  );

  const data =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `Failed to update real consumption. Status: ${response.status}`,
    );
  }

  return data;
}