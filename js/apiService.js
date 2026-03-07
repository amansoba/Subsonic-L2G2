import { config } from './config.js';

/**
 * Simulates network latency.
 * @param {number} min - Minimum delay in milliseconds.
 * @param {number} max - Maximum delay in milliseconds.
 * @returns {Promise<void>}
 */
const simulateLatency = (min = 800, max = 1500) => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Fetches events data.
 * It uses a mock backend if USE_MOCK_BACKEND is true in the config.
 * Otherwise, it fetches from the real API.
 * @returns {Promise<Array<Object>>} A promise that resolves to the list of events.
 */
export const getEvents = async () => {
  if (config.USE_MOCK_BACKEND) {
    console.log("Using mock backend for events.");
    await simulateLatency();
    const response = await fetch(config.MOCK_DATA_PATHS.events);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const events = await response.json();
    return events;
  } else {
    console.log("Using real backend for events.");
    const url = `${config.API_BASE_URL}/events`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        // Handle HTTP errors like 404, 500 etc.
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const events = await response.json();
      return events;
    } catch (error) {
      console.error("Failed to fetch events from real API:", error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }
};

// You can add other API methods here following the same pattern
// export const getArtists = async () => { ... };
// export const getProducts = async () => { ... };
