import { getAllUsers } from './apiService.js';

const renderUsers = (users) => {
    const listContainer = document.getElementById('users-list');
    if (!listContainer) return;

    if (!users || users.length === 0) {
        listContainer.innerHTML = '<p>No hay usuarios para mostrar.</p>';
        return;
    }

    // Usaremos una tabla para una mejor visualización de los datos
    listContainer.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Fecha de Registro</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td><span class="badge">${user.role}</span></td>
                        <td>${user.joinDate}</td>
                        <td>
                            <a href="edit-user.html?id=${user.id}" class="btn btn-sm secondary">Editar</a>
                            <button class="btn btn-sm danger" onclick="alert('Eliminar usuario ID: ${user.id}')">Eliminar</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
};

document.addEventListener('DOMContentLoaded', async () => {
    const session = JSON.parse(localStorage.getItem("subsonic_session") || "null");
    if (!session || session.role !== 'admin') {
        return; // Double check for security
    }

    try {
        const users = await getAllUsers();
        renderUsers(users);
    } catch (error) {
        console.error('Error al cargar los usuarios:', error);
        const listContainer = document.getElementById('users-list');
        if(listContainer) {
            listContainer.innerHTML = '<p>Hubo un error al cargar los usuarios. Revisa la consola.</p>';
        }
    }
});
