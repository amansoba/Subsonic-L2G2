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
const renderOrders = (orders, container) => {
    container.innerHTML = '';
    if (!orders || orders.length === 0) {
        container.innerHTML = '<p>No has realizado ningún pedido todavía.</p>';
        return;
    }

    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'card';

        const orderItems = order.items.map(item => `
            <div class="order-item">
                <span>${item.quantity} x ${item.product_name}</span>
                <span>${(item.price * item.quantity).toFixed(2)} €</span>
            </div>
        `).join('');
        
        const orderDate = new Date(order.purchase_date);
        const formattedDate = orderDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

        orderCard.innerHTML = `
            <div class="order-header">
                <div>
                    <h3 class="order-id">Pedido: ${order.id}</h3>
                    <p class="small">Fecha: ${formattedDate}</p>
                </div>
                <div class="order-total">
                    <span>Total</span>
                    <strong>${order.total.toFixed(2)} €</strong>
                </div>
            </div>
            <div class="hr-light"></div>
            <div class="order-items-list">
                ${orderItems}
            </div>
            <div class="right" style="margin-top: 1rem;">
                <a href="#" class="btn small-btn secondary">Ver Factura</a>
            </div>
        `;
        container.appendChild(orderCard);
    });
};


// --- Page Load ---
const loadOrdersPage = async () => {
    if (!checkAuth()) return;

    const ordersListContainer = document.getElementById('ordersList');
    ordersListContainer.innerHTML = '<p>Cargando tus pedidos...</p>';

    try {
        const response = await authFetch(`${config.API_BASE_URL}/orders`);
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '../auth/login.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const orders = await response.json();
        renderOrders(orders, ordersListContainer);
    } catch (error) {
        console.error('Error al cargar los pedidos:', error);
        ordersListContainer.innerHTML = `<p class="error-message">Hubo un problema al cargar tus pedidos. ${error.message}</p>`;
    }
};

document.addEventListener('DOMContentLoaded', loadOrdersPage);
