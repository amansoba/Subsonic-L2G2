import { getEventWithArtists } from './apiService.js';
import { escapeHtml, getSpotifyTracksForArtist, serializeSpotifyTracks } from './spotify-tracks.js?v=festival-player-2';

const getEventId = () => {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'), 10);
    return isNaN(id) ? null : id;
};

const renderArtistList = (artists, container) => {
    if (!artists || artists.length === 0) {
        container.innerHTML = '<p class="small">No hay artistas confirmados.</p>';
        return;
    }
    container.innerHTML = '';
    artists.forEach(artist => {
        const spotifyTracks = getSpotifyTracksForArtist(artist);
        const firstTrack = spotifyTracks[0];
        const artistCard = document.createElement('div');
        artistCard.className = 'artist-card-small';
        artistCard.innerHTML = `
            <img src="${escapeHtml(artist.photo || artist.image || '../fotos_artistas/placeholder.jpg')}" alt="${escapeHtml(artist.name)}" />
            <span>${escapeHtml(artist.name)}</span>
            <div class="right" style="margin-top:8px;">
                <button
                    class="btn secondary artist-card"
                    type="button"
                    data-artist="${escapeHtml(artist.name)}"
                    data-stage="${escapeHtml(artist.genre)}"
                    data-track="${escapeHtml(firstTrack?.name || 'Spotify')}"
                    data-spotify-track-id="${escapeHtml(firstTrack?.id || '')}"
                    data-spotify-tracks="${serializeSpotifyTracks(spotifyTracks)}"
                >Escuchar</button>
                <a class="btn secondary" href="../events/artist.html?id=${artist.id}">Ver</a>
            </div>
        `;
        container.appendChild(artistCard);
    });
};

const renderPassList = (passes, container) => {
    if (!passes || passes.length === 0) {
        container.innerHTML = '<p class="small">No hay pases disponibles.</p>';
        return;
    }
    container.innerHTML = '';
    passes.forEach(pass => {
        const passCard = document.createElement('div');
        passCard.className = 'pass-card';
        passCard.innerHTML = `
            <div class="pass-info">
                <strong>${pass.name}</strong>
                <span class="pass-price">${pass.price} €</span>
            </div>
            <p class="small">${pass.includes}</p>
            <a href="../events/tickets-purchase.html?passId=${pass.id}" class="btn small-btn">Comprar</a>
        `;
        container.appendChild(passCard);
    });
};

const renderEvent = (event) => {
    if (!event) {
        document.getElementById('eventDetail').innerHTML = `
            <a class="badge" href="events.html">← Volver a eventos</a>
            <p class="error-message" style="margin-top:20px;">Evento no encontrado. Por favor, vuelve a la lista y selecciona un evento válido.</p>
        `;
        return;
    }

    const eventDate = new Date(event.date);
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = eventDate.toLocaleDateString('es-ES', dateOptions);

    document.title = `Subsonic — ${event.name}`;
    document.getElementById('evName').textContent = event.name;
    document.getElementById('evMeta').textContent = `${event.venue} • ${event.city}, ${event.region} • ${formattedDate}`;
    document.getElementById('evDesc').textContent = event.desc;

    const artistListContainer = document.getElementById('artistList');
    renderArtistList(event.fullArtists, artistListContainer);
    
    const passListContainer = document.getElementById('passList');
    renderPassList(event.passes, passListContainer);
};

const loadEventPage = async () => {
    const eventId = getEventId();
    const eventDetailContainer = document.getElementById('eventDetail');

    if (eventId === null) {
        eventDetailContainer.innerHTML = '<p class="error-message">No se ha especificado un ID de evento válido.</p>';
        return;
    }

    // Show a loading state inside the main sections
    document.getElementById('evName').textContent = 'Cargando evento...';
    document.getElementById('artistList').innerHTML = '<p>Cargando artistas...</p>';
    document.getElementById('passList').innerHTML = '<p>Cargando pases...</p>';

    try {
        const event = await getEventWithArtists(eventId);
        renderEvent(event);
    } catch (error) {
        console.error('Error al cargar el evento:', error);
        eventDetailContainer.innerHTML = `<p class="error-message">Hubo un problema al cargar el evento. ${error.message}</p>`;
    }
};

document.addEventListener('DOMContentLoaded', loadEventPage);
