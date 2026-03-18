import { getUserProfile } from './apiService.js';

// --- Auth Simulation ---
const checkAuth = () => {
    const userId = localStorage.getItem('loggedInUserId');
    if (!userId) {
        window.location.href = '../auth/login.html';
        return null;
    }
    return parseInt(userId, 10);
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
        const purchaseDate = new Date(ticket.purchaseDate);
        const formattedDate = purchaseDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

        row.innerHTML = `
            <td>
                <strong>${ticket.eventName}</strong><br>
                <span class="small">${ticket.ticketId}</span>
            </td>
            <td>${ticket.passName}</td>
            <td>${formattedDate}</td>
            <td><span class="badge" style="background: var(--accent-green);">Válida</span></td>
            <td class="right">
                <a href="ticket.html?id=${ticket.ticketId}" class="btn small-btn">Ver Entrada</a>
            </td>
        `;
    });
};


// --- Page Load ---
const loadTicketsPage = async () => {
    const userId = checkAuth();
    if (!userId) return;

    const tableBody = document.getElementById('ticketsTableBody');
    const loadingRow = tableBody.insertRow();
    const loadingCell = loadingRow.insertCell();
    loadingCell.colSpan = 5;
    loadingCell.textContent = 'Cargando tus entradas...';
    loadingCell.style.textAlign = 'center';

    try {
        const user = await getUserProfile(userId);
        renderTickets(user.tickets, tableBody);
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
