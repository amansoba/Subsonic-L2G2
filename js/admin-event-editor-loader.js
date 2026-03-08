import { getEvents } from './apiService.js';

// --- Contenedores ---
const listContainer = document.getElementById('events-list-container');
const formContainer = document.getElementById('event-form-container');
const eventsListDiv = document.getElementById('events-list');

/**
 * Genera el HTML del formulario de edición.
 * @returns {string} HTML del formulario.
 */
const getFormHtml = () => `
  <h1 class="h-title">Modificar Evento</h1>
  <form id="edit-event-form" class="card">
    <input type="hidden" name="id" />
    <label>Nombre del evento</label>
    <input name="name" required />
    <label>Fecha</label>
    <input type="date" name="date" required />
    <label>Lugar</label>
    <input name="venue" />
    <label>Ciudad</label>
    <input name="city" />
    <label>Región</label>
    <input name="region" />
    <label>Descripción</label>
    <textarea name="desc" rows="4"></textarea>
    <div style="margin-top:8px">
        <button class="btn" type="submit">Guardar Cambios</button>
        <a href="edit-event.html" class="btn btn-secondary">Volver a la lista</a>
    </div>
  </form>
`;

/**
 * Rellena el formulario con los datos de un evento.
 * @param {object} event - El objeto del evento.
 */
const populateForm = (event) => {
    const form = document.getElementById('edit-event-form');
    if (!form || !event) return;

    form.elements['id'].value = event.id;
    form.elements['name'].value = event.name;
    form.elements['date'].value = event.date; 
    form.elements['venue'].value = event.venue;
    form.elements['city'].value = event.city;
    form.elements['region'].value = event.region;
    form.elements['desc'].value = event.desc;
};

/**
 * Muestra la lista de eventos.
 * @param {Array<object>} events - La lista de eventos.
 */
const displayEventsList = (events) => {
    listContainer.style.display = 'block';
    formContainer.style.display = 'none';

    if (!events || events.length === 0) {
        eventsListDiv.innerHTML = '<p>No hay eventos para mostrar.</p>';
        return;
    }

    eventsListDiv.innerHTML = events.map(event => `
        <a href="?id=${event.id}" class="card-link">
            <div class="card">
                <h5>${event.name}</h5>
                <p>${event.city}, ${event.region}</p>
                <small>${event.date}</small>
            </div>
        </a>
    `).join('');
};

/**
 * Muestra el formulario de edición para un evento específico.
 * @param {number} eventId - El ID del evento a editar.
 * @param {Array<object>} events - La lista de todos los eventos.
 */
const displayEditForm = (eventId, events) => {
    listContainer.style.display = 'none';
    formContainer.style.display = 'block';

    const eventToEdit = events.find(e => e.id === eventId);
            
    if (eventToEdit) {
        formContainer.innerHTML = getFormHtml();
        populateForm(eventToEdit);

        const eventForm = document.getElementById('edit-event-form');
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(eventForm);
            const updatedEvent = Object.fromEntries(formData.entries());
            
            console.log('Evento actualizado (simulación):', updatedEvent);
            alert('Evento actualizado con éxito (simulación). Consulta la consola para ver los datos.');
        });
    } else {
        formContainer.innerHTML = '<h1>Evento no encontrado</h1><a href="edit-event.html">Volver a la lista</a>';
    }
};

// --- Lógica Principal ---
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const eventId = parseInt(params.get('id'), 10);

    try {
        const events = await getEvents();

        if (eventId) {
            // Mostrar el formulario para un evento específico
            displayEditForm(eventId, events);
        } else {
            // Mostrar la lista de todos los eventos
            displayEventsList(events);
        }
    } catch (error) {
        console.error('Error al cargar los eventos:', error);
        document.getElementById('edit-event-page').innerHTML = '<h1>Error al cargar los datos.</h1><p>Revisa la consola para más detalles.</p>';
    }
});
