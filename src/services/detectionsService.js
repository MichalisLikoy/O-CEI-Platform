const API_URL =
  'https://agents.sammyacht.com/api/ocei/detections';

export async function getDetections() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch detections: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(
      'getDetections error:',
      error
    );

    throw error;
  }
}