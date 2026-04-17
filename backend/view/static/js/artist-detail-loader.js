import { getArtistById } from './apiService.js';
import { escapeHtml, getSpotifyTracksForArtist, serializeSpotifyTracks } from './spotify-tracks.js?v=festival-player-2';

const getArtistId = () => {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'), 10);
    return isNaN(id) ? null : id;
};

const renderArtist = (artist) => {
    if (!artist) {
        document.getElementById('artistDetail').innerHTML = `
            <a class="badge" href="artists.html">← Volver a artistas</a>
            <p class="error-message" style="margin-top:20px;">Artista no encontrado. Por favor, vuelve a la lista y selecciona un artista válido.</p>
        `;
        return;
    }

    document.title = `Subsonic — ${artist.name}`;
    document.getElementById('arName').textContent = artist.name;
    document.getElementById('arGenre').textContent = artist.genre;
    document.getElementById('arBio').textContent = artist.bio;

    const spotifyTracks = getSpotifyTracksForArtist(artist);
    const trackListContainer = document.getElementById('trackList');
    if (spotifyTracks.length === 0) {
        trackListContainer.innerHTML = `
            <div class="card small">
                Todavia no hay canciones de Spotify conectadas para ${escapeHtml(artist.name)}.
            </div>
        `;
    } else {
        trackListContainer.innerHTML = spotifyTracks.map((track, index) => `
            <button
                class="card small spotify-track-card artist-card"
                type="button"
                data-artist="${escapeHtml(artist.name)}"
                data-stage="${escapeHtml(artist.genre)}"
                data-track="${escapeHtml(track.name)}"
                data-spotify-track-id="${escapeHtml(track.id)}"
                data-spotify-start-index="${index}"
                data-spotify-tracks="${serializeSpotifyTracks(spotifyTracks)}"
            >
                <strong>${index + 1}. ${escapeHtml(track.name)}</strong>
                <span class="small">Reproducir en Spotify</span>
            </button>
        `).join('');
    }

    const backButton = document.getElementById('backToEvent');
    if (backButton) {
        backButton.href = 'artists.html';
        backButton.textContent = '← Volver a artistas';
    }

    // Dynamically update the back button if a source event is provided
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('eventId');
    if (eventId && backButton) {
        backButton.href = `event.html?id=${eventId}`;
        backButton.textContent = '← Volver al evento';
    }
};

const loadArtistPage = async () => {
    const artistId = getArtistId();
    const artistDetailContainer = document.getElementById('artistDetail');

    if (artistId === null) {
        artistDetailContainer.innerHTML = '<p class="error-message">No se ha especificado un ID de artista válido.</p>';
        return;
    }

    document.getElementById('arName').textContent = 'Cargando artista...';

    try {
        const artist = await getArtistById(artistId);
        renderArtist(artist);
    } catch (error) {
        console.error('Error al cargar el artista:', error);
        artistDetailContainer.innerHTML = `<p class="error-message">Hubo un problema al cargar el artista. ${error.message}</p>`;
    }
};

document.addEventListener('DOMContentLoaded', loadArtistPage);
