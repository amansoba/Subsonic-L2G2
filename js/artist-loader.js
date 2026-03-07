import { getAllArtists } from './apiService.js';

const renderArtists = (artists) => {
  const grid = document.getElementById('artistsGrid');
  if (!grid) {
    console.error('Artist grid container not found.');
    return;
  }
  grid.innerHTML = ''; // Clear loading state

  if (!artists || artists.length === 0) {
    grid.innerHTML = '<p>No artists found.</p>';
    return;
  }

  artists.forEach(artist => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="badge">${artist.genre}</div>
      <h4 class="h-title" style="margin:10px 0 6px 0">${artist.name}</h4>
      <p class="small">${artist.bio}</p>
      <div class="right">
        <a class="btn secondary" href="artist.html?id=${artist.id}">Ver</a>
      </div>
    `;
    grid.appendChild(card);
  });
};

const loadArtists = async () => {
  const grid = document.getElementById('artistsGrid');
  if (!grid) return;

  grid.innerHTML = '<p>Loading artists...</p>';

  try {
    const artists = await getAllArtists();
    renderArtists(artists);
  } catch (error) {
    console.error('Failed to load artists:', error);
    grid.innerHTML = '<p style="color: red;">Could not load artists. Please try again later.</p>';
  }
};

document.addEventListener('DOMContentLoaded', loadArtists);
