import { getSpaceById } from './apiService.js';

const populateForm = (space) => {
    const form = document.getElementById('edit-space-form');
    if (!form || !space) return;

    form.elements['id'].value = space.id;
    form.elements['eventId'].value = space.eventId;
    form.elements['type'].value = space.type;
    form.elements['size'].value = space.size;
    form.elements['location'].value = space.location;
    form.elements['pricePerDay'].value = space.pricePerDay;
    form.elements['status'].value = space.status;
    form.elements['services'].value = space.services;
    form.elements['notes'].value = space.notes;
};

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const spaceId = parseInt(params.get('id'), 10);

    if (!spaceId) {
        document.getElementById('form-container').innerHTML = '<h1>ID de espacio no especificado</h1><a href="manage-spaces.html" class="btn">Volver a la lista</a>';
        return;
    }

    try {
        const space = await getSpaceById(spaceId);
        populateForm(space);
    } catch (error) {
        console.error('Error al cargar el espacio:', error);
        document.getElementById('form-container').innerHTML = '<h1>Espacio no encontrado</h1><a href="manage-spaces.html" class="btn">Volver a la lista</a>';
    }

    const form = document.getElementById('edit-space-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const updatedSpace = Object.fromEntries(formData.entries());
            
            console.log('Espacio actualizado (simulación):', updatedSpace);
            alert('Espacio actualizado con éxito (simulación). Revisa la consola para ver los datos.');
        });
    }
});
