import { getEventWithArtists } from './apiService.js';

// Helper function to split an array into chunks
const chunkArray = (array, size) => {
  const chunkedArr = [];
  for (let i = 0; i < array.length; i += size) {
    chunkedArr.push(array.slice(i, i + size));
  }
  return chunkedArr;
};

const renderArtistLineup = (event) => {
  const lineupContainer = document.getElementById('lineup-container');
  if (!lineupContainer) {
    console.error('Required element with ID "lineup-container" not found.');
    return;
  }

  // Clear loading state
  lineupContainer.innerHTML = '';

  if (!event || !event.fullArtists || event.fullArtists.length === 0) {
    lineupContainer.innerHTML = '<p>Lineup will be announced soon!</p>';
    return;
  }

  // Group artists into "days" (chunks of 5 for this example)
  const artistGroups = chunkArray(event.fullArtists, 5);

  const dayTitles = ["HEADLINERS", "STARS", "CLOSING & SPECIALS", "NEW TALENT", "LEGENDS"];

  artistGroups.forEach((group, index) => {
    const dayNumber = index + 1;
    const dayTitle = dayTitles[index] || `DAY ${dayNumber}`;

    const daySection = document.createElement('div');
    daySection.className = 'lineup-day';
    if (index > 0) {
      daySection.style.marginTop = '20px';
    }

    let artistsHTML = '';
    group.forEach(artist => {
      artistsHTML += `
        <div class="artist-card">
          <span class="artist-name">${artist.name}</span>
          <span class="artist-stage">${artist.genre}</span>
        </div>
      `;
    });

    daySection.innerHTML = `
      <h3 style="margin: 0 0 14px 0; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        DÍA ${dayNumber} - ${dayTitle}
      </h3>
      <div class="artists-grid">
        ${artistsHTML}
      </div>
    `;

    lineupContainer.appendChild(daySection);
  });
};


const loadFestivalPage = async () => {
  const lineupContainer = document.getElementById('lineup-container');
  const eventId = parseInt(document.body.dataset.eventId, 10);

  if (!lineupContainer) {
    console.error('Aborting: lineup-container not found on this page.');
    return;
  }
  
  if (isNaN(eventId)) {
    console.error('Aborting: Missing or invalid data-event-id on body tag.');
    lineupContainer.innerHTML = '<p style="color: red;">Configuration error: Event ID is missing.</p>';
    return;
  }

  // Show loading state
  lineupContainer.innerHTML = '<p>Loading lineup...</p>';

  try {
    const event = await getEventWithArtists(eventId);
    renderArtistLineup(event);
  } catch (error) {
    console.error('Failed to load festival lineup:', error);
    lineupContainer.innerHTML = '<p style="color: red;">Could not load lineup. Please try again later.</p>';
  }
};

// Run the loader
document.addEventListener('DOMContentLoaded', loadFestivalPage);
