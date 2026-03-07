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

/**
 * Fetches a single event and its associated artists.
 * @param {number} eventId The ID of the event to fetch.
 * @returns {Promise<Object>} A promise that resolves to the event object with a `fullArtists` property.
 */
export const getEventWithArtists = async (eventId) => {
  if (config.USE_MOCK_BACKEND) {
    console.log(`Using mock backend for event ${eventId} with artists.`);
    await simulateLatency();

    // Fetch both events and artists
    const [eventsResponse, artistsResponse] = await Promise.all([
      fetch(config.MOCK_DATA_PATHS.events),
      fetch(config.MOCK_DATA_PATHS.artists)
    ]);

    if (!eventsResponse.ok || !artistsResponse.ok) {
      throw new Error('Failed to fetch mock data.');
    }

    const events = await eventsResponse.json();
    const artists = await artistsResponse.json();

    // Find the specific event
    const event = events.find(e => e.id === eventId);
    if (!event) {
      throw new Error(`Event with ID ${eventId} not found in mock data.`);
    }

    // Map artist IDs to full artist objects
    const artistIdMap = new Map(artists.map(a => [a.id, a]));
    event.fullArtists = event.artists.map(id => artistIdMap.get(id)).filter(Boolean);

    return event;
  } else {
    console.log(`Using real backend for event ${eventId} with artists.`);
    // Theoretical endpoint to get an event with its artists embedded
    const url = `${config.API_BASE_URL}/events/${eventId}?_embed=artists`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const event = await response.json();
      return event; // Assuming the backend returns artists embedded
    } catch (error) {
      console.error(`Failed to fetch event ${eventId} from real API:`, error);
      throw error;
    }
  }
};

