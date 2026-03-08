import { getUserProfile } from './apiService.js';

const populateForm = (user) => {
    const form = document.getElementById('edit-user-form');
    if (!form || !user) return;

    form.elements['id'].value = user.id;
    form.elements['name'].value = user.name;
    form.elements['email'].value = user.email;
    form.elements['role'].value = user.role;
};

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const userId = parseInt(params.get('id'), 10);

    if (!userId) {
        document.getElementById('form-container').innerHTML = '<h1>ID de usuario no especificado</h1><a href="manage-users.html" class="btn">Volver a la lista</a>';
        return;
    }

    try {
        // Using the existing getUserProfile function which gets a user by ID
        const user = await getUserProfile(userId);
        populateForm(user);
    } catch (error) {
        console.error('Error al cargar el usuario:', error);
        document.getElementById('form-container').innerHTML = '<h1>Usuario no encontrado</h1><a href="manage-users.html" class="btn">Volver a la lista</a>';
    }

    const form = document.getElementById('edit-user-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const updatedUser = Object.fromEntries(formData.entries());
            
            console.log('Usuario actualizado (simulación):', updatedUser);
            alert('Usuario actualizado con éxito (simulación). Revisa la consola para ver los datos.');
        });
    }
});
