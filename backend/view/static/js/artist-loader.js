import { getAllArtists } from './apiService.js';
import { escapeHtml, getSpotifyTracksForArtist, serializeSpotifyTracks } from './spotify-tracks.js?v=festival-player-2';

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
    const spotifyTracks = getSpotifyTracksForArtist(artist);
    const firstTrack = spotifyTracks[0];
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="badge">${escapeHtml(artist.genre)}</div>
      <h4 class="h-title" style="margin:10px 0 6px 0">${escapeHtml(artist.name)}</h4>
      <p class="small">${escapeHtml(artist.bio)}</p>
      <div class="right">
        <button
          class="btn secondary artist-card"
          type="button"
          data-artist="${escapeHtml(artist.name)}"
          data-stage="${escapeHtml(artist.genre)}"
          data-track="${escapeHtml(firstTrack?.name || 'Spotify')}"
          data-spotify-track-id="${escapeHtml(firstTrack?.id || '')}"
          data-spotify-tracks="${serializeSpotifyTracks(spotifyTracks)}"
        >Escuchar</button>
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
