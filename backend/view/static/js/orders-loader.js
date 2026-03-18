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
                <span>${item.quantity} x ${item.name}</span>
                <span>${(item.price * item.quantity).toFixed(2)} €</span>
            </div>
        `).join('');
        
        const orderDate = new Date(order.date);
        const formattedDate = orderDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

        orderCard.innerHTML = `
            <div class="order-header">
                <div>
                    <h3 class="order-id">Pedido: ${order.orderId}</h3>
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
    const userId = checkAuth();
    if (!userId) return;

    const ordersListContainer = document.getElementById('ordersList');
    ordersListContainer.innerHTML = '<p>Cargando tus pedidos...</p>';

    try {
        const user = await getUserProfile(userId);
        renderOrders(user.orders, ordersListContainer);
    } catch (error) {
        console.error('Error al cargar los pedidos:', error);
        ordersListContainer.innerHTML = `<p class="error-message">Hubo un problema al cargar tus pedidos. ${error.message}</p>`;
    }
};

document.addEventListener('DOMContentLoaded', loadOrdersPage);
