import { getProductById } from './apiService.js';

const getProductId = () => {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'), 10);
    return isNaN(id) ? null : id;
};

const renderProduct = (product) => {
    if (!product) {
        document.getElementById('productBox').innerHTML = `
            <a class="badge" href="store.html">← Volver a Store</a>
            <p class="error-message" style="margin-top:20px;">Producto no encontrado. Por favor, vuelve a la tienda y selecciona un producto válido.</p>
        `;
        return;
    }

    document.title = `Subsonic — ${product.name}`;
    document.getElementById('prName').textContent = product.name;
    document.getElementById('prDesc').textContent = product.desc;
    document.getElementById('prPrice').textContent = `${product.price} €`;
    
    const mainImg = document.getElementById('prMainImg');
    mainImg.src = product.images[0];
    mainImg.alt = product.name;

    const sizeSelect = document.getElementById('prSize');
    sizeSelect.innerHTML = product.sizes.map(size => `<option value="${size}">${size}</option>`).join('');

    // Basic Add to Cart Logic
    const addToCartBtn = document.getElementById('addToCart');
    addToCartBtn.addEventListener('click', () => {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const quantity = parseInt(document.getElementById('prQty').value, 10);
        const size = sizeSelect.value;

        const existingItem = cart.find(item => item.id === product.id && item.size === size);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images[0],
                size: size,
                quantity: quantity
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        alert(`${quantity} x ${product.name} (${size}) añadido al carrito.`);
        // Optionally, update cart count in header if it exists
        const cartCount = document.getElementById('cartCount');
        if(cartCount) {
             const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
             cartCount.textContent = totalItems;
        }
    });
};

const loadProductPage = async () => {
    const productId = getProductId();
    const productBox = document.getElementById('productBox');

    if (productId === null) {
        productBox.innerHTML = '<p class="error-message">No se ha especificado un ID de producto válido.</p>';
        return;
    }

    try {
        const product = await getProductById(productId);
        renderProduct(product);
    } catch (error) {
        console.error('Error al cargar el producto:', error);
        productBox.innerHTML = `<p class="error-message">Hubo un problema al cargar el producto. ${error.message}</p>`;
    }
};

document.addEventListener('DOMContentLoaded', loadProductPage);
