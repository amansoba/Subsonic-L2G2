import { getSpaces } from './apiService.js';

const renderSpaces = (spaces) => {
    const listContainer = document.getElementById('spaces-list');
    if (!listContainer) return;

    if (!spaces || spaces.length === 0) {
        listContainer.innerHTML = '<p>No hay espacios para mostrar.</p>';
        return;
    }

    // Opcional: para mostrar el nombre del evento, necesitaríamos cargar los eventos también.
    // Por ahora, mostraremos el eventId.
    listContainer.innerHTML = spaces.map(space => `
        <div class="card">
            <div class="badge">${space.status}</div>
            <h4 class="h-title">${space.type} en ${space.location}</h4>
            <p class="small">Evento ID: ${space.eventId} | Tamaño: ${space.size} | Precio: €${space.pricePerDay}/día</p>
            <p class="small">Servicios: ${space.services}</p>
            <div class="right" style="margin-top: 1rem;">
                <button class="btn secondary" onclick="alert('Editar espacio ID: ${space.id} (simulado)')">Editar</button>
                <button class="btn danger" onclick="alert('Eliminar espacio ID: ${space.id} (simulado)')">Eliminar</button>
            </div>
        </div>
    `).join('');
};

document.addEventListener('DOMContentLoaded', async () => {
    const session = JSON.parse(localStorage.getItem("subsonic_session") || "null");
    if (!session || session.role !== 'admin') {
        return;
    }

    try {
        const spaces = await getSpaces();
        renderSpaces(spaces);
    } catch (error) {
        console.error('Error al cargar los espacios:', error);
        const listContainer = document.getElementById('spaces-list');
        if(listContainer) {
            listContainer.innerHTML = '<p>Hubo un error al cargar los espacios. Revisa la consola.</p>';
        }
    }
});
