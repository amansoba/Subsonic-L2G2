import { getEvents } from './apiService.js';

// --- Carousel State & Elements ---
const state = {
    currentIndex: 0,
    totalEvents: 0,
    eventWidth: 0,
    gap: 0,
    isTransitioning: false,
};

const elements = {
    eventsList: document.getElementById('events-list'),
    prevBtn: document.getElementById('prev-event'),
    nextBtn: document.getElementById('next-event'),
};

// --- Carousel Logic ---

function updateCarousel(instant = false) {
    if (instant) {
        elements.eventsList.style.transition = 'none';
    } else {
        elements.eventsList.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
    }
    const offset = -state.currentIndex * (state.eventWidth + state.gap);
    elements.eventsList.style.transform = `translateX(${offset}px)`;
}

function handleInfiniteLoop() {
    state.isTransitioning = false;
    // If we are at a cloned item at the end, jump to the first real item
    if (state.currentIndex >= state.totalEvents) {
        state.currentIndex = 0;
        updateCarousel(true);
    }
    // If we are at a cloned item at the start, jump to the last real item
    if (state.currentIndex < 0) {
        state.currentIndex = state.totalEvents - 1;
        updateCarousel(true);
    }
}

function setupCarousel() {
    const originalEvents = Array.from(elements.eventsList.children);
    if (originalEvents.length === 0) return;

    state.totalEvents = originalEvents.length;
    const itemsToClone = Math.min(state.totalEvents, 3); // Clone up to 3 items

    // Clone first items and append to the end
    for (let i = 0; i < itemsToClone; i++) {
        elements.eventsList.appendChild(originalEvents[i].cloneNode(true));
    }
    // Clone last items and prepend to the beginning
    for (let i = state.totalEvents - 1; i >= state.totalEvents - itemsToClone; i--) {
        elements.eventsList.prepend(originalEvents[i].cloneNode(true));
    }

    const firstEvent = originalEvents[0];
    const style = window.getComputedStyle(firstEvent);
    const marginRight = parseInt(style.marginRight, 10) || 0;
    const marginLeft = parseInt(style.marginLeft, 10) || 0;
    const listStyle = window.getComputedStyle(elements.eventsList);
    state.gap = parseInt(listStyle.gap, 10) || 24;
    state.eventWidth = firstEvent.offsetWidth + marginRight + marginLeft;
    
    // Start at the first "real" item
    state.currentIndex = itemsToClone;
    updateCarousel(true);

    elements.prevBtn.addEventListener('click', () => {
        if (state.isTransitioning) return;
        state.isTransitioning = true;
        state.currentIndex--;
        updateCarousel();
    });

    elements.nextBtn.addEventListener('click', () => {
        if (state.isTransitioning) return;
        state.isTransitioning = true;
        state.currentIndex++;
        updateCarousel();
    });

    elements.eventsList.addEventListener('transitionend', handleInfiniteLoop);
}


// --- Data & Rendering ---

const renderEvents = (events) => {
    if (!elements.eventsList) return;
    elements.eventsList.innerHTML = '';

    if (!events || events.length === 0) {
        elements.eventsList.innerHTML = '<p>No upcoming events. Stay tuned!</p>';
        return;
    }

    events.forEach((event) => {
        const eventDate = new Date(event.date);
        const dateOptions = { month: 'long', day: 'numeric', year: 'numeric' };
        const formattedDate = eventDate.toLocaleDateString('es-ES', dateOptions).toUpperCase();
        
        // Improved logic to generate correct filenames
        const simpleName = event.name.toLowerCase()
          .replace('subsonic', '')
          .replace('festival', '')
          .trim();
        const eventLink = `festivals/${simpleName.replace(/ /g, '-')}.html`;

        const article = document.createElement('article');
        article.className = 'eventTL';
        article.innerHTML = `
            <div class="eventTL-date">${formattedDate}</div>
            <div class="eventTL-name">${event.name}</div>
            <div class="eventTL-loc">${event.venue} • ${event.city.toUpperCase()}, ${event.region.toUpperCase()}</div>
            <a class="eventTL-btn" href="${eventLink}">INFO <span aria-hidden="true">›</span></a>
        `;
        elements.eventsList.appendChild(article);
    });

    setupCarousel();
};

const loadPage = async () => {
    if (!elements.eventsList) return;
    elements.eventsList.innerHTML = '<p style="text-align: center; width: 100%;">Loading events...</p>';

    try {
        const events = await getEvents();
        renderEvents(events);
    } catch (error) {
        console.error('Failed to load events:', error);
        elements.eventsList.innerHTML = '<p style="text-align: center; width: 100%; color: red;">Could not load events. Please try again later.</p>';
    }
};

document.addEventListener('DOMContentLoaded', loadPage);
