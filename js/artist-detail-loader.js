import { getArtistById } from './apiService.js';

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

    // Placeholder for tracklist
    const trackListContainer = document.getElementById('trackList');
    trackListContainer.innerHTML = `
        <div class="card small"><strong>Track 1:</strong> ${artist.name}'s Greatest Hit (Demo)</div>
        <div class="card small"><strong>Track 2:</strong> Festival Anthem (Demo)</div>
        <div class="card small"><strong>Track 3:</strong> Midnight Drive (Demo)</div>
        <div class="card small"><strong>Track 4:</strong> Sunrise Groove (Demo)</div>
    `;

    // Dynamically update the back button if a source event is provided
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('eventId');
    if (eventId) {
        const backButton = document.getElementById('backToEvent');
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
