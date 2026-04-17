import { getAllProducts } from './apiService.js';

const renderProducts = (products) => {
    const listContainer = document.getElementById('products-list');
    if (!listContainer) return;

    if (!products || products.length === 0) {
        listContainer.innerHTML = '<p>No hay productos para mostrar.</p>';
        return;
    }

    listContainer.innerHTML = products.map(product => `
        <div class="card">
            <div class="badge">${product.category}</div>
            <h4 class="h-title">${product.name}</h4>
            <p class="small">Precio: €${product.price}</p>
            <div class="right" style="margin-top: 1rem;">
                <a href="edit-product.html?id=${product.id}" class="btn secondary">Editar</a>
                <button class="btn danger" onclick="alert('Eliminar producto ID: ${product.id}')">Eliminar</button>
            </div>
        </div>
    `).join('');
};

document.addEventListener('DOMContentLoaded', async () => {
    // Require admin role
    const session = JSON.parse(localStorage.getItem("subsonic_session") || "null");
    if (!session || session.role !== 'admin') {
        // Redirect or show error if not admin
        // This is a double check, as app.js should already handle it.
        return;
    }

    try {
        const products = await getAllProducts();
        renderProducts(products);
    } catch (error) {
        console.error('Error al cargar los productos:', error);
        const listContainer = document.getElementById('products-list');
        if(listContainer) {
            listContainer.innerHTML = '<p>Hubo un error al cargar los productos. Revisa la consola.</p>';
        }
    }
});
