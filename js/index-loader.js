import { getEvents } from './apiService.js';

const renderEvents = (events) => {
  const eventsContainer = document.getElementById('events-list');
  if (!eventsContainer) return;

  // Clear loading state
  eventsContainer.innerHTML = '';

  if (!events || events.length === 0) {
    eventsContainer.innerHTML = '<p>No upcoming events. Stay tuned!</p>';
    return;
  }

  // Use only the first 3 events for the main page as in the original HTML
  const eventsToShow = events.slice(0, 3);
  let eventsHTML = '';

  eventsToShow.forEach((event, index) => {
    // Format the date
    const eventDate = new Date(event.date);
    const dateOptions = { month: 'long', day: 'numeric' };
    const formattedDate = eventDate.toLocaleDateString('es-ES', dateOptions).toUpperCase();
    
    // For the first event, the date format is different (range)
    const displayDate = event.id === 1 ? 'JULIO 25 – 27, 2026' : formattedDate;
    
    // Generate a simplified link from the event name
    const eventLink = `festivals/${event.name.toLowerCase().replace('subsonic ', '').replace(' ', '-')}.html`;

    eventsHTML += `
      <article class="eventTL">
        <div class="eventTL-date">${displayDate}</div>
        <div class="eventTL-name">${event.name}</div>
        <div class="eventTL-loc">${event.venue} • ${event.city.toUpperCase()}, ES</div>
        <a class="eventTL-btn" href="${eventLink}">INFO <span aria-hidden="true">›</span></a>
      </article>
    `;

    if (index < eventsToShow.length - 1) {
      eventsHTML += '<div class="heroTL-divider" aria-hidden="true"></div>';
    }
  });

  eventsContainer.innerHTML = eventsHTML;
};

const loadPage = async () => {
  const eventsContainer = document.getElementById('events-list');
  if (!eventsContainer) return;

  // Show loading state
  eventsContainer.innerHTML = '<p style="text-align: center; width: 100%;">Loading events...</p>';

  try {
    const events = await getEvents();
    renderEvents(events);
  } catch (error) {
    console.error('Failed to load events:', error);
    eventsContainer.innerHTML = '<p style="text-align: center; width: 100%; color: red;">Could not load events. Please try again later.</p>';
  }
};

// Add event listener to run after the DOM is loaded
document.addEventListener('DOMContentLoaded', loadPage);
