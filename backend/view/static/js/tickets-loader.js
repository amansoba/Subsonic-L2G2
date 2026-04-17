import { authFetch, config } from './apiService.js';

const checkAuth = () => {
    const session = JSON.parse(localStorage.getItem('subsonic_session') || 'null');
    if (!session) {
        window.location.href = '../auth/login.html';
        return null;
    }
    return session;
};

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const toDisplayTicket = (ticket) => ({
    id: ticket.id,
    eventName: ticket.event_name || ticket.eventName || 'Evento',
    passName: ticket.pass_name || ticket.passName || 'Entrada',
    purchaseDate: ticket.purchase_date || ticket.purchaseDate || '',
    status: ticket.status || 'Activa',
});

const getLocalTickets = (session) => {
    if (window.subsonicTickets?.getLocalTicketsForSession) {
        return window.subsonicTickets.getLocalTicketsForSession(session);
    }

    return (window.DB?.tickets || []).filter(ticket =>
        String(ticket.userEmail || '') === String(session.email || '') ||
        String(ticket.userId || '') === String(session.id || '')
    );
};

const mergeTickets = (remoteTickets, localTickets) => {
    const byId = new Map();
    localTickets.forEach(ticket => byId.set(String(ticket.id), ticket));
    remoteTickets.forEach(ticket => byId.set(String(ticket.id), ticket));
    return Array.from(byId.values());
};

const renderTickets = (tickets, container) => {
    container.innerHTML = '';

    if (!tickets || tickets.length === 0) {
        const row = container.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = 'No has comprado ninguna entrada todavia.';
        cell.style.textAlign = 'center';
        return;
    }

    tickets
        .map(toDisplayTicket)
        .sort((a, b) => String(b.purchaseDate).localeCompare(String(a.purchaseDate)))
        .forEach(ticket => {
            const row = container.insertRow();
            row.innerHTML = `
                <td>
                    <strong>${escapeHtml(ticket.eventName)}</strong><br>
                    <span class="small">${escapeHtml(ticket.id)}</span>
                </td>
                <td>${escapeHtml(ticket.passName)}</td>
                <td>${escapeHtml(formatDate(ticket.purchaseDate))}</td>
                <td><span class="badge" style="background: var(--accent-green);">${escapeHtml(ticket.status)}</span></td>
                <td class="right">
                    <a href="ticket.html?id=${encodeURIComponent(ticket.id)}" class="btn small-btn">Ver Entrada</a>
                </td>
            `;
        });
};

const showLoading = (container) => {
    container.innerHTML = '';
    const loadingRow = container.insertRow();
    const loadingCell = loadingRow.insertCell();
    loadingCell.colSpan = 5;
    loadingCell.textContent = 'Cargando tus entradas...';
    loadingCell.style.textAlign = 'center';
};

const loadTicketsPage = async () => {
    const session = checkAuth();
    if (!session) return;

    const tableBody = document.getElementById('ticketsTableBody');
    if (!tableBody) return;

    showLoading(tableBody);
    const localTickets = getLocalTickets(session);

    try {
        const response = await authFetch(`${config.API_BASE_URL}/tickets`);
        if (!response.ok) {
            renderTickets(localTickets, tableBody);
            return;
        }

        const remoteTickets = await response.json();
        remoteTickets.forEach(ticket => {
            window.subsonicTickets?.upsertLocalTicket?.(ticket, session);
        });

        const syncedLocalTickets = getLocalTickets(session);
        renderTickets(mergeTickets(remoteTickets, syncedLocalTickets), tableBody);
    } catch (error) {
        console.warn('No se pudieron cargar entradas del servidor. Usando copia local.', error);
        renderTickets(localTickets, tableBody);
    }
};

document.addEventListener('DOMContentLoaded', loadTicketsPage);
