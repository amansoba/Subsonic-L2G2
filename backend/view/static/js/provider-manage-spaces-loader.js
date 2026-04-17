import { authFetch, config } from './apiService.js';

// --- Auth Check ---
const checkAuth = () => {
    const session = JSON.parse(localStorage.getItem('subsonic_session') || 'null');
    if (!session || session.role !== 'provider') {
        window.location.href = '../auth/login.html';
        return null;
    }
    return session;
};

// --- UI Rendering ---
const renderSpaces = (spaces, container) => {
    container.innerHTML = '';
    if (!spaces || spaces.length === 0) {
        const row = container.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 7;
        cell.textContent = 'No tienes espacios registrados.';
        cell.style.textAlign = 'center';
        return;
    }

    spaces.forEach(space => {
        const row = container.insertRow();
        row.innerHTML = `
            <td>${space.id}</td>
            <td>Evento ${space.eventId}</td>
            <td>${space.type}</td>
            <td>${space.location}</td>
            <td>€${space.pricePerDay}</td>
            <td><span class="badge" style="background: var(--accent-green);">${space.status}</span></td>
            <td class="right">
                <a href="space.html?id=${space.id}" class="btn small-btn">Ver</a>
                <a href="provider-edit-space.html?id=${space.id}" class="btn small-btn secondary">Editar</a>
            </td>
        `;
    });
};

// --- Page Load ---
const loadProviderSpacesPage = async () => {
    const session = checkAuth();
    if (!session) return;

    const tableBody = document.getElementById('spacesTableBody');
    const loadingRow = tableBody.insertRow();
    const loadingCell = loadingRow.insertCell();
    loadingCell.colSpan = 7;
    loadingCell.textContent = 'Cargando tus espacios...';
    loadingCell.style.textAlign = 'center';

    try {
        const response = await authFetch(`${config.API_BASE_URL}/provider/spaces`);
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '../auth/login.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const spaces = await response.json();
        renderSpaces(spaces, tableBody);
    } catch (error) {
        console.error('Error al cargar los espacios:', error);
        tableBody.innerHTML = '';
        const errorRow = tableBody.insertRow();
        const errorCell = errorRow.insertCell();
        errorCell.colSpan = 7;
        errorCell.textContent = `Hubo un problema al cargar tus espacios. ${error.message}`;
        errorCell.style.textAlign = 'center';
        errorCell.style.color = 'var(--accent-red)';
    }
};

document.addEventListener('DOMContentLoaded', loadProviderSpacesPage);