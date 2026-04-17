import { config } from './config.js';

export { config };

const SESSION_KEY = 'subsonic_session';

function _getStoredSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
}

function _storeSessionToken(token) {
  const session = _getStoredSession();
  if (!session || !token) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, idToken: token }));
}

function _waitForFirebaseUser(timeoutMs = 3000) {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    return Promise.resolve(null);
  }

  const auth = firebase.auth();
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  return new Promise((resolve) => {
    let unsubscribe = null;
    const timer = setTimeout(() => {
      if (unsubscribe) unsubscribe();
      resolve(auth.currentUser);
    }, timeoutMs);

    unsubscribe = auth.onAuthStateChanged((user) => {
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Returns the current Firebase ID token for Authorization header, or null.
 * Uses the compat SDK (global ``firebase``).
 */
async function _getAuthHeaders() {
  const headers = {};
  if (typeof firebase !== 'undefined' && firebase.auth) {
    const user = await _waitForFirebaseUser();
    if (user) {
      const token = await user.getIdToken();
      _storeSessionToken(token);
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  if (!headers['Authorization']) {
    const session = _getStoredSession();
    if (session?.idToken) {
      headers['Authorization'] = `Bearer ${session.idToken}`;
    }
  }
  return headers;
}

/**
 * Wrapper around fetch that automatically injects the Authorization header
 * when using the real backend. Accepts the same arguments as ``fetch()``.
 */
export async function authFetch(url, options = {}) {
  const authHeaders = await _getAuthHeaders();
  options.headers = { ...(options.headers || {}), ...authHeaders };
  return fetch(url, options);
}

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
      const response = await authFetch(url);
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
      const response = await authFetch(url);
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
      const response = await authFetch(url);
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
      const response = await authFetch(url);
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
 * Fetches all spaces.
 * @returns {Promise<Array<Object>>} A promise that resolves to the list of all spaces.
 */
export const getSpaces = async () => {
  if (config.USE_MOCK_BACKEND) {
    console.log("Using mock backend for all spaces.");
    
    const response = await fetch(config.MOCK_DATA_PATHS.spaces);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const spaces = await response.json();
    return spaces;
  } else {
    console.log("Using real backend for all spaces.");
    const url = `${config.API_BASE_URL}/spaces`;
    try {
      const response = await authFetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const spaces = await response.json();
      return spaces;
    } catch (error) {
      console.error("Failed to fetch all spaces from real API:", error);
      throw error;
    }
  }
};

/**
 * Fetches a single space by its ID.
 * @param {number} spaceId The ID of the space to fetch.
 * @returns {Promise<Object>} A promise that resolves to the space object.
 */
export const getSpaceById = async (spaceId) => {
  if (config.USE_MOCK_BACKEND) {
    console.log(`Using mock backend for space ${spaceId}.`);
    
    
    const spaces = await getSpaces(); // Reuse existing function
    const space = spaces.find(s => s.id === spaceId);

    if (!space) {
      throw new Error(`Space with ID ${spaceId} not found in mock data.`);
    }
    return space;
  } else {
    console.log(`Using real backend for space ${spaceId}.`);
    const url = `${config.API_BASE_URL}/spaces/${spaceId}`;
    try {
      const response = await authFetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const space = await response.json();
      return space;
    } catch (error) {
      console.error(`Failed to fetch space ${spaceId} from real API:`, error);
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
      const response = await authFetch(url);
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
      const response = await authFetch(url);
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
      const response = await authFetch(url);
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

/**
 * Fetches all users.
 * @returns {Promise<Array<Object>>} A promise that resolves to the list of all users.
 */
export const getAllUsers = async () => {
  if (config.USE_MOCK_BACKEND) {
    console.log("Using mock backend for all users.");
    
    const response = await fetch(config.MOCK_DATA_PATHS.users);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const users = await response.json();
    return users;
  } else {
    console.log("Using real backend for all users.");
    const url = `${config.API_BASE_URL}/users`;
    try {
      const response = await authFetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const users = await response.json();
      return users;
    } catch (error) {
      console.error("Failed to fetch all users from real API:", error);
      throw error;
    }
  }
};

/**
 * Fetches the currently authenticated user's profile.
 * @returns {Promise<Object>} A promise that resolves to the current user object.
 */
export const getCurrentUserProfile = async () => {
  if (config.USE_MOCK_BACKEND) {
    const response = await fetch(config.MOCK_DATA_PATHS.users);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const users = await response.json();
    const session = _getStoredSession();
    const user = users.find(u => u.id === session?.id || u.email === session?.email);
    if (!user) {
      throw new Error('User not found in mock data.');
    }
    return user;
  }

  const response = await authFetch(`${config.API_BASE_URL}/me`);
  if (!response.ok) {
    const error = new Error(`HTTP error! status: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
};

/**
 * Updates the currently authenticated user's profile.
 * @param {{name?: string, email?: string}} data The fields to update.
 * @returns {Promise<Object>} A promise that resolves to the updated user object.
 */
export const updateCurrentUserProfile = async (data) => {
  if (config.USE_MOCK_BACKEND) {
    const session = _getStoredSession() || {};
    return { ...session, ...data };
  }

  const response = await authFetch(`${config.API_BASE_URL}/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = new Error(`HTTP error! status: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
};

/**
 * Fetches a user profile by their ID.
 * @param {number} userId The ID of the user to fetch.
 * @returns {Promise<Object>} A promise that resolves to the user object.
 */
export const getUserProfile = async (userId) => {
  if (config.USE_MOCK_BACKEND) {
    console.log(`Using mock backend for user ${userId}.`);
    
    
    const response = await fetch(config.MOCK_DATA_PATHS.users);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const users = await response.json();
    const user = users.find(u => u.id === userId);

    if (!user) {
      throw new Error(`User with ID ${userId} not found in mock data.`);
    }
    return user;
  } else {
    const session = _getStoredSession();
    if (session?.role !== 'admin' && String(session?.id) === String(userId)) {
      return getCurrentUserProfile();
    }

    console.log(`Using real backend for user ${userId}.`);
    const url = `${config.API_BASE_URL}/users/${userId}`;
    try {
      // Here you would also include authentication headers
      const response = await authFetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const user = await response.json();
      return user;
    } catch (error) {
      console.error(`Failed to fetch user ${userId} from real API:`, error);
      throw error;
    }
  }
};

