import { getEvents } from './apiService.js';

const parseLocalDate = (isoDate) => {
    const [year, month, day] = String(isoDate || '').split('-').map(Number);
    if (!year || !month || !day) return new Date(isoDate);
    return new Date(year, month - 1, day);
};

const renderEvents = (events, container) => {
    container.innerHTML = '';

    if (!events || events.length === 0) {
        container.innerHTML = '<p>No se encontraron eventos. ¡Mantente al tanto!</p>';
        return;
    }

    events.forEach(event => {
        const eventDate = parseLocalDate(event.date);
        const month = eventDate.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
        const year = eventDate.getFullYear();
        
        const regionTag = event.region.toLowerCase().replace(/ /g, '-');
        let festivalTag = event.name.toLowerCase().replace('subsonic', '').trim().replace(/ /g, '-');
        if (regionTag === 'españa') {
            festivalTag = `spain ${festivalTag}`;
        } else if (regionTag === 'austria') {
            festivalTag = `winter`;
        } else {
            festivalTag = `world ${festivalTag}`;
        }

        const simpleName = event.name.toLowerCase()
          .replace('subsonic', '')
          .replace('festival', '')
          .trim();
        const eventLink = `../festivals/${simpleName.replace(/ /g, '-')}.html`;

        const festivalCard = document.createElement('div');
        festivalCard.className = 'festival-card';
        festivalCard.setAttribute('data-festival', festivalTag);
        
        let regionFilterTag = 'world';
        if (regionTag === 'españa') regionFilterTag = 'spain';
        if (festivalTag.includes('winter')) regionFilterTag = 'winter';

        festivalCard.setAttribute('data-region', regionFilterTag);
        festivalCard.style.backgroundImage = `url('${event.image}')`;

        festivalCard.innerHTML = `
            <div class="festival-card-image">
                <div class="festival-card-overlay">
                    <span class="festival-badge">${month} ${year}</span>
                </div>
            </div>
            <div class="festival-card-content">
                <div>
                    <h3>${event.name}</h3>
                    <div class="festival-meta">
                        <span>${event.venue} • ${event.city}, ${event.region}</span>
                        <span>${eventDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div class="festival-features">
                        <span>${event.artists.length}+ Artistas</span>
                        <span>Experiencia Inmersiva</span>
                    </div>
                </div>
                <a href="${eventLink}" class="btn">Más Información</a>
            </div>
        `;
        container.appendChild(festivalCard);
    });
};

const setupFiltering = (allEvents, container) => {
    const tabs = document.querySelectorAll('.festival-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const filter = tab.dataset.festival;

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('.festival-card').forEach(card => {
                const cardRegion = card.dataset.region;
                if (filter === 'all' || cardRegion === filter) {
                    card.style.display = '';
                    card.classList.remove('fade-out');
                    card.classList.add('fade-in');
                } else {
                    card.classList.add('fade-out');
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
};


const loadEventsPage = async () => {
    const eventsGrid = document.querySelector('.festivals-grid');
    if (!eventsGrid) {
        console.error('El contenedor .festivals-grid no se encontró.');
        return;
    }

    eventsGrid.innerHTML = '<p class="loading-message">Cargando eventos...</p>';

    try {
        const events = await getEvents();
        renderEvents(events, eventsGrid);
        setupFiltering(events, eventsGrid);
    } catch (error) {
        console.error('Error al cargar los eventos:', error);
        eventsGrid.innerHTML = '<p class="error-message">No se pudieron cargar los eventos. Inténtalo de nuevo más tarde.</p>';
    }
};

document.addEventListener('DOMContentLoaded', loadEventsPage);
