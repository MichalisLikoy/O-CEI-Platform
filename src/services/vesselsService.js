const VESSELS_API_URL =
  'https://agents.sammyacht.com/api/ocei/vessels';

export async function getVessels() {
  const response = await fetch(VESSELS_API_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch vessels. Status: ${response.status}`,
    );
  }

  return response.json();
}