import { authFetch, config } from './apiService.js';

// --- Auth Check ---
const checkAuth = () => {
    const session = JSON.parse(localStorage.getItem('subsonic_session') || 'null');
    if (!session) {
        window.location.href = '../auth/login.html';
        return false;
    }
    return true;
};


// --- UI Rendering ---
const renderTickets = (tickets, container) => {
    container.innerHTML = ''; // Clear loading message
    if (!tickets || tickets.length === 0) {
        const row = container.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = 'No has comprado ninguna entrada todavía.';
        cell.style.textAlign = 'center';
        return;
    }

    tickets.forEach(ticket => {
        const row = container.insertRow();
        const purchaseDate = new Date(ticket.purchase_date);
        const formattedDate = purchaseDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

        row.innerHTML = `
            <td>
                <strong>${ticket.event_name}</strong><br>
                <span class="small">${ticket.id}</span>
            </td>
            <td>${ticket.pass_name}</td>
            <td>${formattedDate}</td>
            <td><span class="badge" style="background: var(--accent-green);">${ticket.status}</span></td>
            <td class="right">
                <a href="ticket.html?id=${ticket.id}" class="btn small-btn">Ver Entrada</a>
            </td>
        `;
    });
};


// --- Page Load ---
const loadTicketsPage = async () => {
    if (!checkAuth()) return;

    const tableBody = document.getElementById('ticketsTableBody');
    const loadingRow = tableBody.insertRow();
    const loadingCell = loadingRow.insertCell();
    loadingCell.colSpan = 5;
    loadingCell.textContent = 'Cargando tus entradas...';
    loadingCell.style.textAlign = 'center';

    try {
        const response = await authFetch(`${config.API_BASE_URL}/tickets`);
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '../auth/login.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tickets = await response.json();
        renderTickets(tickets, tableBody);
    } catch (error) {
        console.error('Error al cargar las entradas:', error);
        tableBody.innerHTML = '';
        const errorRow = tableBody.insertRow();
        const errorCell = errorRow.insertCell();
        errorCell.colSpan = 5;
        errorCell.textContent = `Hubo un problema al cargar tus entradas. ${error.message}`;
        errorCell.style.textAlign = 'center';
        errorCell.style.color = 'var(--accent-red)';
    }
};

document.addEventListener('DOMContentLoaded', loadTicketsPage);
