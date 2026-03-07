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

/**
 * Fetches all artists.
 * @returns {Promise<Array<Object>>} A promise that resolves to the list of all artists.
 */
export const getAllArtists = async () => {
  if (config.USE_MOCK_BACKEND) {
    console.log("Using mock backend for all artists.");
    await simulateLatency();
    const response = await fetch(config.MOCK_DATA_PATHS.artists);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const artists = await response.json();
    return artists;
  } else {
    console.log("Using real backend for all artists.");
    const url = `${config.API_BASE_URL}/artists`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const artists = await response.json();
      return artists;
    } catch (error) {
      console.error("Failed to fetch all artists from real API:", error);
      throw error;
    }
  }
};

/**
 * Fetches all products.
 * @returns {Promise<Array<Object>>} A promise that resolves to the list of all products.
 */
export const getAllProducts = async () => {
  if (config.USE_MOCK_BACKEND) {
    console.log("Using mock backend for all products.");
    await simulateLatency();
    const response = await fetch(config.MOCK_DATA_PATHS.products);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const products = await response.json();
    return products;
  } else {
    console.log("Using real backend for all products.");
    const url = `${config.API_BASE_URL}/products`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const products = await response.json();
      return products;
    } catch (error) {
      console.error("Failed to fetch all products from real API:", error);
      throw error;
    }
  }
};

/**
 * Fetches all experiences.
 * @returns {Promise<Array<Object>>} A promise that resolves to the list of all experiences.
 */
export const getExperiences = async () => {
  if (config.USE_MOCK_BACKEND) {
    console.log("Using mock backend for all experiences.");
    await simulateLatency();
    const response = await fetch(config.MOCK_DATA_PATHS.experiences);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const experiences = await response.json();
    return experiences;
  } else {
    console.log("Using real backend for all experiences.");
    const url = `${config.API_BASE_URL}/experiences`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const experiences = await response.json();
      return experiences;
    } catch (error) {
      console.error("Failed to fetch all experiences from real API:", error);
      throw error;
    }
  }
};

/**
 * Fetches a single product by its ID.
 * @param {number} productId The ID of the product to fetch.
 * @returns {Promise<Object>} A promise that resolves to the product object.
 */
export const getProductById = async (productId) => {
  if (config.USE_MOCK_BACKEND) {
    console.log(`Using mock backend for product ${productId}.`);
    await simulateLatency();
    
    const products = await getAllProducts(); // Reuse existing function
    const product = products.find(p => p.id === productId);

    if (!product) {
      throw new Error(`Product with ID ${productId} not found in mock data.`);
    }
    return product;
  } else {
    console.log(`Using real backend for product ${productId}.`);
    const url = `${config.API_BASE_URL}/products/${productId}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const product = await response.json();
      return product;
    } catch (error) {
      console.error(`Failed to fetch product ${productId} from real API:`, error);
      throw error;
    }
  }
};

/**
 * Fetches a single artist by their ID.
 * @param {number} artistId The ID of the artist to fetch.
 * @returns {Promise<Object>} A promise that resolves to the artist object.
 */
export const getArtistById = async (artistId) => {
  if (config.USE_MOCK_BACKEND) {
    console.log(`Using mock backend for artist ${artistId}.`);
    await simulateLatency();
    
    const artists = await getAllArtists(); // Reuse existing function
    const artist = artists.find(a => a.id === artistId);

    if (!artist) {
      throw new Error(`Artist with ID ${artistId} not found in mock data.`);
    }
    return artist;
  } else {
    console.log(`Using real backend for artist ${artistId}.`);
    const url = `${config.API_BASE_URL}/artists/${artistId}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const artist = await response.json();
      return artist;
    } catch (error) {
      console.error(`Failed to fetch artist ${artistId} from real API:`, error);
      throw error;
    }
  }
};

